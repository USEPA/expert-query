import pg from 'pg';

import { logger as log } from './utilities/logger.js';
import * as create from './queries/create.js';

const { Pool } = pg;

const dbName = 'expert_query';

const eqUser = process.env.EQ_USERNAME ?? 'eq';

const pgConfig = {
  user: process.env.PG_USERNAME,
  password: process.env.PG_PASSWORD,
  database: 'postgres',
  port: process.env.PG_PORT,
  host: process.env.PG_HOST,
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
      'The experty_query connection information has not been properly set',
    );
    process.exit();
  }

  try {
    try {
      // Create the expert_query db and ignore any errors, i.e. the db already exists
      await client.query('CREATE DATABASE ' + dbName);
      log.info(`${dbName} database created!`);
    } catch (err) {
      log.info(`Warning: ${dbName} database! ${err}`);
    }

    try {
      // Create the eq user and ignore any errors, i.e. the eq user already exists
      await client.query(
        `CREATE USER ${eqUser} WITH PASSWORD '${process.env.EQ_PASSWORD}'`,
      );
      log.info(`${eqUser} user created!`);
    } catch (err) {
      log.info(`Warning: ${eqUser} user! ${err}`);
    }

    return true;
  } catch (err) {
    throw new Error(`Failed to create ${dbName} database! ${err}`);
  } finally {
    client.release();
  }
}

async function logEtlLoadStart() {
  try {
    await eqPool.query(
      'INSERT INTO logging.etl_log (start_time)' +
        ' VALUES (current_timestamp)',
    );
  } catch (err) {
    log.warn(`Failed to log ETL process start: ${err}`);
  }
}

export async function runLoad() {
  log.info('Running ETL process!');

  const client = await eqPool.connect().catch((err) => {
    log.error(`${dbName} connection failed: ${err}`);
    throw err;
  });

  log.info(`${dbName} connection established`);

  try {
    // Create new schema & set to path
    const now = new Date();
    const schemaName = `schema_${now.valueOf()}`;
    await client.query('BEGIN');
    await client.query(`CREATE SCHEMA IF NOT EXISTS ${schemaName}`);
    await client.query(`SET search_path TO ${schemaName}`);

    // Add new schema to control table
    await client.query(
      'INSERT INTO logging.etl_schemas' +
        ' (schema_name, creation_date)' +
        ' VALUES ($1, current_timestamp)',
      [schemaName],
    );

    // Add tables to schema
    await client.query(create.profileTest);

    // Import new data
    logEtlLoadStart();

    // Give eq user USAGE privilege for schema, and set to eq's path
    await client.query(`GRANT USAGE ON SCHEMA ${schemaName} TO ${eqUser}`);
    await client.query(
      `GRANT SELECT ON ALL TABLES IN SCHEMA ${schemaName} TO ${eqUser}`,
    );
    await client.query(`ALTER ROLE ALL SET search_path = "${schemaName}"`);

    await client.query('COMMIT');
    log.info('Tables updated');
  } catch (err) {
    log.warn('Failed to confirm that logging tables exist');
    await client.query('ROLLBACK');
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
    // if (Date.now() - parseInt(schema.date) * 1000 > 5 * msInDay) {
    if (Date.now() - parseInt(schema.date) * 1000 > 1 * msInDay) {
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
