const cors = require("cors");
const express = require("express");
const Excel = require("exceljs");
const { getActiveSchema } = require("../middleware");
const { appendToWhere, knex, mapping } = require("../utilities/database");
const logger = require("../utilities/logger");
const log = logger.logger;
const StreamingService = require("../utilities/streamingService");

class DuplicateParameterException extends Error {
  constructor(parameter) {
    super();
    this.code = 400;
    this.message = `Duplicate ${parameter} parameters not allowed`;
  }
}

/**
 * Append a range to the where clause of the provided query.
 * @param {Object} query KnexJS query object
 * @param {string} paramName column name
 * @param {string} lowParamValue URL query low value
 * @param {string} highParamValue URL query high value
 */
function appendToWhereRange(query, paramName, lowParamValue, highParamValue) {
  if (!lowParamValue && !highParamValue) return;

  if (lowParamValue && highParamValue) {
    query.whereBetween(paramName, [lowParamValue, highParamValue]);
  } else if (lowParamValue) {
    query.where(paramName, ">=", lowParamValue);
  } else {
    query.where(paramName, "<=", highParamValue);
  }
}

/**
 * Gets the query parameters from the request.
 * @param {express.Request} req
 * @returns request query parameters
 */
function getQueryParams(req) {
  // return post parameters, default to empty objects if not provided
  if (req.method === "POST") {
    return {
      filters: req.body.filters ?? {},
      options: req.body.options ?? {},
      columns: req.body.columns ?? null,
    };
  }

  // organize GET parameters to follow what we expect from POST
  const optionsParams = ["f", "format"];
  const parameters = {
    filters: {},
    options: {},
    columns: null,
  };
  Object.entries(req.query).forEach(([name, value]) => {
    if (optionsParams.includes(name)) parameters.options[name] = value;
    else if (name === "columns") parameters.columns = value;
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
  // build select statement of the query
  if (countOnly) query.count(profile.idColumn);
  else {
    // filter down to requested columns, if the user provided that option
    const columnsToReturn = profile.columns.filter(
      (col) => queryParams.columns && queryParams.columns.includes(col.alias)
    );

    // build the select query
    const selectColumns =
      columnsToReturn.length > 0 ? columnsToReturn : profile.columns;
    const selectText = selectColumns.map((col) =>
      col.name === col.alias ? col.name : `${col.name} AS ${col.alias}`
    );
    query.select(selectText);
  }

  // build where clause of the query
  profile.columns.forEach((col) => {
    if ("lowParam" in col || "highParam" in col) {
      const lowParamValue = queryParams.filters[col.lowParam];
      const highParamValue = queryParams.filters[col.highParam];
      // only allow one instance of each parameter for rangeable columns
      if (Array.isArray(lowParamValue)) {
        throw new DuplicateParameterException(col.lowParam);
      }
      if (Array.isArray(highParamValue)) {
        throw new DuplicateParameterException(col.highParam);
      }

      const isTimestampColumn = col.type === "timestamptz";

      appendToWhereRange(
        query,
        col.name,
        isTimestampColumn ? dateToUtcTime(lowParamValue) : lowParamValue,
        isTimestampColumn ? dateToUtcTime(highParamValue, true) : highParamValue
      );
    } else {
      appendToWhere(query, col.name, queryParams.filters[col.alias]);
    }
  });
}

function dateToUtcTime(value, endOfDay = false) {
  if (!value) return null;

  const date = new Date(value);
  if (isNaN(date)) return null;

  const dateString = date.toISOString().substring(0, 10);
  if (endOfDay) return `${dateString}T24:00Z`;
  return `${dateString}T00:00Z`;
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

    parseCriteria(query, profile, queryParams);

    const stream = await query.stream({
      batchSize: parseInt(process.env.STREAM_BATCH_SIZE),
      highWaterMark: parseInt(process.env.STREAM_HIGH_WATER_MARK),
    });

    // close the stream if the request is canceled
    stream.on("close", stream.end.bind(stream));

    const format = queryParams.options.format ?? queryParams.options.f;
    switch (format) {
      case "csv":
      case "tsv":
        // output the data
        res.setHeader(
          "Content-disposition",
          `attachment; filename=${profile.tableName}.${format}`
        );
        StreamingService.streamResponse(res, stream, format);
        break;
      case "xlsx":
        res.setHeader(
          "Content-Disposition",
          `attachment; filename=${profile.tableName}.xlsx`
        );

        const workbook = new Excel.stream.xlsx.WorkbookWriter({
          stream: res,
          useStyles: true,
        });

        const worksheet = workbook.addWorksheet("data");

        StreamingService.streamResponse(res, stream, format, {
          workbook,
          worksheet,
        });
        break;
      case "json":
        res.setHeader(
          "Content-disposition",
          `attachment; filename=${profile.tableName}.json`
        );
        StreamingService.streamResponse(res, stream, format);
        break;
      default:
        StreamingService.streamResponse(res, stream, format);
        break;
    }
  } catch (error) {
    log.error(`Failed to get data from the "${profile.tableName}" table...`);
    return res.status(error.code ?? 500).send(`Error! ${error.message}`);
  }
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
    const query = knex
      .withSchema(req.activeSchema)
      .from(profile.tableName)
      .first();

    const queryParams = getQueryParams(req);

    parseCriteria(query, profile, queryParams, true);
    console.log(query.toString());

    query
      .then((count) => res.status(200).send(count))
      .catch((error) => {
        log.error(
          `Failed to get count from the "${profile.tableName}" table...`
        );
        res.status(500).send("Error! " + error);
      });
  } catch (error) {
    log.error(`Failed to get count from the "${profile.tableName}" table...`);
    return res.status(error.code ?? 500).send(`Error! ${error.message}`);
  }
}

module.exports = function (app) {
  const router = express.Router();

  router.use(getActiveSchema);

  const corsOptions = {
    methods: "GET,HEAD,POST",
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
      }
    );
  });

  app.use("/attains/data", router);
};
