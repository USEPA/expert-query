const express = require("express");
const Excel = require("exceljs");
const { getActiveSchema } = require("../middleware");
const { knex } = require("../utilities/database");
const logger = require("../utilities/logger");
const log = logger.logger;
const StreamingService = require("../utilities/streamingService");

// mapping to dynamically build GET/POST endpoints and queries
const mapping = {
  assessments: {
    tableName: "assessments",
    idColumn: "id",
    columns: [
      { name: "id", alias: "id" },
      { name: "reporting_cycle", alias: "reportingCycle" },
      { name: "assessment_unit_id", alias: "assessmentUnitId" },
      { name: "assessment_unit_name", alias: "assessmentUnitName" },
      { name: "organization_id", alias: "organizationId" },
      { name: "organization_name", alias: "organizationName" },
      { name: "organization_type", alias: "organizationType" },
      { name: "overall_status", alias: "overallStatus" },
      { name: "region", alias: "region" },
      { name: "state", alias: "state" },
      { name: "ir_category", alias: "irCategory" },
    ],
  },
};

/**
 * Gets the query parameters from the request.
 * @param {express.Request} req
 * @returns request query parameters
 */
function getQueryParams(req) {
  return req.method === "POST" ? req.body : req.query;
}

/**
 * Appends to the where clause of the provided query.
 * @param {Object} query KnexJS query object
 * @param {string} paramName column name
 * @param {string} paramValue URL query value
 */
function appendToWhere(query, paramName, paramValue) {
  if (!paramValue) return;

  if (Array.isArray(paramValue)) {
    query.whereIn(paramName, paramValue);
  } else {
    query.where(paramName, paramValue);
  }
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
    const selectText = profile.columns.map((col) =>
      col.name === col.alias ? col.name : `${col.name} AS ${col.alias}`
    );
    query.select(selectText);
  }

  // build where clause of the query
  profile.columns.forEach((col) => {
    appendToWhere(query, col.name, queryParams[col.alias]);
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

    parseCriteria(query, profile, queryParams);

    const stream = await query.stream({
      batchSize: parseInt(process.env.STREAM_BATCH_SIZE),
      highWaterMark: parseInt(process.env.STREAM_HIGH_WATER_MARK),
    });

    const format = queryParams.format ?? queryParams.f;
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

        workbook.addWorksheet(profile.tableName);
        const worksheet = workbook.getWorksheet(profile.tableName);

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
    return res.status(500).send("Error !" + error);
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
    return res.status(500).send("Error !" + error);
  }
}

module.exports = function (app) {
  const router = express.Router();

  router.use(getActiveSchema);

  Object.entries(mapping).forEach(([profileName, profile]) => {
    // create get requests
    router.get(`/${profileName}`, function (req, res) {
      executeQuery(profile, req, res);
    });
    router.get(`/${profileName}/count`, function (req, res) {
      executeQueryCountOnly(profile, req, res);
    });

    // create post requests
    router.post(`/${profileName}`, function (req, res) {
      executeQuery(profile, req, res);
    });
    router.post(`/${profileName}/count`, function (req, res) {
      executeQueryCountOnly(profile, req, res);
    });
  });

  app.use("/attains/data", router);
};
