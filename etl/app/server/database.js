import Excel from 'exceljs';
import { createWriteStream, mkdirSync } from 'fs';
import path, { resolve } from 'path';
import pg from 'pg';
import QueryStream from 'pg-query-stream';
import { setTimeout } from 'timers/promises';
import { fileURLToPath } from 'url';
import util from 'util';
import zlib from 'zlib';
// utils
import { getEnvironment } from './utilities/environment.js';
import { logger as log } from './utilities/logger.js';
import StreamingService from './utilities/streamingService.js';
import * as profiles from './profiles/index.js';
import {
  archiveNationalDownloads,
  createS3Stream,
  deleteDirectory,
} from './s3.js';

const { Client, Pool } = pg;
const setImmediatePromise = util.promisify(setImmediate);

const environment = getEnvironment();

const mapping = {
  actions: {
    tableName: 'actions',
    idColumn: 'id',
    columns: [
      { name: 'id', alias: 'id' },
      { name: 'actionagency', alias: 'actionAgency' },
      { name: 'actionid', alias: 'actionId' },
      { name: 'actionname', alias: 'actionName' },
      { name: 'actiontype', alias: 'actionType' },
      { name: 'assessmentunitid', alias: 'assessmentUnitId' },
      { name: 'assessmentunitname', alias: 'assessmentUnitName' },
      {
        name: 'completiondate',
        alias: 'completionDate',
        lowParam: 'completionDateLo',
        highParam: 'completionDateHi',
        type: 'timestamptz',
      },
      { name: 'includeinmeasure', alias: 'includeInMeasure' },
      { name: 'inindiancountry', alias: 'inIndianCountry' },
      { name: 'locationdescription', alias: 'locationDescription' },
      { name: 'organizationid', alias: 'organizationId' },
      { name: 'organizationname', alias: 'organizationName' },
      { name: 'organizationtype', alias: 'organizationType' },
      { name: 'parameter', alias: 'parameter' },
      { name: 'region', alias: 'region' },
      { name: 'state', alias: 'state' },
      { name: 'watersize', alias: 'waterSize' },
      { name: 'watersizeunits', alias: 'waterSizeUnits' },
      { name: 'watertype', alias: 'waterType' },
    ],
  },
  assessments: {
    tableName: 'assessments',
    idColumn: 'id',
    columns: [
      { name: 'id', alias: 'id' },
      {
        name: 'alternatelistingidentifier',
        alias: 'alternateListingIdentifier',
      },
      { name: 'assessmentbasis', alias: 'assessmentBasis' },
      {
        name: 'assessmentdate',
        alias: 'assessmentDate',
        lowParam: 'assessmentDateLo',
        highParam: 'assessmentDateHi',
        type: 'timestamptz',
      },
      { name: 'assessmentmethods', alias: 'assessmentMethods' },
      { name: 'assessmenttypes', alias: 'assessmentTypes' },
      { name: 'assessmentunitid', alias: 'assessmentUnitId' },
      { name: 'assessmentunitname', alias: 'assessmentUnitName' },
      { name: 'assessmentunitstatus', alias: 'assessmentUnitStatus' },
      { name: 'associatedactionagency', alias: 'associatedActionAgency' },
      { name: 'associatedactionid', alias: 'associatedActionId' },
      { name: 'associatedactionname', alias: 'associatedActionName' },
      { name: 'associatedactionstatus', alias: 'associatedActionStatus' },
      { name: 'associatedactiontype', alias: 'associatedActionType' },
      {
        name: 'consentdecreecycle',
        alias: 'consentDecreeCycle',
        lowParam: 'consentDecreeCycleLo',
        highParam: 'consentDecreeCycleHi',
      },
      { name: 'cwa303dpriorityranking', alias: 'cwa303dPriorityRanking' },
      {
        name: 'cycleexpectedtoattain',
        alias: 'cycleExpectedToAttain',
        lowParam: 'cycleExpectedToAttainLo',
        highParam: 'cycleExpectedToAttainHi',
      },
      {
        name: 'cyclefirstlisted',
        alias: 'cycleFirstListed',
        lowParam: 'cycleFirstListedLo',
        highParam: 'cycleFirstListedHi',
      },
      {
        name: 'cyclelastassessed',
        alias: 'cycleLastAssessed',
        lowParam: 'cycleLastAssessedLo',
        highParam: 'cycleLastAssessedHi',
      },
      {
        name: 'cyclescheduledfortmdl',
        alias: 'cycleScheduledForTmdl',
        lowParam: 'cycleScheduledForTmdlLo',
        highParam: 'cycleScheduledForTmdlHi',
      },
      { name: 'delisted', alias: 'delisted' },
      { name: 'delistedreason', alias: 'delistedReason' },
      { name: 'epaircategory', alias: 'epaIrCategory' },
      { name: 'locationdescription', alias: 'locationDescription' },
      {
        name: 'monitoringenddate',
        alias: 'monitoringEndDate',
        lowParam: 'monitoringEndDateLo',
        highParam: 'monitoringEndDateHi',
        type: 'timestamptz',
      },
      {
        name: 'monitoringstartdate',
        alias: 'monitoringStartDate',
        lowParam: 'monitoringStartDateLo',
        highParam: 'monitoringStartDateHi',
        type: 'timestamptz',
      },
      { name: 'organizationid', alias: 'organizationId' },
      { name: 'organizationname', alias: 'organizationName' },
      { name: 'organizationtype', alias: 'organizationType' },
      { name: 'overallstatus', alias: 'overallStatus' },
      { name: 'parameterattainment', alias: 'parameterAttainment' },
      { name: 'parametergroup', alias: 'parameterGroup' },
      { name: 'parameterircategory', alias: 'parameterIrCategory' },
      { name: 'parametername', alias: 'parameterName' },
      { name: 'parameterstateircategory', alias: 'parameterStateIrCategory' },
      { name: 'parameterstatus', alias: 'parameterStatus' },
      { name: 'pollutantindicator', alias: 'pollutantIndicator' },
      { name: 'region', alias: 'region' },
      {
        name: 'reportingcycle',
        alias: 'reportingCycle',
        lowParam: 'reportingCycleLo',
        highParam: 'reportingCycleHi',
      },
      {
        name: 'seasonenddate',
        alias: 'seasonEndDate',
        lowParam: 'seasonEndDateLo',
        highParam: 'seasonEndDateHi',
        type: 'timestamptz',
      },
      {
        name: 'seasonstartdate',
        alias: 'seasonStartDate',
        lowParam: 'seasonStartDateLo',
        highParam: 'seasonStartDateHi',
        type: 'timestamptz',
      },
      { name: 'sizesource', alias: 'sizeSource' },
      { name: 'sourcescale', alias: 'sourceScale' },
      { name: 'state', alias: 'state' },
      { name: 'stateircategory', alias: 'stateIrCategory' },
      { name: 'useclassname', alias: 'useClassName' },
      { name: 'usegroup', alias: 'useGroup' },
      { name: 'useircategory', alias: 'useIrCategory' },
      { name: 'usename', alias: 'useName' },
      { name: 'usestateircategory', alias: 'useStateIrCategory' },
      { name: 'usesupport', alias: 'useSupport' },
      { name: 'vision303dpriority', alias: 'vision303dPriority' },
      { name: 'watersize', alias: 'waterSize' },
      { name: 'watersizeunits', alias: 'waterSizeUnits' },
      { name: 'watertype', alias: 'waterType' },
    ],
  },
  assessmentUnits: {
    tableName: 'assessment_units',
    idColumn: 'id',
    columns: [
      { name: 'id', alias: 'id' },
      { name: 'assessmentunitid', alias: 'assessmentUnitId' },
      { name: 'assessmentunitname', alias: 'assessmentUnitName' },
      { name: 'assessmentunitstate', alias: 'assessmentUnitState' },
      { name: 'locationdescription', alias: 'locationDescription' },
      { name: 'locationtext', alias: 'locationText' },
      { name: 'locationtypecode', alias: 'locationTypeCode' },
      { name: 'organizationid', alias: 'organizationId' },
      { name: 'organizationname', alias: 'organizationName' },
      { name: 'organizationtype', alias: 'organizationType' },
      { name: 'region', alias: 'region' },
      {
        name: 'reportingcycle',
        alias: 'reportingCycle',
        lowParam: 'reportingCycleLo',
        highParam: 'reportingCycleHi',
      },
      { name: 'sizesource', alias: 'sizeSource' },
      { name: 'sourcescale', alias: 'sourceScale' },
      { name: 'state', alias: 'state' },
      { name: 'useclassname', alias: 'useClassName' },
      { name: 'watersize', alias: 'waterSize' },
      { name: 'watersizeunits', alias: 'waterSizeUnits' },
      { name: 'watertype', alias: 'waterType' },
    ],
  },
  assessmentUnitsMonitoringLocations: {
    tableName: 'assessment_units_monitoring_locations',
    idColumn: 'id',
    columns: [
      { name: 'id', alias: 'id' },
      { name: 'assessmentunitid', alias: 'assessmentUnitId' },
      { name: 'assessmentunitname', alias: 'assessmentUnitName' },
      { name: 'assessmentunitstatus', alias: 'assessmentUnitStatus' },
      { name: 'locationdescription', alias: 'locationDescription' },
      {
        name: 'monitoringlocationdatalink',
        alias: 'monitoringLocationDataLink',
      },
      { name: 'monitoringlocationid', alias: 'monitoringLocationId' },
      { name: 'monitoringlocationorgid', alias: 'monitoringLocationOrgId' },
      { name: 'organizationid', alias: 'organizationId' },
      { name: 'organizationname', alias: 'organizationName' },
      { name: 'organizationtype', alias: 'organizationType' },
      { name: 'region', alias: 'region' },
      {
        name: 'reportingcycle',
        alias: 'reportingCycle',
        lowParam: 'reportingCycleLo',
        highParam: 'reportingCycleHi',
      },
      { name: 'sizesource', alias: 'sizeSource' },
      { name: 'sourcescale', alias: 'sourceScale' },
      { name: 'state', alias: 'state' },
      { name: 'useclassname', alias: 'useClassName' },
      { name: 'watersize', alias: 'waterSize' },
      { name: 'watersizeunits', alias: 'waterSizeUnits' },
      { name: 'watertype', alias: 'waterType' },
    ],
  },
  catchmentCorrespondence: {
    tableName: 'catchment_correspondence',
    idColumn: 'id',
    columns: [
      { name: 'id', alias: 'id' },
      { name: 'assessmentunitid', alias: 'assessmentUnitId' },
      { name: 'assessmentunitname', alias: 'assessmentUnitName' },
      { name: 'catchmentnhdplusid', alias: 'catchmentNhdPlusId' },
      { name: 'organizationid', alias: 'organizationId' },
      { name: 'organizationname', alias: 'organizationName' },
      { name: 'organizationtype', alias: 'organizationType' },
      { name: 'region', alias: 'region' },
      {
        name: 'reportingcycle',
        alias: 'reportingCycle',
        lowParam: 'reportingCycleLo',
        highParam: 'reportingCycleHi',
      },
      { name: 'state', alias: 'state' },
    ],
  },
  sources: {
    tableName: 'sources',
    idColumn: 'id',
    columns: [
      { name: 'id', alias: 'id' },
      { name: 'assessmentunitid', alias: 'assessmentUnitId' },
      { name: 'assessmentunitname', alias: 'assessmentUnitName' },
      { name: 'causename', alias: 'causeName' },
      { name: 'confirmed', alias: 'confirmed' },
      { name: 'epaircategory', alias: 'epaIrCategory' },
      { name: 'locationdescription', alias: 'locationDescription' },
      { name: 'organizationid', alias: 'organizationId' },
      { name: 'organizationname', alias: 'organizationName' },
      { name: 'organizationtype', alias: 'organizationType' },
      { name: 'overallstatus', alias: 'overallStatus' },
      { name: 'parametergroup', alias: 'parameterGroup' },
      { name: 'region', alias: 'region' },
      {
        name: 'reportingcycle',
        alias: 'reportingCycle',
        lowParam: 'reportingCycleLo',
        highParam: 'reportingCycleHi',
      },
      { name: 'sourcename', alias: 'sourceName' },
      { name: 'state', alias: 'state' },
      { name: 'stateircategory', alias: 'stateIrCategory' },
      { name: 'watersize', alias: 'waterSize' },
      { name: 'watersizeunits', alias: 'waterSizeUnits' },
      { name: 'watertype', alias: 'waterType' },
    ],
  },
  tmdl: {
    tableName: 'tmdl',
    idColumn: 'id',
    columns: [
      { name: 'id', alias: 'id' },
      { name: 'actionagency', alias: 'actionAgency' },
      { name: 'actionid', alias: 'actionId' },
      { name: 'actionname', alias: 'actionName' },
      { name: 'addressedparameter', alias: 'addressedParameter' },
      { name: 'assessmentunitid', alias: 'assessmentUnitId' },
      { name: 'assessmentunitname', alias: 'assessmentUnitName' },
      {
        name: 'completiondate',
        alias: 'completionDate',
        lowParam: 'completionDateLo',
        highParam: 'completionDateHi',
        type: 'timestamptz',
      },
      { name: 'explicitmarginofsafety', alias: 'explicitMarginOfSafety' },
      {
        name: 'fiscalyearestablished',
        alias: 'fiscalYearEstablished',
        lowParam: 'fiscalYearEstablishedLo',
        highParam: 'fiscalYearEstablishedHi',
      },
      { name: 'implicitmarginofsafety', alias: 'implicitMarginOfSafety' },
      { name: 'includeinmeasure', alias: 'includeInMeasure' },
      { name: 'inindiancountry', alias: 'inIndianCountry' },
      { name: 'loadallocation', alias: 'loadAllocation' },
      { name: 'loadallocationunits', alias: 'loadAllocationUnits' },
      { name: 'locationdescription', alias: 'locationDescription' },
      { name: 'npdesidentifier', alias: 'npdesIdentifier' },
      { name: 'organizationid', alias: 'organizationId' },
      { name: 'organizationname', alias: 'organizationName' },
      { name: 'organizationtype', alias: 'organizationType' },
      { name: 'otheridentifier', alias: 'otherIdentifier' },
      { name: 'pollutant', alias: 'pollutant' },
      { name: 'region', alias: 'region' },
      {
        name: 'reportingcycle',
        alias: 'reportingCycle',
        lowParam: 'reportingCycleLo',
        highParam: 'reportingCycleHi',
      },
      { name: 'sourcetype', alias: 'sourceType' },
      { name: 'state', alias: 'state' },
      {
        name: 'tmdldate',
        alias: 'tmdlDate',
        lowParam: 'tmdlDateLo',
        highParam: 'tmdlDateHi',
        type: 'timestamptz',
      },
      { name: 'tmdlendpoint', alias: 'tmdlEndPoint' },
      { name: 'wasteloadallocation', alias: 'wasteLoadAllocation' },
      { name: 'watersize', alias: 'waterSize' },
      { name: 'watersizeunits', alias: 'waterSizeUnits' },
      { name: 'watertype', alias: 'waterType' },
    ],
  },
};

let database_host = '';
let database_user = '';
let database_pwd = '';
let database_port = '';

const dbName = process.env.DB_NAME ?? 'expert_query';

const eqUser = process.env.EQ_USERNAME ?? 'eq';

if (environment.isLocal) {
  log.info('Since local, using a localhost Postgres database.');
  database_host = process.env.DB_HOST;
  database_user = process.env.DB_USERNAME;
  database_pwd = process.env.DB_PASSWORD;
  database_port = process.env.DB_PORT;
} else {
  log.info('Using VCAP_SERVICES Information to connect to Postgres.');
  let vcap_services = JSON.parse(process.env.VCAP_SERVICES);
  database_host = vcap_services['aws-rds'][0].credentials.host;
  database_user = vcap_services['aws-rds'][0].credentials.username;
  database_pwd = vcap_services['aws-rds'][0].credentials.password;
  database_port = vcap_services['aws-rds'][0].credentials.port;
  log.info(database_host);
  log.info(database_user);
  log.info(database_port);
}

const pgConfig = {
  user: database_user,
  password: database_pwd,
  database: 'postgres',
  port: database_port,
  host: database_host,
};

const eqConfig = {
  ...pgConfig,
  database: dbName,
  connectionTimeoutMillis: 0,
  idleTimeoutMillis: 0,
  max: 10,
};

export function startConnPool() {
  const pool = new Pool(eqConfig);
  log.info('EqPool connection pool started');
  return pool;
}

export async function endConnPool(pool) {
  await pool.end();
  log.info('EqPool connection pool ended');
}

export async function checkLogTables() {
  const client = await connectClient(eqConfig);

  // Ensure the log tables exist; if not, create them
  try {
    await client.query('BEGIN');
    await client.query('CREATE SCHEMA IF NOT EXISTS logging');
    await client.query(
      `CREATE TABLE IF NOT EXISTS logging.etl_log
        (
          id SERIAL PRIMARY KEY,
          end_time TIMESTAMP,
          load_error VARCHAR,
          start_time TIMESTAMP NOT NULL
        )`,
    );
    await client.query(
      `CREATE TABLE IF NOT EXISTS logging.etl_schemas
        (
          id SERIAL PRIMARY KEY,
          active BOOLEAN NOT NULL,
          creation_date TIMESTAMP WITHOUT TIME ZONE NOT NULL,
          schema_name VARCHAR(20) NOT NULL
        )`,
    );

    // create etl_status table
    await client.query(
      `CREATE TABLE IF NOT EXISTS logging.etl_status
        (
          database VARCHAR(20),
          glossary VARCHAR(20),
          domain_values VARCHAR(20)
        )`,
    );

    // Check if row has already been added to etl_status table
    const result = await client
      .query('SELECT * FROM logging.etl_status')
      .catch((err) => log.warn(`Could not query databases: ${err}`));
    if (!result.rowCount) {
      await client.query(
        `INSERT INTO logging.etl_status
          (database, glossary, domain_values)
          VALUES ('idle', 'idle', 'idle')`,
      );
    }

    await client.query(`GRANT USAGE ON SCHEMA logging TO ${eqUser}`);
    await client.query(
      `GRANT SELECT ON ALL TABLES IN SCHEMA logging TO ${eqUser}`,
    );
    await client.query('COMMIT');
    log.info('Logging tables exist');
  } catch (err) {
    log.warn('Failed to confirm that logging tables exist');
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.end();
  }
}

export async function checkForServerCrash() {
  const client = await connectClient(eqConfig);

  try {
    // check the etl_status table
    const result = await client
      .query('SELECT * FROM logging.etl_status')
      .catch((err) => log.warn(`Could not query databases: ${err}`));

    await client.query('BEGIN');

    if (!result.rowCount) {
      await client.query(
        `INSERT INTO logging.etl_status
          (database, glossary, domain_values)
          VALUES ('idle', 'idle', 'idle')`,
      );
    } else {
      // set statuses to failed if they were running when the server crashed
      if (result.rows[0].glossary === 'running') {
        await updateEtlStatus(client, 'glossary', 'failed');
      }
      if (result.rows[0].domain_values === 'running') {
        await updateEtlStatus(client, 'domain_values', 'failed');
      }
      if (result.rows[0].database === 'running') {
        await updateEtlStatus(client, 'database', 'failed');

        // get last schema id
        const schema = await client
          .query(
            `SELECT id, active FROM logging.etl_schemas ORDER BY creation_date DESC LIMIT 1`,
          )
          .catch((err) => {
            log.warn(`Could not query schemas: ${err}`);
          });

        // log error to etl_log table if the last schema did not complete
        if (schema?.rowCount && !schema.rows[0].active) {
          const id = schema.rows[0].id;

          // check if the log for this schema already has an error logged
          const log = await client
            .query(
              `SELECT end_time, load_error FROM logging.etl_log WHERE id = $1`,
              [id],
            )
            .catch((err) => {
              log.warn(`Could not query schemas: ${err}`);
            });

          if (
            log?.rowCount &&
            !log.rows[0].end_time &&
            !log.rows[0].load_error
          ) {
            logEtlLoadError(
              client,
              id,
              'Server crashed. Check cloud.gov logs for more info.',
            );
          }
        }
      }
    }

    await client.query('COMMIT');
  } catch (err) {
    log.warn('Failed to confirm that logging tables exist');
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.end();
  }
}

async function connectClient(config) {
  const client = new Client(config);
  await client.connect().catch((err) => {
    log.error(`${config.database} connection failed: ${err}`);
    throw err;
  });
  log.info(`${config.database} connection established`);
  return client;
}

// Connect to the default 'postgres' database
export async function connectPostgres() {
  return await connectClient(pgConfig);
}

// Create a new database to avoid mutating the default 'postgres' database
export async function createEqDb(client) {
  // Check if the database has already been created
  const db = await client
    .query('SELECT datname FROM pg_database WHERE datname = $1', [dbName])
    .catch((err) => log.warn(`Could not query databases: ${err}`));

  if (!db.rowCount) {
    try {
      // Create the expert_query db
      await client.query('CREATE DATABASE ' + dbName);
      await client.query(
        `ALTER DATABASE ${dbName} SET timezone TO 'America/New_York';`,
      );
      log.info(`${dbName} database created!`);
    } catch (err) {
      log.info(`Warning: ${dbName} database! ${err}`);
    }
  }

  // Check if the user has already been created
  const user = await client
    .query('SELECT usename FROM pg_user WHERE usename = $1', [eqUser])
    .catch((err) => log.warn(`Could not query users: ${err}`));

  if (!user.rowCount) {
    try {
      // Create the eq user
      await client
        .query(
          `CREATE USER ${eqUser} WITH PASSWORD '${process.env.EQ_PASSWORD}'`,
        )
        .catch((err) => log.info(`Warning1: ${eqUser} user! ${err}`));
      log.info(`${eqUser} user created!`);
    } catch (err) {
      log.info(`Warning: ${eqUser} user! ${err}`);
    }
  }

  await checkLogTables();
}

// Create a fresh schema for new data
async function createNewSchema(pool, schemaName) {
  const client = await getClient(pool);
  try {
    // Create new schema
    await client.query('BEGIN');
    await client.query(`CREATE SCHEMA IF NOT EXISTS ${schemaName}`);

    // Add new schema to control table
    const result = await client.query(
      'INSERT INTO logging.etl_schemas' +
        ' (schema_name, creation_date, active)' +
        ' VALUES ($1, current_timestamp, $2) RETURNING id',
      [schemaName, '0'],
    );
    const schemaId = result.rows[0].id;
    log.info(`Schema ${schemaName} created`);
    await client.query('COMMIT');
    return schemaId;
  } catch (err) {
    log.warn(`Failed to create new schema! ${err}`);
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// Retrieve an available client from the connection pool
async function getClient(pool) {
  const client = await pool.connect().catch((err) => {
    log.error(`${dbName} connection failed: ${err}`);
    throw err;
  });

  log.info(`${dbName} connection established`);
  return client;
}

// Load profile data into the new schema
async function loadProfile(
  profile,
  pool,
  schemaName,
  s3Config,
  retryCount = 0,
) {
  const profileEtl = getProfileEtl(profile, s3Config);
  const client = await getClient(pool);
  try {
    await profileEtl(client, schemaName);
    log.info(`ETL success for table ${profile.tableName}`);
  } catch (err) {
    if (retryCount < s3Config.config.retryLimit) {
      log.info(`Retrying ETL for table ${profile.tableName}: ${err}`);
      await setTimeout(s3Config.config.retryIntervalSeconds * 1000);
      return await loadProfile(
        profile,
        pool,
        schemaName,
        s3Config,
        retryCount + 1,
      );
    } else {
      log.warn(`ETL failed for table ${profile.tableName}: ${err}`);
      throw err;
    }
  } finally {
    client.release();
  }
}

async function logEtlLoadError(pool, etlLogId, loadError) {
  try {
    await pool.query(
      'UPDATE logging.etl_log SET end_time = current_timestamp, load_error = $1 WHERE id = $2',
      [loadError, etlLogId],
    );
    log.info('ETL process error logged');
  } catch (err) {
    log.warn(`Failed to log ETL process error: ${err}`);
  }
}

async function logEtlLoadEnd(pool, etlLogId) {
  try {
    await pool.query(
      'UPDATE logging.etl_log SET end_time = current_timestamp WHERE id = $1',
      [etlLogId],
    );
    log.info('ETL process end logged');
  } catch (err) {
    log.warn(`Failed to log ETL process end: ${err}`);
  }
}

async function logEtlLoadStart(pool) {
  try {
    const result = await pool.query(
      'INSERT INTO logging.etl_log (start_time)' +
        ' VALUES (current_timestamp) RETURNING id',
    );
    log.info('ETL process start logged');
    return result.rows[0].id;
  } catch (err) {
    log.warn(`Failed to log ETL process start: ${err}`);
  }
}

export async function updateEtlStatus(pool, columnName, value) {
  try {
    await pool.query(`UPDATE logging.etl_status SET ${columnName} = $1`, [
      value,
    ]);
    log.info(`ETL ${columnName} status updated to ${value}`);
  } catch (err) {
    log.warn(`Failed to update ETL status: ${err}`);
  }
}

// Load new data into a fresh schema, then discard old schemas
export async function runJob(s3Config) {
  const pool = startConnPool();
  updateEtlStatus(pool, 'database', 'running');
  try {
    await runLoad(pool, s3Config);
    await trimSchema(pool, s3Config);
    await trimNationalDownloads(pool);
    await updateEtlStatus(pool, 'database', 'success');
  } catch (err) {
    log.warn(`Run failed, continuing to schedule cron task: ${err}`);
    await updateEtlStatus(pool, 'database', 'failed');
  } finally {
    await endConnPool(pool);
  }
}

export async function getActiveSchema(pool) {
  const schemas = await pool
    .query(
      'SELECT schema_name FROM logging.etl_schemas WHERE active = true ORDER BY creation_date DESC',
    )
    .catch((err) => {
      log.warn(`Could not query schemas: ${err}`);
    });

  if (!schemas?.rowCount) return null;

  return schemas.rows[0].schema_name;
}

export async function runLoad(pool, s3Config) {
  log.info('Running ETL process!');

  const logId = await logEtlLoadStart(pool);

  const now = new Date();
  const schemaName = `schema_${now.valueOf()}`;

  const lastSchemaName = await getActiveSchema(pool);

  try {
    const schemaId = await createNewSchema(pool, schemaName);

    // Add tables to schema and import new data
    const loadTasks = Object.values(profiles).map((profile) => {
      return loadProfile(profile, pool, schemaName, s3Config);
    });
    await Promise.all(loadTasks);

    await transferSchema(pool, schemaName, schemaId);

    await streamNationalDownloads(pool, schemaName);

    await archiveNationalDownloads(lastSchemaName);

    log.info('Tables updated');
    await logEtlLoadEnd(pool, logId);
  } catch (err) {
    log.warn(`ETL process failed! ${err}`);
    await logEtlLoadError(pool, logId, err);
    throw err;
  }
}

// Grant usage privileges on the new schema to the read-only user
async function transferSchema(pool, schemaName, schemaId) {
  const client = await getClient(pool);
  try {
    await client.query('BEGIN');

    // Give eq user USAGE privilege for schema
    await client.query(`GRANT USAGE ON SCHEMA ${schemaName} TO ${eqUser}`);
    await client.query(
      `GRANT SELECT ON ALL TABLES IN SCHEMA ${schemaName} TO ${eqUser}`,
    );

    // Mark new schema as active, and set to eq's path
    await client.query('UPDATE logging.etl_schemas SET active = $1', ['0']);
    await client.query(
      'UPDATE logging.etl_schemas SET active = $1 WHERE id = $2',
      ['1', schemaId],
    );

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// Drop old schemas
export async function trimSchema(pool, s3Config) {
  const schemaRetentionDays = s3Config.config.schemaRetentionDays;

  const schemas = await pool
    .query(
      'SELECT extract(epoch from creation_date) as date, schema_name FROM logging.etl_schemas',
    )
    .catch((err) => {
      log.warn(`Could not query schemas: ${err}`);
    });

  if (!schemas?.rowCount) return;

  const client = await getClient(pool);
  try {
    const msInDay = 86400000;
    for (const index in schemas.rows) {
      const schema = schemas.rows[index];
      if (
        Date.now() - parseFloat(schema.date) * 1000 >
        schemaRetentionDays * msInDay
      ) {
        try {
          log.info(`Dropping obsolete schema ${schema.schema_name}`);
          await client.query('BEGIN');
          await client.query(`DROP SCHEMA ${schema.schema_name} CASCADE`);
          await client.query(
            `DELETE FROM ONLY logging.etl_schemas WHERE schema_name = '${schema.schema_name}'`,
          );
          await client.query('COMMIT');
        } catch (err) {
          log.warn(`Error dropping obsolete schema: ${err}`);
          await client.query('ROLLBACK');
        }
      }
    }
  } catch (err) {
    log.warn(`Error dropping obsolete schemas: ${err}`);
  } finally {
    client.release();
  }
}

// Drop old national-downloads folders
export async function trimNationalDownloads(pool) {
  // get list of currently stored schemas
  const schemas = await pool
    .query('SELECT schema_name FROM logging.etl_schemas')
    .catch((err) => {
      log.warn(`Could not query schemas: ${err}`);
    });
  if (!schemas?.rowCount) return;

  // build a list of directories (schemas) to leave on S3
  const dirsToIgnore = schemas.rows.map((schema) => {
    return schema.schema_name.replace('schema_', '');
  });
  dirsToIgnore.push('latest');

  deleteDirectory({
    directory: 'national-downloads',
    dirsToIgnore,
  });
}

// Get the ETL task for a particular profile
function getProfileEtl(
  { createQuery, extract, maxChunksOverride, tableName, transform },
  s3Config,
) {
  return async function (client, schemaName) {
    // Create the table for the profile
    try {
      await client.query(`SET search_path TO ${schemaName}`);

      await client.query(`DROP TABLE IF EXISTS ${tableName}`);
      await client.query(createQuery);
      log.info(`Table ${tableName} created`);
    } catch (err) {
      log.warn(`Failed to create table ${tableName}: ${err}`);
      throw err;
    }

    // Extract, transform, and load the new data
    try {
      log.info(`Setting ${tableName} to unlogged`);
      await client.query(`ALTER TABLE ${tableName} SET UNLOGGED`);
      let res = await extract(s3Config);
      let chunksProcessed = 0;
      const maxChunks = maxChunksOverride ?? process.env.MAX_CHUNKS;
      while (res.data !== null && (!maxChunks || chunksProcessed < maxChunks)) {
        const query = await transform(res.data, chunksProcessed === 0);
        await client.query(query);
        log.info(`Next record offset for table ${tableName}: ${res.next}`);
        res = await extract(s3Config, res.next);
        chunksProcessed += 1;
      }
    } catch (err) {
      log.warn(`Failed to load table ${tableName}! ${err}`);
      throw err;
    } finally {
      log.info(`Setting ${tableName} back to logged`);
      await client.query(`ALTER TABLE ${tableName} SET LOGGED`);
    }

    log.info(`Table ${tableName} load success`);
  };
}

async function finishNationalUploads(pipeline) {
  // close zip streams
  pipeline.json.zipStream.write(']');
  pipeline.json.zipStream.end();
  pipeline.csv.zipStream.end();
  pipeline.tsv.zipStream.end();
  pipeline.xlsx.workbook.commit();

  // await file streams
  await Promise.all([
    pipeline.json.fileStream,
    pipeline.csv.fileStream,
    pipeline.tsv.fileStream,
    pipeline.xlsx.fileStream,
  ]);
}

async function streamNationalDownloadSingleProfile(
  pool,
  activeSchema,
  profile,
) {
  // output types csv, tab-separated, Excel, or JSON
  try {
    const tableName = profile.tableName;

    const selectText = profile.columns
      .map((col) =>
        col.name === col.alias ? col.name : `${col.name} AS ${col.alias}`,
      )
      .join(', ');

    // build the db query stream
    const query = new QueryStream(
      `SELECT ${selectText} FROM ${activeSchema}.${tableName}`,
      null,
      {
        batchSize: parseInt(process.env.STREAM_BATCH_SIZE),
        highWaterMark: parseInt(process.env.STREAM_HIGH_WATER_MARK),
      },
    );
    const client = await pool.connect();
    const stream = client.query(query);

    // create zip streams
    const outputJson = zlib.createGzip();
    const outputCsv = zlib.createGzip();
    const outputTsv = zlib.createGzip();
    const outputXlsx = zlib.createGzip();

    const isLocal = environment.isLocal;

    // create output streams
    let writeStreamJson, writeStreamCsv, writeStreamTsv, writeStreamXlsx;
    if (isLocal) {
      const __dirname = path.dirname(fileURLToPath(import.meta.url));
      const subFolderPath = resolve(
        __dirname,
        `../../../app/server/app/content-etl/national-downloads/new`,
      );

      // create the sub folder if it doesn't already exist
      mkdirSync(subFolderPath, { recursive: true });

      writeStreamJson = createWriteStream(
        `${subFolderPath}/${tableName}.json.gz`,
      );
      writeStreamCsv = createWriteStream(
        `${subFolderPath}/${tableName}.csv.gz`,
      );
      writeStreamTsv = createWriteStream(
        `${subFolderPath}/${tableName}.tsv.gz`,
      );
      writeStreamXlsx = createWriteStream(
        `${subFolderPath}/${tableName}.xlsx.gz`,
      );

      outputJson.pipe(writeStreamJson);
      outputCsv.pipe(writeStreamCsv);
      outputTsv.pipe(writeStreamTsv);
      outputXlsx.pipe(writeStreamXlsx);
    } else {
      writeStreamJson = createS3Stream({
        contentType: 'application/gzip',
        filePath: `national-downloads/new/${tableName}.json.gz`,
        stream: outputJson,
      });

      writeStreamCsv = createS3Stream({
        contentType: 'application/gzip',
        filePath: `national-downloads/new/${tableName}.csv.gz`,
        stream: outputCsv,
      });

      writeStreamTsv = createS3Stream({
        contentType: 'application/gzip',
        filePath: `national-downloads/new/${tableName}.tsv.gz`,
        stream: outputTsv,
      });

      writeStreamXlsx = createS3Stream({
        contentType: 'application/gzip',
        filePath: `national-downloads/new/${tableName}.xlsx.gz`,
        stream: outputXlsx,
      });
    }

    // create workbook
    const workbook = new Excel.stream.xlsx.WorkbookWriter({
      stream: outputXlsx,
      useStyles: true,
    });

    const worksheet = workbook.addWorksheet('data');

    // start streaming/transforming the data into the S3 bucket
    StreamingService.streamResponse(outputCsv, stream, 'csv');
    StreamingService.streamResponse(outputTsv, stream, 'tsv');
    StreamingService.streamResponse(outputJson, stream, 'json');
    StreamingService.streamResponse(outputXlsx, stream, 'xlsx', {
      workbook,
      worksheet,
    });

    // get the promises for verifying the streaming operation is complete
    const csvPromise = !isLocal
      ? writeStreamCsv
      : new Promise((resolve, reject) => {
          outputCsv.on('end', () => {
            log.info(
              `Finished building national download for ${tableName}.csv.gz`,
            );
            resolve();
          });
          outputCsv.on('error', reject);
        });
    const tsvPromise = !isLocal
      ? writeStreamTsv
      : new Promise((resolve, reject) => {
          outputTsv.on('end', () => {
            log.info(
              `Finished building national download for ${tableName}.tsv.gz`,
            );
            resolve();
          });
          outputTsv.on('error', reject);
        });
    const jsonPromise = !isLocal
      ? writeStreamJson
      : new Promise((resolve, reject) => {
          outputJson.on('end', () => {
            log.info(
              `Finished building national download for ${tableName}.json.gz`,
            );
            resolve();
          });
          outputJson.on('error', reject);
        });
    const xlsxPromise = !isLocal
      ? writeStreamXlsx
      : new Promise((resolve, reject) => {
          outputXlsx.on('end', () => {
            log.info(
              `Finished building national download for ${tableName}.xlsx.gz`,
            );
            resolve();
          });
          outputXlsx.on('error', reject);
        });

    // return a promise for all of the streams and the db connection client,
    // so we can close the connection later
    return {
      promise: Promise.all([csvPromise, tsvPromise, jsonPromise, xlsxPromise]),
      client,
    };
  } catch (error) {
    log.error(
      `Failed to build national download from the "${profile.tableName}" table...`,
      error,
    );
  }
}

export async function streamNationalDownloads(pool, activeSchema) {
  // Increases the listeners to handle streaming all of the data
  process.setMaxListeners(0);

  const tables = Object.values(mapping);

  // fire off the streams and keep track of the db connection clients
  const promises = [];
  const clients = [];
  for (const table of tables) {
    const { promise, client } = await streamNationalDownloadSingleProfile(
      pool,
      activeSchema,
      table,
    );
    promises.push(promise);
    clients.push(client);
  }

  // close all of the db connections
  clients.forEach((client) => client.release());

  return Promise.all(promises);
}
