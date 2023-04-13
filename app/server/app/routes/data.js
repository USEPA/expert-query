import cors from 'cors';
import express from 'express';
import Excel from 'exceljs';
import { tableConfig } from '../config/tableConfig.js';
import { getActiveSchema } from '../middleware.js';
import { appendToWhere, knex } from '../utilities/database.js';
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

/** Get a subquery if "Latest" is used
 * @param {Object} query KnexJS query object
 * @param {Object} columnName name of the "Latest" column
 * @param {Object} columnType data type of the "Latest" column
 * @returns {Object} a different KnexJS query object
 */
function getLatestSubquery(query, columnName, columnType) {
  if (columnType !== 'numeric' && columnType !== 'timestamptz') return;

  const subQuery = query.clone();
  subQuery.select('organizationid').max(columnName).groupBy('organizationid');
  return subQuery;
}

/**
 * Creates a stream object from a query.
 * @param {Object} query KnexJS query object
 * @returns {Object} a readable stream
 */
function createStream(query) {
  const stream = query.stream({
    batchSize: parseInt(process.env.STREAM_BATCH_SIZE),
    highWaterMark: parseInt(process.env.STREAM_HIGH_WATER_MARK),
  });

  // close the stream if the request is canceled
  stream.on('close', stream.end.bind(stream));
  return stream;
}

/**
 * Streams the results of a query as a file attachment.
 * @param {Object} query KnexJS query object
 * @param {Express.Response} res
 * @param {string} format the format of the file attachment
 * @param {string} baseName the name of the file without the extension
 */
async function streamFile(query, res, format, baseName) {
  query.limit(parseInt(process.env.MAX_QUERY_SIZE));

  res.setHeader(
    'Content-disposition',
    `attachment; filename=${baseName}.${format}`,
  );

  if (format === 'xlsx') {
    const workbook = new Excel.stream.xlsx.WorkbookWriter({
      stream: res,
      useStyles: true,
    });
    const worksheet = workbook.addWorksheet('data');

    StreamingService.streamResponse(res, createStream(query), format, {
      workbook,
      worksheet,
    });
  } else {
    StreamingService.streamResponse(res, createStream(query), format);
  }
}

/**
 * Streams the results of a query as paginated JSON.
 * @param {Object} query KnexJS query object
 * @param {Express.Response} res
 * @param {number} offset record number from which rows are returned
 */
async function streamJson(query, res, offset) {
  query.offset(offset);
  query.limit(parseInt(process.env.JSON_PAGE_SIZE));

  const hasMore = (await checkQueryCount(query)) === null;
  const nextOffset = hasMore
    ? offset + parseInt(process.env.JSON_PAGE_SIZE)
    : null;

  if (nextOffset > parseInt(process.env.MAX_QUERY_SIZE)) return;

  StreamingService.streamResponse(
    res,
    createStream(query),
    'json',
    null,
    nextOffset,
  );
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
  const optionsParams = ['f', 'format', 'skipCount', 'offset'];
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
  // get a subquery for when "Latest" is used,
  // so that we can apply the same filters to the subquery
  const latestColumn = profile.columns.find((col) => col.default === 'latest');
  const subQuery = latestColumn
    ? getLatestSubquery(query, latestColumn.name, latestColumn.type)
    : null;

  // build select statement of the query
  let selectText = undefined;
  if (!countOnly) {
    // filter down to requested columns, if the user provided that option
    const columnsToReturn = [];
    queryParams.columns?.forEach((col) => {
      const profileCol = profile.columns.find((pc) => pc.alias === col);
      if (profileCol) columnsToReturn.push(profileCol);
    });

    // build the select query
    const selectColumns =
      columnsToReturn.length > 0 ? columnsToReturn : profile.columns;
    selectText = selectColumns.map((col) =>
      col.name === col.alias ? col.name : `${col.name} AS ${col.alias}`,
    );
  }
  query.select(selectText);

  // build where clause of the query
  profile.columns.forEach((col) => {
    const lowArg = 'lowParam' in col && queryParams.filters[col.lowParam];
    const highArg = 'highParam' in col && queryParams.filters[col.highParam];
    const exactArg = queryParams.filters[col.alias];
    if (lowArg || highArg) {
      appendRangeToWhere(query, col, lowArg, highArg);
      if (subQuery) appendRangeToWhere(subQuery, col, lowArg, highArg);
    } else if (exactArg) {
      appendToWhere(query, col.name, queryParams.filters[col.alias]);
      if (subQuery)
        appendToWhere(subQuery, col.name, queryParams.filters[col.alias]);
    }
  });

  if (subQuery) {
    // add the "latest" subquery to the where clause
    query.whereIn(['organizationid', latestColumn.name], subQuery);
  }
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

    // Check that the query doesn't exceed the MAX_QUERY_SIZE.
    // This check can be bypassed by setting the 'skipCount' option to true,
    // but the query itself will still be limited by MAX_QUERY_SIZE.
    const shouldCheckCount = !queryParams.options.skipCount;
    if (shouldCheckCount && (await checkQueryCount(query)) === null) {
      return res.status(200).json({
        message: `The current query exceeds the maximum query size. Please refine the search, or visit ${process.env.SERVER_URL}/national-downloads to download a compressed dataset`,
      });
    }

    const format = queryParams.options.format ?? queryParams.options.f;
    if (['csv', 'tsv', 'xlsx'].includes(format)) {
      await streamFile(query, res, format, profile.tableName);
    } else {
      const offset = queryParams.options.offset
        ? parseInt(queryParams.options.offset)
        : 0;
      await streamJson(query, res, offset);
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
 * Counts the number of rows returned be a specified query without modifying
 * the query object. Limited by a format-specific configuration
 * @param {Object} query KnexJS query object
 * @returns {Object | null} object with 'count' property, or null if limit exceeded
 */
async function checkQueryCount(query, singlePage = false) {
  const limit = singlePage
    ? parseInt(process.env.JSON_PAGE_SIZE)
    : parseInt(process.env.MAX_QUERY_SIZE);
  const count = await knex
    .from(
      query
        .clone()
        .limit(limit + 1)
        .as('q'),
    )
    .count()
    .first();

  if (parseInt(count.count) > limit) return null;
  return count;
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

    checkQueryCount(query).then((count) => {
      if (!count) {
        res.status(200).json({
          message: `The current query exceeds the maximum query size. Please refine the search, or visit ${process.env.SERVER_URL}/national-downloads to download a compressed dataset`,
        });
      } else {
        res.status(200).send(count);
      }
    });
  } catch (error) {
    log.error(
      `Failed to get count from the "${profile.tableName}" table:`,
      error,
    );
    return res.status(error.code ?? 500).json(error);
  }
}

export default function (app, basePath) {
  const router = express.Router();

  router.use(getActiveSchema);

  const corsOptions = {
    methods: 'GET,HEAD,POST',
  };

  Object.entries(tableConfig).forEach(([profileName, profile]) => {
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

  app.use(`${basePath}attains/data`, router);
}
