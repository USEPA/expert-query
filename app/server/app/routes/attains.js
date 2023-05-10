import AWS from 'aws-sdk';
import cors from 'cors';
import express from 'express';
import Excel from 'exceljs';
import { readdirSync, statSync } from 'node:fs';
import path, { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tableConfig } from '../config/tableConfig.js';
import { getActiveSchema, protectRoutes } from '../middleware.js';
import { appendToWhere, knex } from '../utilities/database.js';
import { getEnvironment } from '../utilities/environment.js';
import {
  formatLogMsg,
  log,
  populateMetdataObjFromRequest,
} from '../utilities/logger.js';
import StreamingService from '../utilities/streamingService.js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const jsonPageSize = parseInt(process.env.JSON_PAGE_SIZE);
const maxQuerySize = parseInt(process.env.MAX_QUERY_SIZE);

const minDateTime = new Date(-8640000000000000);
const maxDateTime = new Date(8640000000000000);

const environment = getEnvironment();

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

/**
 * Searches for a materialized view, associated with the profile, that is applicable to the provided columns/filters.
 * @param {Object} profile definition of the profile being queried
 * @param {Array<Object>} columns definitions of columns to return, where the first is the primary column
 * @param {Array<string>} columnsForFilter names of columns that can be used to filter
 * @returns definition of a materialized view that is applicable to the desired columns/filters or null if none are suitable
 */
function findMaterializedView(profile, columns, columnsForFilter) {
  // search through tableconfig.materializedViews to see if the column
  // we need is in here
  return profile.materializedViews.find((mv) => {
    for (const col of columnsForFilter.concat(columns.map((c) => c.name))) {
      if (!mv.columns.find((mvCol) => mvCol.name === col)) return;
    }
    return mv;
  });
}

/**
 * Finds full column definitions for the provided array of column aliases
 * @param {Array<string>} columnAliases array of column aliases to get full column definitions for
 * @param {Object} profile definition of the profile being queried
 * @returns Array of full column definitions
 */
function getColumnsFromAliases(columnAliases, profile) {
  const columns = [];
  for (const alias of columnAliases) {
    const column = profile.columns
      .concat(profile.materializedViewColumns ?? [])
      .find((col) => col.alias === alias);
    if (!column) {
      return res.status(404).json({
        message: `The column ${alias} does not exist on the selected profile`,
      });
    }
    columns.push(column);
  }

  return columns;
}

/** Get a subquery if "Latest" is used
 * @param {Object} query KnexJS query object
 * @param {Object} columnName name of the "Latest" column
 * @param {Object} columnType data type of the "Latest" column
 * @returns {Object} a different KnexJS query object
 */
function createLatestSubquery(req, profile, params, columnName, columnType) {
  if (columnType !== 'numeric' && columnType !== 'timestamptz') return;

  const columnAliases = ['organizationId', 'region', 'reportingCycle', 'state'];

  const columns = getColumnsFromAliases(columnAliases, profile);

  // get columns for where clause
  const columnsForFilter = [];
  const columnNamesForFilter = [];
  columns.forEach((col) => {
    if (params.filters.hasOwnProperty(col.alias)) {
      columnsForFilter.push(col);
      columnNamesForFilter.push(col.name);
    }
  });

  // search for materialized view tableConfig
  const materializedView = findMaterializedView(
    profile,
    columns,
    columnNamesForFilter,
  );

  // build the base of the subquery
  const query = knex
    .withSchema(req.activeSchema)
    .select('organizationid')
    .max(columnName)
    .from(materializedView?.name || profile.tableName)
    .groupBy('organizationid');

  // build a where clause
  columnsForFilter.forEach((col) => {
    appendToWhere(query, col.name, params.filters[col.alias]);
  });

  return query;
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
  query.limit(maxQuerySize);

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
 * @param {number} startId current objectid to start returning results from
 */
async function streamJson(query, res, startId) {
  if (startId) query.where('objectid', '>=', startId);

  const nextId =
    (
      await knex
        .select('objectId')
        .from(query.clone().limit(maxQuerySize).as('q'))
        .offset(jsonPageSize)
        .limit(1)
        .first()
    )?.objectId ?? null;

  query.limit(jsonPageSize);

  StreamingService.streamResponse(
    res,
    createStream(query),
    'json',
    null,
    nextId,
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
  const optionsParams = ['f', 'format', 'startId'];
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
function parseCriteria(req, query, profile, queryParams, countOnly = false) {
  // get a subquery for when "Latest" is used,
  // so that we can apply the same filters to the subquery
  const latestColumn = profile.columns.find((col) => col.default === 'latest');
  const subQuery =
    latestColumn && !queryParams.filters.hasOwnProperty(latestColumn.alias)
      ? createLatestSubquery(
          req,
          profile,
          queryParams,
          latestColumn.name,
          latestColumn.type,
        )
      : null;

  // build select statement of the query
  let selectText = undefined;
  if (!countOnly) {
    // filter down to requested columns, if the user provided that option
    const columnsToReturn = [];
    const columns = queryParams.columns ?? [];
    if (!columns.includes('objectId')) columns.push('objectId');
    columns.forEach((col) => {
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
  query.select(selectText).orderBy('objectid', 'asc');

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
  const metadataObj = populateMetdataObjFromRequest(req);

  // output types csv, tab-separated, Excel, or JSON
  try {
    const query = knex
      .withSchema(req.activeSchema)
      .from(profile.tableName)
      .limit(parseInt(process.env.MAX_QUERY_SIZE));

    const queryParams = getQueryParams(req);

    validateQueryParams(queryParams, profile);

    parseCriteria(req, query, profile, queryParams);

    // Check that the query doesn't exceed the MAX_QUERY_SIZE.
    if ((await checkQueryCount(query)) === null) {
      return res.status(200).json({
        message: `The current query exceeds the maximum query size. Please refine the search, or visit ${process.env.SERVER_URL}/national-downloads to download a compressed dataset`,
      });
    }

    const format = queryParams.options.format ?? queryParams.options.f;
    if (['csv', 'tsv', 'xlsx'].includes(format)) {
      await streamFile(query, res, format, profile.tableName);
    } else {
      const startId = queryParams.options.startId
        ? parseInt(queryParams.options.startId)
        : null;
      await streamJson(query, res, startId);
    }
  } catch (error) {
    log.error(
      formatLogMsg(
        metadataObj,
        `Failed to get data from the "${profile.tableName}" table...`,
        error,
      ),
    );
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
 * Counts the number of rows returned be a specified
 * query without modifying the query object
 * @param {Object} query KnexJS query object
 * @returns {Object | null} object with 'count' property, or null if limit exceeded
 */
async function checkQueryCount(query) {
  const count = await knex
    .from(
      query
        .clone()
        .limit(maxQuerySize + 1)
        .as('q'),
    )
    .count()
    .first();

  const countInt = parseInt(count.count);
  if (countInt > maxQuerySize) return null;
  return countInt;
}

/**
 * Runs a query against the provided profile name and returns the number of records.
 * @param {Object} profile definition of the profile being queried
 * @param {express.Request} req
 * @param {express.Response} res
 */
function executeQueryCountOnly(profile, req, res) {
  const metadataObj = populateMetdataObjFromRequest(req);

  // always return json with the count
  try {
    const query = knex.withSchema(req.activeSchema).from(profile.tableName);

    const queryParams = getQueryParams(req);

    validateQueryParams(queryParams, profile);

    parseCriteria(req, query, profile, queryParams, true);

    checkQueryCount(query).then((count) => {
      if (count === null) {
        res.status(200).json({
          message: `The current query exceeds the maximum query size. Please refine the search, or visit ${process.env.SERVER_URL}/national-downloads to download a compressed dataset`,
        });
      } else {
        res.status(200).json({ count });
      }
    });
  } catch (error) {
    log.error(
      formatLogMsg(
        metadataObj,
        `Failed to get count from the "${profile.tableName}" table:`,
        error,
      ),
    );
    return res.status(error.code ?? 500).json(error);
  }
}

/**
 * Retrieves the domain values for a single table column.
 * @param {express.Request} req
 * @param {express.Response} res
 */
function executeValuesQuery(req, res) {
  const metadataObj = populateMetdataObjFromRequest(req);

  const profile = tableConfig[req.params.profile];
  if (!profile) {
    return res
      .status(404)
      .json({ message: 'The requested profile does not exist' });
  }

  const { additionalColumns, ...params } = getQueryParamsValues(req);

  const columnAliases = [
    req.params.column,
    ...(Array.isArray(additionalColumns) ? additionalColumns : []),
  ];

  const columns = getColumnsFromAliases(columnAliases, profile);

  queryColumnValues(profile, columns, params, req.activeSchema)
    .then((values) => res.status(200).json(values))
    .catch((error) => {
      log.error(
        formatLogMsg(
          metadataObj,
          `Failed to get values for the "${req.params.column}" column from the "${profile.tableName}" table: ${error}`,
          error,
        ),
      );
      res.status(500).json({ message: 'Error! ' + error });
    });
}

/**
 * Gets the query parameters from the request.
 * @param {express.Request} req
 * @returns request query parameters
 */
function getQueryParamsValues(req) {
  return Object.entries(req.method === 'POST' ? req.body : req.query).reduce(
    (current, [key, value]) => {
      if (key in current) {
        return { ...current, [key]: value };
      } else if (req.method === 'GET') {
        return { ...current, filters: { ...current.filters, [key]: value } };
      } else return current;
    },
    {
      text: '',
      direction: null,
      filters: {},
      limit: null,
      additionalColumns: [],
    },
  );
}

/**
 * Craft the database query for distinct column values
 * @param {Object} profile definition of the profile being queried
 * @param {Array<Object>} columns definitions of columns to return, where the first is the primary column
 * @param {Object} params parameters to apply to the query
 * @param {string} schema the currently active database schema
 */
async function queryColumnValues(profile, columns, params, schema) {
  const primaryColumn = columns[0];

  // get columns for where clause
  const columnsForFilter = [];
  profile.columns.forEach((col) => {
    if (params.filters.hasOwnProperty(col.alias)) {
      columnsForFilter.push(col.name);
    }
  });

  // search through tableconfig.materializedViews to see if the column
  // we need is in here
  const materializedView = findMaterializedView(
    profile,
    columns,
    columnsForFilter,
  );

  // ensure no mv-only columns exist if no mv was found
  if (!materializedView) {
    for (const col of columns) {
      if (!profile.columns.find((c) => c.name === col.name)) {
        return res.status(404).json({
          message: `The column ${col.alias} is not available with the current query`,
        });
      }
    }
  }

  // query table directly if a suitable materialized view was not found
  const query = knex
    .withSchema(schema)
    .from(materializedView ? materializedView.name : profile.tableName)
    .column(
      columns.reduce(
        (current, col) => ({ ...current, [col.alias]: col.name }),
        {},
      ),
    )
    .whereNotNull(primaryColumn.name)
    .distinctOn(primaryColumn.name)
    .orderBy(primaryColumn.name, params.direction ?? 'asc')
    .select();

  // build where clause of the query
  profile.columns.forEach((col) => {
    appendToWhere(query, col.name, params.filters[col.alias]);
  });

  if (params.text) {
    query.andWhere((q) => {
      columns.forEach((col, i) => {
        if (col.type === 'numeric' || col.type === 'timestamptz') {
          i === 0
            ? q.whereRaw('CAST(?? as TEXT) ILIKE ?', [
                col.name,
                `%${params.text}%`,
              ])
            : q.orWhereRaw('CAST(?? as TEXT) ILIKE ?', [
                col.name,
                `%${params.text}%`,
              ]);
        } else {
          i === 0
            ? q.whereILike(col.name, `%${params.text}%`)
            : q.orWhereILike(col.name, `%${params.text}%`);
        }
      });
    });
  }

  if (params.limit) query.limit(params.limit);

  return await query;
}

/**
 * Checks if the etl for the database ran successfully.
 * @param {express.Request} req
 * @param {express.Response} res
 */
async function checkDatabaseHealth(req, res) {
  const metadataObj = populateMetdataObjFromRequest(req);

  try {
    // check etl status in db
    let query = knex
      .withSchema('logging')
      .from('etl_status')
      .select('database')
      .first();
    const statusResults = await query;
    if (statusResults.database === 'failed') {
      res.status(200).json({ status: 'FAILED-DB' });
      return;
    }

    // verify the latest entry in the schema table is active
    query = knex
      .withSchema('logging')
      .from('etl_schemas')
      .select('active', 'creation_date')
      .orderBy('creation_date', 'desc')
      .first();
    const schemaResults = await query;
    if (!schemaResults.active && statusResults.database !== 'running') {
      res.status(200).json({ status: 'FAILED-SCHEMA' });
      return;
    }

    query = knex
      .withSchema('logging')
      .from('etl_schemas')
      .select('active', 'creation_date')
      .where('active', true)
      .orderBy('creation_date', 'desc')
      .first();
    const activeSchemaResults = await query;

    // verify database updated in the last week, with 1 hour buffer
    const timeSinceLastUpdate =
      (Date.now() - activeSchemaResults.creation_date) / (1000 * 60 * 60);
    if (timeSinceLastUpdate >= 169) {
      res.status(200).json({ status: 'FAILED-TIME' });
      return;
    }

    // verify a query can be ran against each table in the active db
    for (const profile of Object.values(tableConfig)) {
      query = knex
        .withSchema(req.activeSchema)
        .from(profile.tableName)
        .select(profile.idColumn)
        .limit(1)
        .first();
      const dataResults = await query;
      if (!dataResults[profile.idColumn]) {
        res.status(200).json({ status: 'FAILED-QUERY' });
        return;
      }
    }

    // everything passed
    res.status(200).json({ status: 'UP' });
  } catch (error) {
    log.error(formatLogMsg(metadataObj, 'Error!', error));
    res.status(500).send('Error!' + error);
  }
}

/**
 * Checks if the etl for the domain values ran successfully.
 * @param {express.Request} req
 * @param {express.Response} res
 */
async function checkDomainValuesHealth(req, res) {
  try {
    // check etl status in db
    const query = knex
      .withSchema('logging')
      .from('etl_status')
      .select('domain_values')
      .first();
    const results = await query;
    if (results.domain_values === 'failed') {
      res.status(200).json({ status: 'FAILED-DB' });
      return;
    }

    // initialize timeSinceLastUpdate to the minimum time node allows
    let timeSinceLastUpdate = minDateTime;

    // verify file update date is within the last week
    if (environment.isLocal) {
      const path = resolve(__dirname, `../content-etl/domainValues`);

      // get hours since file last modified
      const files = readdirSync(path);

      let oldestModifiedDate = maxDateTime;
      files.forEach((file) => {
        const stats = statSync(`${path}/${file}`);
        if (stats.mtime < oldestModifiedDate) oldestModifiedDate = stats.mtime;
      });

      timeSinceLastUpdate =
        (Date.now() - oldestModifiedDate) / (1000 * 60 * 60);
    } else {
      // setup public s3 bucket
      const config = new AWS.Config({
        accessKeyId: process.env.CF_S3_PUB_ACCESS_KEY,
        secretAccessKey: process.env.CF_S3_PUB_SECRET_KEY,
        region: process.env.CF_S3_PUB_REGION,
      });
      AWS.config.update(config);
      const s3 = new AWS.S3({ apiVersion: '2006-03-01' });

      // get a list of files in the directory
      const data = await s3
        .listObjects({
          Bucket: process.env.CF_S3_PUB_BUCKET_ID,
          Prefix: 'content-etl/domainValues',
        })
        .promise();

      let oldestModifiedDate = maxDateTime;
      data.Contents.forEach((file) => {
        if (file.LastModified < oldestModifiedDate)
          oldestModifiedDate = file.LastModified;
      });

      timeSinceLastUpdate =
        (Date.now() - oldestModifiedDate) / (1000 * 60 * 60);
    }

    // check that domain values was updated in the last week and 1 hour
    res
      .status(200)
      .json({ status: timeSinceLastUpdate >= 169 ? 'FAILED-TIME' : 'UP' });
  } catch (error) {
    log.error(formatLogMsg(metadataObj, 'Error!', error));
    res.status(500).send('Error!' + error);
  }
}

export default function (app, basePath) {
  const router = express.Router();

  router.use(protectRoutes);
  router.use(getActiveSchema);

  // Cors config for public endpoints
  const corsOptions = {
    methods: 'GET,HEAD,POST',
  };

  // Cors config for private endpoints
  // This is needed for private endpoints to work within EQ UI.
  const allowlist = [
    'https://owapps-dev.app.cloud.gov',
    'https://owapps-stage.app.cloud.gov',
    'https://owapps.app.cloud.gov',
    'https://owapps.epa.gov',
  ];
  const corsOptionsDelegate = function (req, callback) {
    const corsOptionsRes = { ...corsOptions };
    if (allowlist.indexOf(req.header('Origin')) !== -1) {
      corsOptionsRes.origin = true; // reflect (enable) the requested origin in the CORS response
    } else {
      corsOptionsRes.origin = false; // disable CORS for this request
    }
    callback(null, corsOptionsRes); // callback expects two parameters: error and options
  };

  Object.entries(tableConfig).forEach(([profileName, profile]) => {
    // ****************************** //
    // Public / CORS Enabled          //
    // ****************************** //

    // create get requests
    router.get(`/${profileName}`, cors(corsOptions), async function (req, res) {
      await executeQuery(profile, req, res);
    });
    router.get(`/${profileName}/count`, cors(corsOptions), function (req, res) {
      executeQueryCountOnly(profile, req, res);
    });

    // create post requests
    router.post(
      `/${profileName}`,
      cors(corsOptions),
      async function (req, res) {
        await executeQuery(profile, req, res);
      },
    );
    router.post(
      `/${profileName}/count`,
      cors(corsOptions),
      function (req, res) {
        executeQueryCountOnly(profile, req, res);
      },
    );

    // ****************************** //
    // Private / NOT CORS Enabled     //
    // ****************************** //

    // get column domain values
    router.get(
      '/:profile/values/:column',
      cors(corsOptionsDelegate),
      function (req, res) {
        executeValuesQuery(req, res);
      },
    );
    router.post(
      '/:profile/values/:column',
      cors(corsOptionsDelegate),
      function (req, res) {
        executeValuesQuery(req, res);
      },
    );

    router.get(
      '/health/etlDatabase',
      cors(corsOptionsDelegate),
      async function (req, res) {
        await checkDatabaseHealth(req, res);
      },
    );

    router.get(
      '/health/etlDomainValues',
      cors(corsOptionsDelegate),
      async function (req, res) {
        await checkDomainValuesHealth(req, res);
      },
    );
  });

  app.use(`${basePath}api/attains`, router);
}
