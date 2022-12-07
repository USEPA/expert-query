const cors = require("cors");
const express = require("express");
const Excel = require("exceljs");
const { getActiveSchema } = require("../middleware");
const { knex } = require("../utilities/database");
const logger = require("../utilities/logger");
const log = logger.logger;
const StreamingService = require("../utilities/streamingService");

// mapping to dynamically build GET/POST endpoints and queries
const mapping = {
  assessmentUnits: {
    tableName: "assessment_units",
    idColumn: "id",
    columns: [
      { name: "id", alias: "id" },
      { name: "assessmentunitid", alias: "assessmentUnitId" },
      { name: "assessmentunitname", alias: "assessmentUnitName" },
      { name: "assessmentunitstate", alias: "assessmentUnitState" },
      { name: "locationdescription", alias: "locationDescription" },
      { name: "locationtext", alias: "locationText" },
      { name: "locationtypecode", alias: "locationTypeCode" },
      { name: "objectid", alias: "objectId" },
      { name: "organizationid", alias: "organizationId" },
      { name: "organizationname", alias: "organizationName" },
      { name: "organizationtype", alias: "organizationType" },
      { name: "region", alias: "region" },
      { name: "reportingcycle", alias: "reportingCycle" },
      { name: "sizesource", alias: "sizeSource" },
      { name: "sourcescale", alias: "sourceScale" },
      { name: "state", alias: "state" },
      { name: "useclassname", alias: "useClassName" },
      { name: "watersize", alias: "waterSize" },
      { name: "watersizeunits", alias: "waterSizeUnits" },
      { name: "watertype", alias: "waterType" },
    ],
  },
  assessmentUnitsMonitoringLocations: {
    tableName: "assessment_units_monitoring_locations",
    idColumn: "id",
    columns: [
      { name: "id", alias: "id" },
      { name: "assessmentunitid", alias: "assessmentUnitId" },
      { name: "assessmentunitname", alias: "assessmentUnitName" },
      { name: "assessmentunitstatus", alias: "assessmentUnitStatus" },
      { name: "locationdescription", alias: "locationDescription" },
      {
        name: "monitoringlocationdatalink",
        alias: "monitoringLocationDataLink",
      },
      { name: "monitoringlocationid", alias: "monitoringLocationId" },
      { name: "monitoringlocationorgid", alias: "monitoringLocationOrgId" },
      { name: "objectid", alias: "objectId" },
      { name: "organizationid", alias: "organizationId" },
      { name: "organizationname", alias: "organizationName" },
      { name: "organizationtype", alias: "organizationType" },
      { name: "region", alias: "region" },
      { name: "reportingcycle", alias: "reportingCycle" },
      { name: "sizesource", alias: "sizeSource" },
      { name: "sourcescale", alias: "sourceScale" },
      { name: "state", alias: "state" },
      { name: "useclassname", alias: "useClassName" },
      { name: "watersize", alias: "waterSize" },
      { name: "watersizeunits", alias: "waterSizeUnits" },
      { name: "watertype", alias: "waterType" },
    ],
  },
  gisAssessments: {
    tableName: "gis_assessments",
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
  sources: {
    tableName: "sources",
    idColumn: "id",
    columns: [
      { name: "id", alias: "id" },
      { name: "assessmentunitid", alias: "assessmentUnitId" },
      { name: "assessmentunitname", alias: "assessmentUnitName" },
      { name: "causename", alias: "causeName" },
      { name: "confirmed", alias: "confirmed" },
      { name: "epaircategory", alias: "epaIrCategory" },
      { name: "locationdescription", alias: "locationDescription" },
      { name: "objectid", alias: "objectId" },
      { name: "organizationid", alias: "organizationId" },
      { name: "organizationname", alias: "organizationName" },
      { name: "organizationtype", alias: "organizationType" },
      { name: "overallstatus", alias: "overallStatus" },
      { name: "parametergroup", alias: "parameterGroup" },
      { name: "region", alias: "region" },
      { name: "reportingcycle", alias: "reportingCycle" },
      { name: "sourcename", alias: "sourceName" },
      { name: "state", alias: "state" },
      { name: "stateircategory", alias: "stateIrCategory" },
      { name: "watersize", alias: "waterSize" },
      { name: "watersizeunits", alias: "waterSizeUnits" },
      { name: "watertype", alias: "waterType" },
    ],
  },
};

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
    appendToWhere(query, col.name, queryParams.filters[col.alias]);
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
