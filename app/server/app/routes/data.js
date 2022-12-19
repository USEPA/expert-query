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
  actions: {
    tableName: "actions",
    idColumn: "id",
    columns: [
      { name: "id", alias: "id" },
      { name: "actionagency", alias: "actionAgency" },
      { name: "actionid", alias: "actionId" },
      { name: "actionname", alias: "actionName" },
      { name: "actiontype", alias: "actionType" },
      { name: "assessmentunitid", alias: "assessmentUnitId" },
      { name: "assessmentunitname", alias: "assessmentUnitName" },
      { name: "completiondate", alias: "completionDate" },
      { name: "includeinmeasure", alias: "includeInMeasure" },
      { name: "inindiancountry", alias: "inIndianCountry" },
      { name: "locationdescription", alias: "locationDescription" },
      { name: "organizationid", alias: "organizationId" },
      { name: "organizationname", alias: "organizationName" },
      { name: "organizationtype", alias: "organizationType" },
      { name: "parameter", alias: "parameter" },
      { name: "region", alias: "region" },
      { name: "state", alias: "state" },
      { name: "watersize", alias: "waterSize" },
      { name: "watersizeunits", alias: "waterSizeUnits" },
      { name: "watertype", alias: "waterType" },
    ],
  },
  assessments: {
    tableName: "assessments",
    idColumn: "id",
    columns: [
      { name: "id", alias: "id" },
      {
        name: "alternatelistingidentifier",
        alias: "alternateListingIdentifier",
      },
      { name: "assessmentbasis", alias: "assessmentBasis" },
      { name: "assessmentdate", alias: "assessmentDate" },
      { name: "assessmentmethods", alias: "assessmentMethods" },
      { name: "assessmenttypes", alias: "assessmentTypes" },
      { name: "assessmentunitid", alias: "assessmentUnitId" },
      { name: "assessmentunitname", alias: "assessmentUnitName" },
      { name: "assessmentunitstatus", alias: "assessmentUnitStatus" },
      { name: "associatedactionagency", alias: "associatedActionAgency" },
      { name: "associatedactionid", alias: "associatedActionId" },
      { name: "associatedactionname", alias: "associatedActionName" },
      { name: "associatedactionstatus", alias: "associatedActionStatus" },
      { name: "associatedactiontype", alias: "associatedActionType" },
      { name: "consentdecreecycle", alias: "consentDecreeCycle" },
      { name: "cwa303dpriorityranking", alias: "cwa303dPriorityRanking" },
      { name: "cycleexpectedtoattain", alias: "cycleExpectedToAttain" },
      { name: "cyclefirstlisted", alias: "cycleFirstListed" },
      { name: "cyclelastassessed", alias: "cycleLastAssessed" },
      { name: "cyclescheduledfortmdl", alias: "cycleScheduledForTmdl" },
      { name: "delisted", alias: "delisted" },
      { name: "delistedreason", alias: "delistedReason" },
      { name: "epaircategory", alias: "epaIrCategory" },
      { name: "locationdescription", alias: "locationDescription" },
      { name: "monitoringenddate", alias: "monitoringEndDate" },
      { name: "monitoringstartdate", alias: "monitoringStartDate" },
      { name: "organizationid", alias: "organizationId" },
      { name: "organizationname", alias: "organizationName" },
      { name: "organizationtype", alias: "organizationType" },
      { name: "overallstatus", alias: "overallStatus" },
      { name: "parameterattainment", alias: "parameterAttainment" },
      { name: "parametergroup", alias: "parameterGroup" },
      { name: "parameterircategory", alias: "parameterIrCategory" },
      { name: "parametername", alias: "parameterName" },
      { name: "parameterstateircategory", alias: "parameterStateIrCategory" },
      { name: "parameterstatus", alias: "parameterStatus" },
      { name: "pollutantindicator", alias: "pollutantIndicator" },
      { name: "region", alias: "region" },
      { name: "reportingcycle", alias: "reportingCycle" },
      { name: "seasonenddate", alias: "seasonEndDate" },
      { name: "seasonstartdate", alias: "seasonStartDate" },
      { name: "sizesource", alias: "sizeSource" },
      { name: "sourcescale", alias: "sourceScale" },
      { name: "state", alias: "state" },
      { name: "stateircategory", alias: "stateIrCategory" },
      { name: "useclassname", alias: "useClassName" },
      { name: "usegroup", alias: "useGroup" },
      { name: "useircategory", alias: "useIrCategory" },
      { name: "usename", alias: "useName" },
      { name: "usestateircategory", alias: "useStateIrCategory" },
      { name: "usesupport", alias: "useSupport" },
      { name: "vision303dpriority", alias: "vision303dPriority" },
      { name: "watersize", alias: "waterSize" },
      { name: "watersizeunits", alias: "waterSizeUnits" },
      { name: "watertype", alias: "waterType" },
    ],
  },
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
  catchmentCorrespondence: {
    tableName: "catchment_correspondence",
    idColumn: "id",
    columns: [
      { name: "id", alias: "id" },
      { name: "assessmentunitid", alias: "assessmentUnitId" },
      { name: "assessmentunitname", alias: "assessmentUnitName" },
      { name: "catchmentnhdplusid", alias: "catchmentNhdPlusId" },
      { name: "organizationid", alias: "organizationId" },
      { name: "organizationname", alias: "organizationName" },
      { name: "organizationtype", alias: "organizationType" },
      { name: "region", alias: "region" },
      { name: "reportingcycle", alias: "reportingCycle" },
      { name: "state", alias: "state" },
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
  tmdl: {
    tableName: "tmdl",
    idColumn: "id",
    columns: [
      { name: "id", alias: "id" },
      { name: "actionagency", alias: "actionAgency" },
      { name: "actionid", alias: "actionId" },
      { name: "actionname", alias: "actionName" },
      { name: "addressedparameter", alias: "addressedParameter" },
      { name: "assessmentunitid", alias: "assessmentUnitId" },
      { name: "assessmentunitname", alias: "assessmentUnitName" },
      { name: "completiondate", alias: "completionDate" },
      { name: "explicitmarginofsafety", alias: "explicitMarginOfSafety" },
      { name: "fiscalyearestablished", alias: "fiscalYearEstablished" },
      { name: "implicitmarginofsafety", alias: "implicitMarginOfSafety" },
      { name: "includeinmeasure", alias: "includeInMeasure" },
      { name: "inindiancountry", alias: "inIndianCountry" },
      { name: "loadallocation", alias: "loadAllocation" },
      { name: "loadallocationunits", alias: "loadAllocationUnits" },
      { name: "locationdescription", alias: "locationDescription" },
      { name: "npdesidentifier", alias: "npdesIdentifier" },
      { name: "organizationid", alias: "organizationId" },
      { name: "organizationname", alias: "organizationName" },
      { name: "organizationtype", alias: "organizationType" },
      { name: "otheridentifier", alias: "otherIdentifier" },
      { name: "pollutant", alias: "pollutant" },
      { name: "region", alias: "region" },
      { name: "reportingcycle", alias: "reportingCycle" },
      { name: "sourcetype", alias: "sourceType" },
      { name: "state", alias: "state" },
      { name: "tmdldate", alias: "tmdlDate" },
      { name: "tmdlendpoint", alias: "tmdlEndPoint" },
      { name: "wasteloadallocation", alias: "wasteLoadAllocation" },
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
