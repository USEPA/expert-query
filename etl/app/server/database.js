import pg from 'pg';

import { logger as log } from './utilities/logger.js';
import * as create from './queries/create.js';

const { Pool } = pg;

let isLocal = false;
let isDevelopment = false;
let isStaging = false;

let database_host = '';
let database_user = '';
let database_pwd = '';
let database_port = '';

if (process.env.NODE_ENV) {
  isLocal = 'local' === process.env.NODE_ENV.toLowerCase();
  isDevelopment = 'development' === process.env.NODE_ENV.toLowerCase();
  isStaging = 'staging' === process.env.NODE_ENV.toLowerCase();
}

const dbName = process.env.DB_NAME ?? 'expert_query';

const eqUser = process.env.EQ_USERNAME ?? 'eq';

if (isLocal) {
  log.info('Since local, using a localhost Postgres database.');
  database_host = process.env.DB_HOST;
  database_user = process.env.DB_USERNAME;
  database_pwd = process.env.DB_PASSWORD;
  database_port = process.env.DB_PORT;
} else {
  if (process.env.VCAP_SERVICES) {
    log.info('Using VCAP_SERVICES Information to connect to Postgres.');
    let vcap_services = JSON.parse(process.env.VCAP_SERVICES);
    database_host = vcap_services['aws-rds'][0].credentials.host;
    database_user = vcap_services['aws-rds'][0].credentials.username;
    database_pwd = vcap_services['aws-rds'][0].credentials.password;
    database_port = vcap_services['aws-rds'][0].credentials.port;
    log.info(database_host);
    log.info(database_user);
    log.info(database_port);
  } else {
    log.error(
      'VCAP_SERVICES Information not found. Connection will not be attempted.',
    );
  }
}

const pgConfig = {
  user: database_user,
  password: database_pwd,
  database: 'postgres',
  port: database_port,
  host: database_host,
};
const pgPool = new Pool(pgConfig);

const eqConfig = {
  ...pgConfig,
  database: dbName,
};
const eqPool = new Pool(eqConfig);

export async function checkLogTables() {
  const client = await eqPool.connect().catch((err) => {
    log.error(`${dbName} connection failed: ${err}`);
    throw err;
  });

  log.info(`${dbName} connection established`);

  // Ensure the log tables exist; if not, create them
  try {
    await client.query('BEGIN');
    await client.query('CREATE SCHEMA IF NOT EXISTS logging');
    await client.query(create.etlLog);
    await client.query(create.etlSchemas);
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
    client.release();
  }
}

export async function connectPostgres() {
  if (pgConfig.user === '') {
    throw new Error('Database information not set!');
  } else {
    log.info('Connecting to postgres: ' + pgConfig.host + ':' + pgConfig.port);
    const client = await pgPool.connect();
    return client;
  }
}

export async function createEqDb(client) {
  if (process.env.EQ_PASSWORD === null) {
    log.error(
      'The expert_query connection information has not been properly set',
    );
    process.exit();
  }

  // Check if the database has already been created
  const db = await eqPool
    .query('SELECT datname FROM pg_database WHERE datname = $1', [dbName])
    .catch((err) => log.warn(`Could not query databases: ${err}`));

  if (!db) {
    try {
      // Create the expert_query db
      await client.query('CREATE DATABASE ' + dbName);
      log.info(`${dbName} database created!`);
    } catch (err) {
      log.info(`Warning: ${dbName} database! ${err}`);
    }
  }

  // Check if the user has already been created
  const user = await eqPool
    .query('SELECT usename FROM pg_user WHERE usename = $1', [eqUser])
    .catch((err) => log.warn(`Could not query users: ${err}`));

  if (!user) {
    try {
      // Create the eq user
      await client.query(
        `CREATE USER ${eqUser} WITH PASSWORD '${process.env.EQ_PASSWORD}'`,
      );
      log.info(`${eqUser} user created!`);
    } catch (err) {
      log.info(`Warning: ${eqUser} user! ${err}`);
    }
  }

  client.release();
  return true;
}

async function logEtlLoadError(etlLogId, loadError) {
  try {
    await eqPool.query(
      'UPDATE logging.etl_log SET load_error = $1 WHERE id = $2',
      [loadError, etlLogId],
    );
    log.info('ETL process error logged');
  } catch (err) {
    log.warn(`Failed to log ETL process error: ${err}`);
  }
}

async function logEtlLoadEnd(etlLogId) {
  try {
    await eqPool.query(
      'UPDATE logging.etl_log SET end_time = current_timestamp WHERE id = $1',
      [etlLogId],
    );
    log.info('ETL process end logged');
  } catch (err) {
    log.warn(`Failed to log ETL process end: ${err}`);
  }
}

async function logEtlLoadStart() {
  try {
    const result = await eqPool.query(
      'INSERT INTO logging.etl_log (start_time)' +
        ' VALUES (current_timestamp) RETURNING id',
    );
    log.info('ETL process start logged');
    return result.rows[0].id;
  } catch (err) {
    log.warn(`Failed to log ETL process start: ${err}`);
  }
}

// TEST
let currentName = 1;

export async function runLoad() {
  log.info('Running ETL process!');

  const client = await eqPool.connect().catch((err) => {
    log.error(`${dbName} connection failed: ${err}`);
    throw err;
  });

  log.info(`${dbName} connection established`);

  const logId = await logEtlLoadStart();
  try {
    // Create new schema & set to path
    const now = new Date();
    const schemaName = `schema_${now.valueOf()}`;
    await client.query('BEGIN');
    await client.query(`CREATE SCHEMA IF NOT EXISTS ${schemaName}`);
    await client.query(`SET search_path TO ${schemaName}`);

    // Add new schema to control table
    const result = await client.query(
      'INSERT INTO logging.etl_schemas' +
        ' (schema_name, creation_date, active)' +
        ' VALUES ($1, current_timestamp, $2) RETURNING id',
      [schemaName, '0'],
    );
    const schemaId = result.rows[0].id;

    // Add tables to schema
    // TEST
    await client.query(create.profileTest);

    // Import new data
    // TEST
    await client.query(
      'INSERT INTO profile_test (assessment_name) VALUES ($1)',
      [currentName],
    );
    currentName += 1;

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
    log.info('Tables updated');
    logEtlLoadEnd(logId);
  } catch (err) {
    log.warn(`ETL process failed! ${err}`);
    await client.query('ROLLBACK');
    logEtlLoadError(logId, err);
    throw err;
  } finally {
    client.release();
  }
}

// Drop old schemas
export async function trimSchema() {
  const schemas = await eqPool
    .query(
      'SELECT extract(epoch from creation_date) as date, schema_name FROM logging.etl_schemas',
    )
    .catch((err) => {
      log.warn(`Could not query schemas: ${err}`);
    });

  if (!schemas) return;

  const msInDay = 86400000;
  schemas.rows.forEach(async (schema) => {
    if (Date.now() - parseInt(schema.date) * 1000 > 5 * msInDay) {
      try {
        await eqPool.query(`DROP SCHEMA ${schema.schema_name} CASCADE`);
        eqPool.query(
          `DELETE FROM ONLY logging.etl_schemas WHERE schema_name = '${schema.schema_name}'`,
        );
      } catch (err) {
        log.warn(`Error dropping obsolete schema: ${err}`);
      }
    }
  });
}
