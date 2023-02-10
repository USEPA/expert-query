import cors from 'cors';
import express from 'express';
import Excel from 'exceljs';
import { getActiveSchema } from '../middleware.js';
import { appendToWhere, knex, mapping } from '../utilities/database.js';
import { log } from '../utilities/logger.js';
import StreamingService from '../utilities/streamingService.js';

class DuplicateParameterException extends Error {
  constructor(parameter) {
    super();
    this.code = 400;
    this.message = `Duplicate '${parameter}' parameters not allowed`;
  }
}

class InvalidParameterException extends Error {
  constructor(parameter) {
    super();
    this.code = 400;
    this.message = `The parameter '${parameter}' is not valid for the specified profile`;
  }
}

function appendLatestToWhere(query, column, columnType, baseQuery) {
  if (columnType !== 'numeric' && columnType !== 'timestamptz') return;

  const subQuery = baseQuery.clone();
  query.where(column, subQuery.max(column));
}

/**
 * Append a range to the where clause of the provided query.
 * @param {Object} query KnexJS query object
 * @param {Object} column column mapping object
 * @param {string} lowParamValue URL query low value
 * @param {string} highParamValue URL query high value
 */
function appendRangeToWhere(query, column, lowParamValue, highParamValue) {
  const isTimestampColumn = column.type === 'timestamptz';
  const lowValue = isTimestampColumn
    ? dateToUtcTime(lowParamValue)
    : lowParamValue;
  const highValue = isTimestampColumn
    ? dateToUtcTime(highParamValue, true)
    : highParamValue;

  if (!lowValue && !highValue) return;

  if (lowValue && highValue) {
    query.whereBetween(column.name, [lowValue, highValue]);
  } else if (lowValue) {
    query.where(column.name, '>=', lowValue);
  } else {
    query.where(column.name, '<=', highValue);
  }
}

/**
 * Creates an ISO date string with no timezone offset from a given date string.
 * @param {string} value the date string to be converted to ISO format
 * @param {boolean} whether the returned time should represent midnight at the start or end of day
 * @returns {string}
 */
function dateToUtcTime(value, endOfDay = false) {
  if (!value) return null;

  const date = new Date(value);
  if (isNaN(date)) return null;

  const dateString = date.toISOString().substring(0, 10);
  if (endOfDay) return `${dateString}T24:00Z`;
  return `${dateString}T00:00Z`;
}

/**
 * Gets the query parameters from the request.
 * @param {express.Request} req
 * @returns request query parameters
 */
function getQueryParams(req) {
  // return post parameters, default to empty objects if not provided
  if (req.method === 'POST') {
    return {
      filters: req.body.filters ?? {},
      options: req.body.options ?? {},
      columns: req.body.columns ?? null,
    };
  }

  // organize GET parameters to follow what we expect from POST
  const optionsParams = ['f', 'format'];
  const parameters = {
    filters: {},
    options: {},
    columns: null,
  };
  Object.entries(req.query).forEach(([name, value]) => {
    if (optionsParams.includes(name)) parameters.options[name] = value;
    else if (name === 'columns') parameters.columns = value;
    else parameters.filters[name] = value;
  });

  return parameters;
}

/**
 * Builds the select clause and where clause of the query based on the provided
 * profile name.
 * @param {Object} query KnexJS query object
 * @param {Object} profile definition of the profile being queried
 * @param {Object} queryParams URL query value
 * @param {boolean} countOnly (Optional) should query for count only
 */
function parseCriteria(query, profile, queryParams, countOnly = false) {
  const baseQuery = query.clone();
  // build select statement of the query
  if (countOnly) query.count();
  else {
    // filter down to requested columns, if the user provided that option
    const columnsToReturn = profile.columns.filter(
      (col) => queryParams.columns && queryParams.columns.includes(col.alias),
    );

    // build the select query
    const selectColumns =
      columnsToReturn.length > 0 ? columnsToReturn : profile.columns;
    const selectText = selectColumns.map((col) =>
      col.name === col.alias ? col.name : `${col.name} AS ${col.alias}`,
    );
    query.select(selectText);
  }

  // build where clause of the query
  profile.columns.forEach((col) => {
    const lowArg = 'lowParam' in col && queryParams.filters[col.lowParam];
    const highArg = 'highParam' in col && queryParams.filters[col.highParam];
    const exactArg = queryParams.filters[col.alias];
    if (lowArg || highArg) {
      appendRangeToWhere(query, col, lowArg, highArg);
    } else if (exactArg) {
      appendToWhere(query, col.name, queryParams.filters[col.alias]);
    } else if (col.default === 'latest') {
      appendLatestToWhere(query, col.name, col.type, baseQuery);
    }
  });
}

/**
 * Runs a query against the provided profile name and streams the result to the
 * client as csv, tsv, xlsx, json file, or inline json.
 * @param {Object} profile definition of the profile being queried
 * @param {express.Request} req
 * @param {express.Response} res
 */
async function executeQuery(profile, req, res) {
  // output types csv, tab-separated, Excel, or JSON
  try {
    const query = knex.withSchema(req.activeSchema).from(profile.tableName);

    const queryParams = getQueryParams(req);

    validateQueryParams(queryParams, profile);

    parseCriteria(query, profile, queryParams);

    const stream = await query.stream({
      batchSize: parseInt(process.env.STREAM_BATCH_SIZE),
      highWaterMark: parseInt(process.env.STREAM_HIGH_WATER_MARK),
    });

    // close the stream if the request is canceled
    stream.on('close', stream.end.bind(stream));

    const format = queryParams.options.format ?? queryParams.options.f;
    switch (format) {
      case 'csv':
      case 'tsv':
        // output the data
        res.setHeader(
          'Content-disposition',
          `attachment; filename=${profile.tableName}.${format}`,
        );
        StreamingService.streamResponse(res, stream, format);
        break;
      case 'xlsx':
        res.setHeader(
          'Content-Disposition',
          `attachment; filename=${profile.tableName}.xlsx`,
        );

        const workbook = new Excel.stream.xlsx.WorkbookWriter({
          stream: res,
          useStyles: true,
        });

        const worksheet = workbook.addWorksheet('data');

        StreamingService.streamResponse(res, stream, format, {
          workbook,
          worksheet,
        });
        break;
      case 'json':
        res.setHeader(
          'Content-disposition',
          `attachment; filename=${profile.tableName}.json`,
        );
        StreamingService.streamResponse(res, stream, format);
        break;
      default:
        StreamingService.streamResponse(res, stream, format);
        break;
    }
  } catch (error) {
    log.error(`Failed to get data from the "${profile.tableName}" table...`);
    return res.status(error.code ?? 500).json(error);
  }
}

/**
 * Throws an error if multiple instances of a parameter were provided
 * for an option or filter that accepts a single argument only
 * @param {Object} queryFilters URL query value for filters
 * @param {Object} profile definition of the profile being queried
 */
function validateQueryParams(queryParams, profile) {
  Object.entries(queryParams.options).forEach(([name, value]) => {
    if (Array.isArray(value)) throw new DuplicateParameterException(name);
  });
  Object.entries(queryParams.filters).forEach(([name, value]) => {
    const column = profile.columns.find((c) => {
      if (c.lowParam === name || c.highParam === name || c.alias === name)
        return c;
    });
    if (!column) throw new InvalidParameterException(name);
    if (Array.isArray(value)) {
      if (
        column.lowParam === name ||
        column.highParam === name ||
        (column.alias === name && column.acceptsMultiple === false)
      )
        throw new DuplicateParameterException(name);
    }
  });
}

/**
 * Runs a query against the provided profile name and returns the number of records.
 * @param {Object} profile definition of the profile being queried
 * @param {express.Request} req
 * @param {express.Response} res
 */
function executeQueryCountOnly(profile, req, res) {
  // always return json with the count
  try {
    const query = knex.withSchema(req.activeSchema).from(profile.tableName);

    const queryParams = getQueryParams(req);

    validateQueryParams(queryParams, profile);

    parseCriteria(query, profile, queryParams, true);

    query
      .first()
      .then((count) => res.status(200).send(count))
      .catch((error) => {
        log.error(
          `Failed to get count from the "${profile.tableName}" table: `,
          error,
        );
        res.status(500).json(error);
      });
  } catch (error) {
    log.error(
      `Failed to get count from the "${profile.tableName}" table:`,
      error,
    );
    return res.status(error.code ?? 500).json(error);
  }
}

export default function (app) {
  const router = express.Router();

  router.use(getActiveSchema);

  const corsOptions = {
    methods: 'GET,HEAD,POST',
  };

  Object.entries(mapping).forEach(([profileName, profile]) => {
    // create get requests
    router.get(`/${profileName}`, cors(corsOptions), function (req, res) {
      executeQuery(profile, req, res);
    });
    router.get(`/${profileName}/count`, cors(corsOptions), function (req, res) {
      executeQueryCountOnly(profile, req, res);
    });

    // create post requests
    router.post(`/${profileName}`, cors(corsOptions), function (req, res) {
      executeQuery(profile, req, res);
    });
    router.post(
      `/${profileName}/count`,
      cors(corsOptions),
      function (req, res) {
        executeQueryCountOnly(profile, req, res);
      },
    );
  });

  app.use('/attains/data', router);
}
