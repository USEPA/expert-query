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

module.exports = {
  appendToWhere,
  knex,
  mapping,
};
