import pg from 'pg';

import { logger as log } from './utilities/logger.js';
import * as profiles from './profiles/index.js';

const { Client, Pool } = pg;

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

const requiredEnvVars = ['EQ_PASSWORD'];

if (isLocal) {
  requiredEnvVars.push('DB_USERNAME', 'DB_PASSWORD', 'DB_PORT', 'DB_HOST');
} else {
  requiredEnvVars.push('VCAP_SERVICES');
}

requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    const message =
      envVar === 'VCAP_SERVICES'
        ? 'VCAP_SERVICES Information not found. Connection will not be attempted.'
        : `Required environment variable ${envVar} not found.`;
    log.error(message);
    process.exit();
  }
});

const dbName = process.env.DB_NAME ?? 'expert_query';

const eqUser = process.env.EQ_USERNAME ?? 'eq';

if (isLocal) {
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
};

function startConnPool() {
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
          end_time timestamp,
          load_error varchar,
          start_time timestamp NOT NULL
        )`,
    );
    await client.query(
      `CREATE TABLE IF NOT EXISTS logging.etl_schemas
        (
          id SERIAL PRIMARY KEY,
          active BOOLEAN NOT NULL,
          creation_date TIMESTAMP WITHOUT TIME ZONE NOT NULL,
          schema_name varchar(20) NOT NULL
        )`,
    );
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
async function loadProfile(profile, pool, schemaName) {
  const profileEtl = getProfileEtl(profile);
  const client = await getClient(pool);
  try {
    await profileEtl(client, schemaName);
    console.info(`ETL success for table ${profile.tableName}`);
  } catch (err) {
    console.warn(`ETL failed for table ${profile.tableName}: ${err}`);
    throw err;
  } finally {
    client.release();
  }
}

async function logEtlLoadError(pool, etlLogId, loadError) {
  try {
    await pool.query(
      'UPDATE logging.etl_log SET load_error = $1 WHERE id = $2',
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

// Load new data into a fresh schema, then discard old schemas
export async function runJob(first = false) {
  const pool = startConnPool();
  try {
    await runLoad(pool);
    await trimSchema(pool);
  } catch (err) {
    log.warn(
      `${
        first ? 'First run' : 'Run'
      } failed, continuing to schedule cron task: ${err}`,
    );
  } finally {
    await endConnPool(pool);
  }
}

export async function runLoad(pool) {
  log.info('Running ETL process!');

  const logId = await logEtlLoadStart(pool);

  const now = new Date();
  const schemaName = `schema_${now.valueOf()}`;

  try {
    const schemaId = await createNewSchema(pool, schemaName);

    // Add tables to schema and import new data
    const loadTasks = Object.values(profiles).map((profile) => {
      return loadProfile(profile, pool, schemaName);
    });
    await Promise.all(loadTasks);

    await transferSchema(pool, schemaName, schemaId);

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
export async function trimSchema(pool) {
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
      if (Date.now() - parseFloat(schema.date) * 1000 > 5 * msInDay) {
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

// Get the ETL task for a particular profile
function getProfileEtl({
  createQuery,
  extract,
  insertQuery,
  tableName,
  transform,
}) {
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
      await client.query('BEGIN');

      let res = await extract();
      while (res.data !== null) {
        const rows = transform(res.data);
        const inserts = rows.map(async (row) => {
          await client.query(insertQuery, row);
        });
        await Promise.all(inserts);

        log.info(`Next record offset for table ${tableName}: ${res.next}`);
        res = await extract(res.next);
      }

      await client.query('COMMIT');
      log.info(`Table ${tableName} load success`);
    } catch (err) {
      log.warn(`Failed to load table ${tableName}! ${err}`);
      await client.query('ROLLBACK');
      throw err;
    }
  };
}
