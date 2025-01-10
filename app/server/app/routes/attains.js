import { ListObjectsCommand } from '@aws-sdk/client-s3';
import express from 'express';
import Excel from 'exceljs';
import { readdirSync, statSync } from 'node:fs';
import path, { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import QueryStream from 'pg-query-stream';
import { getActiveSchema, protectRoutes } from '../middleware.js';
import { appendToWhere, knex, pool, queryPool } from '../utilities/database.js';
import { getEnvironment } from '../utilities/environment.js';
import {
  formatLogMsg,
  log,
  populateMetdataObjFromRequest,
} from '../utilities/logger.js';
import { getPrivateConfig, getS3Client } from '../utilities/s3.js';
import StreamingService from '../utilities/streamingService.js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const defaultPageSize = 20;
const maxPageSize = parseInt(process.env.MAX_PAGE_SIZE || 500);
const maxQuerySize = parseInt(process.env.MAX_QUERY_SIZE || 1_000_000);

const minDateTime = new Date(-8640000000000000);
const maxDateTime = new Date(8640000000000000);

const { isLocal, isTest } = getEnvironment();

// get config from private S3 bucket
const privateConfig = await getPrivateConfig();

class DuplicateParameterException extends Error {
  constructor(parameter) {
    super();
    this.httpStatusCode = 400;
    this.message = `Duplicate '${parameter}' parameters not allowed`;
  }
}

class InvalidParameterException extends Error {
  constructor(parameter, context) {
    super();
    this.httpStatusCode = 400;
    this.message = `The parameter '${parameter}' is not valid for the specified ${context}`;
  }
}

class LimitExceededException extends Error {
  constructor(value, maximum = maxQuerySize) {
    super();
    this.httpStatusCode = 400;
    this.message = `The provided limit (${value.toLocaleString()}) exceeds the maximum ${maximum.toLocaleString()} allowable limit.`;
  }
}

class NoParametersException extends Error {
  constructor(message) {
    super();
    this.httpStatusCode = 200;
    this.message = `No parameters were provided. ${message}`;
  }
}

/**
 * Searches for a materialized view, associated with the profile, that is applicable to the provided columns/filters.
 * @param {Object} profile definition of the profile being queried
 * @param {Array<Object>} columns definitions of columns to return
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
 * Searches for a view, associated with the profile, that is applicable to the provided columns.
 * @param {Object} profile definition of the profile being queried
 * @param {Array<string>} columns parameter names of columns to return
 * @returns definition of a view that is applicable to the desired columns, or null if none are suitable
 */
function findView(profile, columns) {
  if (!profile.views) return;

  const expandedViews = profile.views?.map((view) => ({
    ...view,
    columns: view.columns.map((vCol) => {
      const pCol = (
        vCol.table
          ? Object.values(privateConfig.tableConfig).find(
              (p) => p.tableName === vCol.table,
            )
          : profile
      )?.columns.find((c) => c.name === vCol.name);
      if (!pCol) {
        throw new Error(
          `The view column ${vCol.name} does not exist on the specified profile`,
        );
      }

      return pCol;
    }),
  }));

  return expandedViews.find((view) => {
    for (const col of columns) {
      if (
        !view.columns.find((vCol) =>
          [vCol.alias, vCol.lowParam, vCol.highParam].includes(col),
        )
      ) {
        return;
      }
    }
    return view;
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
      .concat(profile.referencedColumns ?? [])
      .find((col) => col.alias === alias);
    if (!column) {
      throw new Error(alias);
    }
    columns.push(column);
  }

  return columns;
}

/** Get a subquery if "Latest" is used
 * @param {Express.Request} req
 * @param {Object} profile definition of the profile being queried
 * @param {Object} params URL query value
 * @param {Object} columnName name of the "Latest" column
 * @param {Object} columnType data type of the "Latest" column
 * @returns {Object} an updated KnexJS query object
 */
function createLatestSubquery(req, profile, params, columnName, columnType) {
  if (!['date', 'numeric', 'timestamptz'].includes(columnType)) return;

  const columnAliases = ['organizationId', 'region', 'reportingCycle', 'state'];

  let columns;
  try {
    columns = getColumnsFromAliases(columnAliases, profile);
  } catch (err) {
    return res.status(404).json({
      message: `The column ${err} does not exist on the selected profile`,
    });
  }

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
 * @param {Express.Response} res
 * @param {string} format the format of the file attachment
 * @param {Object} excelDoc Excel workbook and worksheet objects
 * @param {Object} pageOptions page number and page size for paginated JSON
 */
async function createStream(query, res, format, wbObject, pageOptions) {
  pool.connect((err, client, done) => {
    if (err) throw err;

    const qStream = new QueryStream(query.toString(), [], {
      batchSize: parseInt(process.env.STREAM_BATCH_SIZE),
      highWaterMark: parseInt(process.env.STREAM_HIGH_WATER_MARK),
    });
    const stream = client.query(qStream);
    stream.on('end', done);

    StreamingService.streamResponse(res, stream, format, wbObject, pageOptions);
  });
}

/**
 * Streams the results of a query as a file attachment.
 * @param {Object} query KnexJS query object
 * @param {Express.Response} req
 * @param {Express.Response} res
 * @param {string} format the format of the file attachment
 * @param {string} baseName the name of the file without the extension
 */
async function streamFile(query, req, res, format, baseName) {
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

    createStream(query, res, format, { workbook, worksheet });
  } else {
    createStream(query, res, format);
  }
}

/**
 * Streams the results of a query as paginated JSON.
 * @param {Object} query KnexJS query object
 * @param {Express.Response} res
 * @param {number} pageNumber current page of results
 * @param {number} pageSize number of results per page
 */
async function streamJson(query, res, pageNumber, pageSize) {
  if (pageNumber > 1) query.offset((pageNumber - 1) * pageSize);
  query.limit(pageSize);

  createStream(query, res, 'json', null, { pageNumber, pageSize });
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
 * @param {boolean} endOfDay whether the returned time should represent midnight at the start or end of day
 * @returns {string | null}
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
  const optionsParams = ['f', 'format', 'limit', 'pageNumber', 'pageSize'];
  const parameters = {
    filters: {},
    options: {},
    columns: null,
  };
  Object.entries(req.query).forEach(([name, value]) => {
    if (optionsParams.includes(name)) parameters.options[name] = value;
    else if (name === 'columns')
      parameters.columns = Array.isArray(value) ? value : [value];
    else parameters.filters[name] = value;
  });

  return parameters;
}

/**
 * Builds the select clause and where clause of the query based on the provided
 * profile name.
 * @param {express.Request} req
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
    latestColumn &&
    queryParams.filters.hasOwnProperty(latestColumn.alias) &&
    queryParams.filters[latestColumn.alias] === -1
      ? null
      : latestColumn && !queryParams.filters.hasOwnProperty(latestColumn.alias)
        ? createLatestSubquery(
            req,
            profile,
            queryParams,
            latestColumn.name,
            latestColumn.type,
          )
        : null;

  // build select statement of the query
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
    const selectText = selectColumns.map((col) =>
      col.name === col.alias ? col.name : `${col.name} AS "${col.alias}"`,
    );
    query.select(selectText).orderBy('objectid', 'asc');
  }

  // build where clause of the query
  profile.columns.forEach((col) => {
    if (col.default === 'latest' && queryParams.filters[col.alias] === -1)
      return;

    const lowArg = 'lowParam' in col && queryParams.filters[col.lowParam];
    const highArg = 'highParam' in col && queryParams.filters[col.highParam];
    const exactArg = queryParams.filters[col.alias];
    if (lowArg || highArg) {
      appendRangeToWhere(query, col, lowArg, highArg);
    } else if (exactArg !== undefined) {
      appendToWhere(query, col.name, exactArg);
    }
  });

  if (subQuery) {
    // add the "latest" subquery to the where clause
    query.whereIn(['organizationid', latestColumn.name], subQuery);
  }
}

function parseDocumentSearchCriteria(req, res, query, profile, queryParams) {
  const columnsForFilter = Object.keys(queryParams.filters);
  let columnsToReturn = queryParams.columns ?? [];
  const view = findView(profile, columnsForFilter.concat(columnsToReturn));
  if (view) query.from(view.name);
  const target = view ?? profile;
  // NOTE:XXX: This will need to change if we ever have multiple `tsvector` columns in a single table.
  const documentQueryColumn = target.columns.find(
    (col) => col.type === 'tsvector',
  );
  if (!documentQueryColumn) {
    return res.status(200).json({
      message: `No results found for the current query. Please refine the search.`,
    });
  }
  const documentQuery = queryParams.filters[documentQueryColumn.alias];
  const isDocumentSearch =
    documentQueryColumn && columnsForFilter.includes(documentQueryColumn.alias);
  if (!isDocumentSearch && !columnsToReturn.includes('objectId')) {
    columnsToReturn.push('objectId');
  }
  const selectColumns = (
    columnsToReturn.length > 0
      ? target.columns.filter((col) => columnsToReturn.includes(col.alias))
      : target.columns
  ).filter((col) => col.type !== 'tsvector');

  // Build the select query, filtering down to requested columns, if the user provided that option.
  const asAlias = (col) =>
    col.name === col.alias ? col.name : `${col.name} AS ${col.alias}`;
  if (isDocumentSearch) {
    query
      .with('ranked', (qb) => {
        qb.select(
          selectColumns
            .map((col) => col.name)
            .concat(
              knex.raw(
                `ts_rank_cd(${documentQueryColumn.name}, websearch_to_tsquery(?), 1 | 32) AS rank`,
                [documentQuery],
              ),
            ),
        )
          .withSchema(req.activeSchema)
          .from(target.tableName ?? target.name)
          .whereRaw(`${documentQueryColumn.name} @@ websearch_to_tsquery(?)`, [
            documentQuery,
          ]);
      })
      .withSchema()
      .from('ranked')
      .select([
        knex.raw('ROUND((AVG(rank) * 100)::numeric, 1) AS "rankPercent"'),
        ...selectColumns.map(asAlias),
      ])
      .orderBy('rankPercent', 'desc')
      .groupBy(selectColumns.map((col) => col.name));
  } else {
    query.select(selectColumns.map(asAlias)).orderBy('objectid', 'asc');
  }

  // build where clause of the query
  target.columns.forEach((col) => {
    if (col.type === 'tsvector') return;

    const lowArg = 'lowParam' in col && queryParams.filters[col.lowParam];
    const highArg = 'highParam' in col && queryParams.filters[col.highParam];
    const exactArg = queryParams.filters[col.alias];
    if (lowArg || highArg) {
      appendRangeToWhere(query, col, lowArg, highArg);
    } else if (exactArg !== undefined) {
      appendToWhere(query, col.name, exactArg);
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
  const metadataObj = populateMetdataObjFromRequest(req);

  // output types csv, tab-separated, Excel, or JSON
  try {
    const query = knex
      .withSchema(req.activeSchema)
      .from(profile.tableName)
      .limit(maxQuerySize);

    const queryParams = getQueryParams(req);

    validateQueryParams(queryParams, profile);

    // verify atleast 1 parameter was provided, excluding the columns parameter
    if (
      (!queryParams.columns || Object.keys(queryParams.columns).length === 0) &&
      Object.keys(queryParams.filters).length === 0 &&
      Object.keys(queryParams.options).length === 0
    ) {
      throw new NoParametersException('Please provide at least one parameter');
    }

    // TODO: Merge this into one function.
    if (profile.id === 'actionDocuments') {
      parseDocumentSearchCriteria(req, res, query, profile, queryParams);
    } else {
      parseCriteria(req, query, profile, queryParams);
    }

    // Check that the query doesn't exceed the MAX_QUERY_SIZE.
    if (await exceedsMaxSize(query)) {
      return res.status(200).json({
        message: `The current query exceeds the maximum query size of ${maxQuerySize.toLocaleString()} rows. Please refine the search, or visit ${
          process.env.SERVER_URL
        }/national-downloads to download a compressed dataset`,
      });
    }

    // Check if the query result is empty.
    if (await isEmptyResult(query)) {
      return res.status(200).json({
        message: `No results found for the current query. Please refine the search.`,
      });
    }

    const format = queryParams.options.format ?? queryParams.options.f;
    if (['csv', 'tsv', 'xlsx'].includes(format)) {
      await streamFile(query, req, res, format, profile.tableName);
    } else {
      await streamJson(
        query,
        res,
        parseInt(queryParams.options.pageNumber || 1),
        parseInt(queryParams.options.pageSize || defaultPageSize),
      );
    }
  } catch (error) {
    log.error(
      formatLogMsg(
        metadataObj,
        `Failed to get data from the "${profile.tableName}" table:`,
        error,
      ),
    );
    return res
      .status(error.httpStatusCode ?? 500)
      .json({ error: error.toString() });
  }
}

/**
 * Throws an error if multiple instances of a parameter were provided
 * for an option or filter that accepts a single argument only
 * @param {Object} queryParams URL query value for filters
 * @param {Object} profile definition of the profile being queried
 */
function validateQueryParams(queryParams, profile) {
  Object.entries(queryParams.options).forEach(([name, value]) => {
    // Each option should only be used once.
    if (Array.isArray(value)) throw new DuplicateParameterException(name);

    // 'pageNumber' and 'pageSize' are only allowed to be used with 'json' format.
    const format = queryParams.options.format ?? queryParams.options.f;
    if (
      ['pageNumber', 'pageSize'].includes(name) &&
      ['csv', 'tsv', 'xlsx'].includes(format)
    ) {
      throw new InvalidParameterException(name, 'response format');
    }

    // 'pageSize' must be less than or equal to the maximum page size.
    if (name === 'pageSize' && parseInt(value) > maxPageSize) {
      throw new LimitExceededException(value, maxPageSize);
    }
  });

  const target = findView(profile, Object.keys(queryParams.filters)) ?? profile;
  Object.entries(queryParams.filters).forEach(([name, value]) => {
    const column = target.columns.find((c) => {
      if (c.lowParam === name || c.highParam === name || c.alias === name)
        return c;
    });
    if (Array.isArray(value)) {
      if (
        column.lowParam === name ||
        column.highParam === name ||
        (column.alias === name && column.acceptsMultiple === false)
      )
        throw new DuplicateParameterException(name);
    }
    if (!column) throw new InvalidParameterException(name, 'profile');
  });
}

/**
 * Checks if the query exceeds the configured `maxQuerySize`
 * @param {Object} query KnexJS query object
 * @returns {Promise<boolean>} true if the max query size is exceeded
 */
async function exceedsMaxSize(query) {
  const count = await queryPool(
    knex
      .from(
        query
          .clone()
          .limit(maxQuerySize + 1)
          .as('q'),
      )
      .count(),
    true,
  );

  return count.count > maxQuerySize;
}

/**
 * Checks if the query result is empty.
 * @param {Object} query KnexJS query object
 * @returns {Promise<boolean>} true if the query result is empty
 */
async function isEmptyResult(query) {
  const count = await queryPool(
    knex.from(query.clone().limit(1).as('q')).count(),
    true,
  );

  return count.count === 0;
}

/**
 * Runs a query against the provided profile name and returns the number of records.
 * @param {Object} profile definition of the profile being queried
 * @param {express.Request} req
 * @param {express.Response} res
 */
async function executeQueryCountOnly(profile, req, res) {
  const metadataObj = populateMetdataObjFromRequest(req);

  // always return json with the count
  try {
    const query = knex.withSchema(req.activeSchema).from(profile.tableName);

    const queryParams = getQueryParams(req);

    // query against the ..._count mv when no filters are applied, for better performance
    if (Object.keys(queryParams.filters).length === 0) {
      const query = knex
        .withSchema(req.activeSchema)
        .from(`${profile.tableName}_count`);
      const count = (await queryPool(query, true)).count;
      return res.status(200).json({ count, maxCount: maxQuerySize });
    }

    validateQueryParams(queryParams, profile);

    // TODO: Merge this into one function.
    if (profile.id === 'actionDocuments') {
      parseDocumentSearchCriteria(req, res, query, profile, queryParams);
    } else {
      parseCriteria(req, query, profile, queryParams, true);
    }

    const count = (
      await queryPool(knex.from(query.clone().as('q')).count(), true)
    ).count;
    return res.status(200).json({ count, maxCount: maxQuerySize });
  } catch (error) {
    log.error(
      formatLogMsg(
        metadataObj,
        `Failed to get count from the "${profile.tableName}" table:`,
        error,
      ),
    );
    return res
      .status(error.httpStatusCode ?? 500)
      .json({ error: error.toString() });
  }
}

/**
 * Runs a query against the provided profile name and returns the number of records.
 * @param {Object} profile definition of the profile being queried
 * @param {express.Request} req
 * @param {express.Response} res
 */
async function executeQueryCountPerOrgCycle(profile, req, res) {
  const metadataObj = populateMetdataObjFromRequest(req);

  // always return json with the count
  try {
    const query = knex
      .withSchema(req.activeSchema)
      .select()
      .from(`${profile.tableName}_countperorgcycle`);
    const results = await queryPool(query);

    return res.status(200).json(results);
  } catch (error) {
    log.error(
      formatLogMsg(
        metadataObj,
        `Failed to get counts per organization and reporting cycle from the "${profile.tableName}" table:`,
        error,
      ),
    );
    return res
      .status(error.httpStatusCode ?? 500)
      .json({ error: error.toString() });
  }
}

/**
 * Retrieves the domain values for a single table column.
 * @param {Object} profile definition of the profile being queried
 * @param {express.Request} req
 * @param {express.Response} res
 */
async function executeValuesQuery(profile, req, res) {
  const metadataObj = populateMetdataObjFromRequest(req);

  try {
    const { additionalColumns, ...params } = getQueryParamsValues(req);

    if (!params.text && !params.limit) {
      throw new NoParametersException(
        `Please provide either a text filter or a limit that does not exceed ${maxPageSize}.`,
      );
    }

    const columnAliases = [
      req.params.column,
      ...(Array.isArray(additionalColumns) ? additionalColumns : []),
    ];

    let columns;
    try {
      columns = getColumnsFromAliases(columnAliases, profile);
    } catch (err) {
      return res.status(400).json({
        message: `The column ${err.message} does not exist on the selected profile`,
      });
    }

    let values;
    values = await queryColumnValues(
      res,
      profile,
      columns,
      params,
      req.activeSchema,
    );
    return res.status(200).json(values);
  } catch (error) {
    log.error(
      formatLogMsg(
        metadataObj,
        `Failed to get values for the "${req.params.column}" column from the "${req.params.profile}" table:`,
        error,
      ),
    );
    return res
      .status(error.httpStatusCode ?? 500)
      .json({ error: error.toString() });
  }
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
      comparand: null,
      direction: null,
      filters: {},
      limit: null,
      additionalColumns: [],
    },
  );
}

/**
 * Craft the database query for distinct column values
 * @param {express.Response} res
 * @param {Object} profile definition of the profile being queried
 * @param {Array<Object>} columns definitions of columns to return, where the first is the primary column
 * @param {Object} params parameters to apply to the query
 * @param {string} schema the currently active database schema
 */
async function queryColumnValues(res, profile, columns, params, schema) {
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
  const view =
    findMaterializedView(profile, columns, columnsForFilter) ??
    findView(
      profile,
      Object.keys(params.filters).concat(columns.map((c) => c.alias)),
    );

  // ensure no view-only columns exist if no view was found
  if (!view) {
    for (const col of columns) {
      if (!profile.columns.find((c) => c.name === col.name)) {
        throw new Error(
          `The column ${col.alias} is not available with the current query`,
        );
      }
    }
  }

  // query table directly if a suitable materialized view was not found
  const query = knex
    .withSchema(schema)
    .from(view?.name ?? profile.tableName)
    .column(
      columns.reduce(
        (current, col) => ({ ...current, [col.alias]: col.name }),
        {},
      ),
    )
    .whereNotNull(primaryColumn.name)
    .distinct()
    .orderBy(primaryColumn.name, params.direction ?? 'asc')
    .select();

  // build where clause of the query
  profile.columns.forEach((col) => {
    appendToWhere(query, col.name, params.filters[col.alias]);
  });

  if (
    typeof params.comparand === 'string' ||
    typeof params.comparand === 'number'
  ) {
    const comparator = params.direction === 'desc' ? '<' : '>';
    query.andWhere(primaryColumn.name, comparator, params.comparand);
  }

  if (params.text) {
    query.andWhere((q) => {
      columns.forEach((col, i) => {
        if (['date', 'numeric', 'timestamptz'].includes(col.type)) {
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

  const limit = params.limit ?? maxPageSize;
  if (limit > maxPageSize) {
    throw new LimitExceededException(params.limit, maxPageSize);
  }
  query.limit(limit);

  return await queryPool(query);
}

/**
 * Checks if the etl for the database ran successfully.
 * @param {express.Request} req
 * @param {express.Response} res
 */
async function checkDatabaseHealth(req, res) {
  const metadataObj = populateMetdataObjFromRequest(req);

  try {
    let status = 'UP';
    function setStatus(newStatus) {
      if (status === 'UP') status = newStatus;
    }

    // check etl status in db
    let query = knex
      .withSchema('logging')
      .from('etl_status')
      .select('database');
    const statusResults = await queryPool(query, true);
    if (statusResults.database === 'failed') setStatus('FAILED-DB');

    const etlRunning = statusResults.database === 'running';

    // verify the latest entry in the schema table is active
    query = knex
      .withSchema('logging')
      .from('etl_schemas as s')
      .leftJoin('etl_log as l', 's.id', 'l.schema_id')
      .select(
        's.*',
        'l.start_time',
        'l.end_time',
        knex.raw('l.end_time - l.start_time as duration'),
        'l.load_error',
        'l.extract_error',
      )
      .orderBy('creation_date', 'desc');
    const schemaResults = await queryPool(query, true);
    if (!schemaResults.active && !etlRunning) {
      setStatus('FAILED-SCHEMA');
    }

    query = query.clone();
    query.where('active', true);
    const activeSchemaResults = await queryPool(query, true);

    // verify database updated in the last week, with 6 hour buffer
    const timeSinceLastUpdate =
      (Date.now() - activeSchemaResults.end_time) / (1000 * 60 * 60);
    if (timeSinceLastUpdate >= 175) {
      setStatus('FAILED-TIME');
    }

    // verify a query can be ran against each table in the active db
    for (const profile of Object.values(privateConfig.tableConfig)) {
      query = knex
        .withSchema(req.activeSchema)
        .from(profile.tableName)
        .select(profile.idColumn)
        .limit(1);
      const dataResults = await queryPool(query, true);
      if (!dataResults[profile.idColumn]) setStatus('FAILED-QUERY');
    }

    const output = {
      status,
      etlRunning,
      lastSuccess: {
        completed: activeSchemaResults.end_time?.toLocaleString(),
        duration: activeSchemaResults.duration,
        s3Uuid: activeSchemaResults.s3_julian,
        schema: activeSchemaResults.schema_name,
        loadError: activeSchemaResults.load_error,
        extractError: activeSchemaResults.extract_error,
      },
    };

    // if ids of schemaResults and activeSchemaResults don't match then add failed
    if (schemaResults.id !== activeSchemaResults.id) {
      output[etlRunning ? 'inProgress' : 'failed'] = {
        completed: schemaResults.end_time?.toLocaleString(),
        duration: schemaResults.duration,
        s3Uuid: schemaResults.s3_julian,
        schema: schemaResults.schema_name,
        loadError: schemaResults.load_error,
        extractError: schemaResults.extract_error,
      };
    }

    // everything passed
    return res.status(200).json(output);
  } catch (error) {
    log.error(formatLogMsg(metadataObj, 'Error!', error));
    return res.status(error.httpStatusCode ?? 500).send('Error!' + error);
  }
}

/**
 * Checks if the etl for the domain values ran successfully.
 * @param {express.Request} req
 * @param {express.Response} res
 */
async function checkDomainValuesHealth(req, res) {
  const metadataObj = populateMetdataObjFromRequest(req);

  try {
    // check etl status in db
    const query = knex
      .withSchema('logging')
      .from('etl_status')
      .select('domain_values');
    const results = await queryPool(query, true);
    if (results.domain_values === 'failed') {
      return res.status(200).json({ status: 'FAILED-DB' });
    }

    // initialize timeSinceLastUpdate to the minimum time node allows
    let timeSinceLastUpdate = minDateTime;

    // verify file update date is within the last week
    if (isLocal || isTest) {
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
      const s3 = getS3Client();

      // get a list of files in the directory
      const command = new ListObjectsCommand({
        Bucket: process.env.CF_S3_PUB_BUCKET_ID,
        Prefix: 'content-etl/domainValues',
      });
      const data = await s3.send(command);

      let oldestModifiedDate = maxDateTime;
      data.Contents.forEach((file) => {
        if (file.LastModified < oldestModifiedDate)
          oldestModifiedDate = file.LastModified;
      });

      timeSinceLastUpdate =
        (Date.now() - oldestModifiedDate) / (1000 * 60 * 60);
    }

    // check that domain values was updated in the last week and 1 hour
    return res
      .status(200)
      .json({ status: timeSinceLastUpdate >= 169 ? 'FAILED-TIME' : 'UP' });
  } catch (error) {
    log.error(formatLogMsg(metadataObj, 'Error!', error));
    return res.status(error.httpStatusCode ?? 500).send('Error!' + error);
  }
}

export default function (app, basePath) {
  const router = express.Router();

  router.use(protectRoutes);
  router.use(getActiveSchema);

  Object.entries(privateConfig.tableConfig).forEach(
    ([profileName, profile]) => {
      if (profile.hidden) return;

      // get column domain values
      router.post(`/${profileName}/values/:column`, async function (req, res) {
        await executeValuesQuery(profile, req, res);
      });

      // create get requests
      router.get(`/${profileName}`, async function (req, res) {
        await executeQuery(profile, req, res);
      });
      router.get(`/${profileName}/count`, async function (req, res) {
        await executeQueryCountOnly(profile, req, res);
      });

      // create post requests
      router.post(`/${profileName}`, async function (req, res) {
        await executeQuery(profile, req, res);
      });
      router.post(`/${profileName}/count`, async function (req, res) {
        await executeQueryCountOnly(profile, req, res);
      });

      if (profile.includeCycleCount) {
        // get bean counts
        router.get(
          `/${profileName}/countPerOrgCycle`,
          async function (req, res) {
            await executeQueryCountPerOrgCycle(profile, req, res);
          },
        );
        router.post(
          `/${profileName}/countPerOrgCycle`,
          async function (req, res) {
            await executeQueryCountPerOrgCycle(profile, req, res);
          },
        );
      }
    },
  );

  router.get('/health/etlDatabase', async function (req, res) {
    await checkDatabaseHealth(req, res);
  });

  router.get('/health/etlDomainValues', async function (req, res) {
    await checkDomainValuesHealth(req, res);
  });

  app.use(`${basePath}api/attains`, router);
}
