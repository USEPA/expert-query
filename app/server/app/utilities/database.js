const logger = require("../utilities/logger");
const log = logger.logger;

let isLocal = false;
let isDevelopment = false;
let isStaging = false;

let dbHost = "";
let dbPort = "";
const dbName = process.env.DB_NAME ?? "expert_query";
const dbUser = process.env.DB_USERNAME;
const dbPassword = process.env.DB_PASSWORD;

if (process.env.NODE_ENV) {
  isLocal = "local" === process.env.NODE_ENV.toLowerCase();
  isDevelopment = "development" === process.env.NODE_ENV.toLowerCase();
  isStaging = "staging" === process.env.NODE_ENV.toLowerCase();
}

if (isLocal) {
  log.info("Since local, using a localhost Postgres database.");
  dbHost = process.env.DB_HOST;
  dbPort = process.env.DB_PORT;
} else {
  log.info("Using VCAP_SERVICES Information to connect to Postgres.");
  let vcap_services = JSON.parse(process.env.VCAP_SERVICES);
  dbHost = vcap_services["aws-rds"][0].credentials.host;
  dbPort = vcap_services["aws-rds"][0].credentials.port;
}
log.info(`host: ${dbHost}`);
log.info(`port: ${dbPort}`);
log.info(`dbName: ${dbName}`);
log.info(`user: ${dbUser}`);
log.info(`DB_POOL_MIN: ${parseInt(process.env.DB_POOL_MIN)}`);
log.info(`DB_POOL_MAX: ${parseInt(process.env.DB_POOL_MAX)}`);
log.info(`STREAM_BATCH_SIZE: ${parseInt(process.env.STREAM_BATCH_SIZE)}`);
log.info(
  `STREAM_HIGH_WATER_MARK: ${parseInt(process.env.STREAM_HIGH_WATER_MARK)}`
);

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

const knex = require("knex")({
  client: "pg",
  connection: {
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    database: dbName,
  },
  pool: {
    min: parseInt(process.env.DB_POOL_MIN),
    max: parseInt(process.env.DB_POOL_MAX),
  },
});

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
      {
        name: "assessmentdate",
        alias: "assessmentDate",
        lowParam: "assessmentDateLo",
        highParam: "assessmentDateHi",
      },
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
      {
        name: "completiondate",
        alias: "completionDate",
        lowParam: "completionDateLo",
        highParam: "completionDateHi",
      },
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

module.exports = {
  appendToWhere,
  knex,
  mapping,
};
