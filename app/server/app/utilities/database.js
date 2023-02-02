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
    idColumn: "objectid",
    columns: [
      { name: "objectid", alias: "objectId" },
      { name: "actionagency", alias: "actionAgency" },
      { name: "actionid", alias: "actionId" },
      { name: "actionname", alias: "actionName" },
      { name: "actiontype", alias: "actionType" },
      { name: "assessmentunitid", alias: "assessmentUnitId" },
      { name: "assessmentunitname", alias: "assessmentUnitName" },
      {
        name: "completiondate",
        alias: "completionDate",
        lowParam: "completionDateLo",
        highParam: "completionDateHi",
        type: "timestamptz",
      },
      { name: "includeinmeasure", alias: "includeInMeasure" },
      { name: "inindiancountry", alias: "inIndianCountry" },
      { name: "locationdescription", alias: "locationDescription" },
      { name: "organizationid", alias: "organizationId" },
      { name: "organizationname", alias: "organizationName" },
      { name: "organizationtype", alias: "organizationType" },
      { name: "parameter", alias: "parameter" },
      { name: "region", alias: "region" },
      { name: "state", alias: "state" },
      { name: "watersize", alias: "waterSize", type: "numeric" },
      { name: "watersizeunits", alias: "waterSizeUnits" },
      { name: "watertype", alias: "waterType" },
    ],
  },
  assessments: {
    tableName: "assessments",
    idColumn: "objectid",
    columns: [
      { name: "objectid", alias: "objectId" },
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
        type: "timestamptz",
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
      {
        name: "associatedactiontype",
        alias: "associatedActionType",
        type: "numeric",
      },
      {
        name: "consentdecreecycle",
        alias: "consentDecreeCycle",
        lowParam: "consentDecreeCycleLo",
        highParam: "consentDecreeCycleHi",
        type: "numeric",
      },
      { name: "cwa303dpriorityranking", alias: "cwa303dPriorityRanking" },
      {
        name: "cycleexpectedtoattain",
        alias: "cycleExpectedToAttain",
        lowParam: "cycleExpectedToAttainLo",
        highParam: "cycleExpectedToAttainHi",
        type: "numeric",
      },
      {
        name: "cyclefirstlisted",
        alias: "cycleFirstListed",
        lowParam: "cycleFirstListedLo",
        highParam: "cycleFirstListedHi",
        type: "numeric",
      },
      {
        name: "cyclelastassessed",
        alias: "cycleLastAssessed",
        lowParam: "cycleLastAssessedLo",
        highParam: "cycleLastAssessedHi",
        type: "numeric",
      },
      {
        name: "cyclescheduledfortmdl",
        alias: "cycleScheduledForTmdl",
        lowParam: "cycleScheduledForTmdlLo",
        highParam: "cycleScheduledForTmdlHi",
        type: "numeric",
      },
      { name: "delisted", alias: "delisted" },
      { name: "delistedreason", alias: "delistedReason" },
      { name: "epaircategory", alias: "epaIrCategory" },
      { name: "locationdescription", alias: "locationDescription" },
      {
        name: "monitoringenddate",
        alias: "monitoringEndDate",
        lowParam: "monitoringEndDateLo",
        highParam: "monitoringEndDateHi",
        type: "timestamptz",
      },
      {
        name: "monitoringstartdate",
        alias: "monitoringStartDate",
        lowParam: "monitoringStartDateLo",
        highParam: "monitoringStartDateHi",
        type: "timestamptz",
      },
      { name: "organizationid", alias: "organizationId" },
      { name: "organizationname", alias: "organizationName" },
      { name: "organizationtype", alias: "organizationType" },
      { name: "overallstatus", alias: "overallStatus" },
      { name: "parameterattainment", alias: "parameterAttainment" },
      { name: "parametergroup", alias: "parameterGroup" },
      {
        name: "parameterircategory",
        alias: "parameterIrCategory",
        type: "numeric",
      },
      { name: "parametername", alias: "parameterName" },
      {
        name: "parameterstateircategory",
        alias: "parameterStateIrCategory",
        type: "numeric",
      },
      { name: "parameterstatus", alias: "parameterStatus" },
      { name: "pollutantindicator", alias: "pollutantIndicator" },
      { name: "region", alias: "region" },
      {
        name: "reportingcycle",
        alias: "reportingCycle",
        default: "latest",
        type: "numeric",
      },
      {
        name: "seasonenddate",
        alias: "seasonEndDate",
        lowParam: "seasonEndDateLo",
        highParam: "seasonEndDateHi",
        type: "timestamptz",
      },
      {
        name: "seasonstartdate",
        alias: "seasonStartDate",
        lowParam: "seasonStartDateLo",
        highParam: "seasonStartDateHi",
        type: "timestamptz",
      },
      { name: "sizesource", alias: "sizeSource" },
      { name: "sourcescale", alias: "sourceScale" },
      { name: "state", alias: "state" },
      { name: "stateircategory", alias: "stateIrCategory" },
      { name: "useclassname", alias: "useClassName" },
      { name: "usegroup", alias: "useGroup" },
      { name: "useircategory", alias: "useIrCategory", type: "numeric" },
      { name: "usename", alias: "useName" },
      {
        name: "usestateircategory",
        alias: "useStateIrCategory",
        type: "numeric",
      },
      { name: "usesupport", alias: "useSupport" },
      { name: "vision303dpriority", alias: "vision303dPriority" },
      { name: "watersize", alias: "waterSize", type: "numeric" },
      { name: "watersizeunits", alias: "waterSizeUnits" },
      { name: "watertype", alias: "waterType" },
    ],
  },
  assessmentUnits: {
    tableName: "assessment_units",
    idColumn: "objectid",
    columns: [
      { name: "objectid", alias: "objectid" },
      { name: "assessmentunitid", alias: "assessmentUnitId" },
      { name: "assessmentunitname", alias: "assessmentUnitName" },
      { name: "assessmentunitstatus", alias: "assessmentUnitStatus" },
      { name: "locationdescription", alias: "locationDescription" },
      { name: "locationtext", alias: "locationText" },
      { name: "locationtypecode", alias: "locationTypeCode" },
      { name: "organizationid", alias: "organizationId" },
      { name: "organizationname", alias: "organizationName" },
      { name: "organizationtype", alias: "organizationType" },
      { name: "region", alias: "region" },
      {
        name: "reportingcycle",
        alias: "reportingCycle",
        default: "latest",
        type: "numeric",
      },
      { name: "sizesource", alias: "sizeSource" },
      { name: "sourcescale", alias: "sourceScale" },
      { name: "state", alias: "state" },
      { name: "useclassname", alias: "useClassName" },
      { name: "watersize", alias: "waterSize", type: "numeric" },
      { name: "watersizeunits", alias: "waterSizeUnits" },
      { name: "watertype", alias: "waterType" },
    ],
  },
  assessmentUnitsMonitoringLocations: {
    tableName: "assessment_units_monitoring_locations",
    idColumn: "objectid",
    columns: [
      { name: "objectid", alias: "objectId" },
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
      {
        name: "reportingcycle",
        alias: "reportingCycle",
        default: "latest",
        type: "numeric",
      },
      { name: "sizesource", alias: "sizeSource" },
      { name: "sourcescale", alias: "sourceScale" },
      { name: "state", alias: "state" },
      { name: "useclassname", alias: "useClassName" },
      { name: "watersize", alias: "waterSize", type: "numeric" },
      { name: "watersizeunits", alias: "waterSizeUnits" },
      { name: "watertype", alias: "waterType" },
    ],
  },
  catchmentCorrespondence: {
    tableName: "catchment_correspondence",
    idColumn: "objectid",
    columns: [
      { name: "objectid", alias: "objectId" },
      { name: "assessmentunitid", alias: "assessmentUnitId" },
      { name: "assessmentunitname", alias: "assessmentUnitName" },
      {
        name: "catchmentnhdplusid",
        alias: "catchmentNhdPlusId",
        type: "numeric",
      },
      { name: "organizationid", alias: "organizationId" },
      { name: "organizationname", alias: "organizationName" },
      { name: "organizationtype", alias: "organizationType" },
      { name: "region", alias: "region" },
      {
        name: "reportingcycle",
        alias: "reportingCycle",
        default: "latest",
        type: "numeric",
      },
      { name: "state", alias: "state" },
    ],
  },
  sources: {
    tableName: "sources",
    idColumn: "objectid",
    columns: [
      { name: "objectid", alias: "objectId" },
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
      {
        name: "reportingcycle",
        alias: "reportingCycle",
        default: "latest",
        type: "numeric",
      },
      { name: "sourcename", alias: "sourceName" },
      { name: "state", alias: "state" },
      { name: "stateircategory", alias: "stateIrCategory" },
      { name: "watersize", alias: "waterSize", type: "numeric" },
      { name: "watersizeunits", alias: "waterSizeUnits" },
      { name: "watertype", alias: "waterType" },
    ],
  },
  tmdl: {
    tableName: "tmdl",
    idColumn: "objectid",
    columns: [
      { name: "objectid", alias: "objectId" },
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
        type: "timestamptz",
      },
      { name: "explicitmarginofsafety", alias: "explicitMarginOfSafety" },
      {
        name: "fiscalyearestablished",
        alias: "fiscalYearEstablished",
        lowParam: "fiscalYearEstablishedLo",
        highParam: "fiscalYearEstablishedHi",
      },
      { name: "implicitmarginofsafety", alias: "implicitMarginOfSafety" },
      { name: "includeinmeasure", alias: "includeInMeasure" },
      { name: "inindiancountry", alias: "inIndianCountry" },
      { name: "loadallocation", alias: "loadAllocation", type: "numeric" },
      { name: "loadallocationunits", alias: "loadAllocationUnits" },
      { name: "locationdescription", alias: "locationDescription" },
      { name: "npdesidentifier", alias: "npdesIdentifier" },
      { name: "organizationid", alias: "organizationId" },
      { name: "organizationname", alias: "organizationName" },
      { name: "organizationtype", alias: "organizationType" },
      { name: "otheridentifier", alias: "otherIdentifier" },
      { name: "pollutant", alias: "pollutant" },
      { name: "region", alias: "region" },
      {
        name: "reportingcycle",
        alias: "reportingCycle",
        default: "latest",
        type: "numeric",
      },
      { name: "sourcetype", alias: "sourceType" },
      { name: "state", alias: "state" },
      {
        name: "tmdldate",
        alias: "tmdlDate",
        lowParam: "tmdlDateLo",
        highParam: "tmdlDateHi",
        type: "timestamptz",
      },
      {
        name: "wasteloadallocation",
        alias: "wasteLoadAllocation",
        type: "numeric",
      },
      { name: "watersize", alias: "waterSize", type: "numeric" },
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
