import pg from 'pg';
import { setTimeout } from 'timers/promises';
import { getEnvironment } from './utilities/environment.js';
import { logger as log } from './utilities/logger.js';
import * as profiles from './profiles/index.js';
import { copyDirectory, deleteDirectory } from './s3.js';

const { Client, Pool } = pg;

const environment = getEnvironment();

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

async function getActiveSchema(pool) {
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

async function archiveNationalDownloads(pool, schemaName) {
  const subFolder = schemaName.replace('schema_', '');

  log.info(`Start copying "latest" to "${subFolder}"`);
  await copyDirectory({
    contentType: 'application/gzip',
    source: 'national-downloads/latest',
    destination: `national-downloads/${subFolder}`,
  });
  log.info(`Finished copying "latest" to "${subFolder}"`);

  log.info('Start copying "new" to "latest"');
  await copyDirectory({
    contentType: 'application/gzip',
    source: 'national-downloads/new',
    destination: `national-downloads/latest`,
  });
  log.info('Finished copying "new" to "latest"');
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

    await archiveNationalDownloads(pool, lastSchemaName);

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
  {
    createQuery,
    createPipeline,
    extract,
    maxChunksOverride,
    tableName,
    transform,
  },
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
      const pipeline = createPipeline();
      let chunksProcessed = 0;
      const maxChunks = maxChunksOverride ?? process.env.MAX_CHUNKS;
      while (res.data !== null && (!maxChunks || chunksProcessed < maxChunks)) {
        const query = await transform(
          res.data,
          pipeline,
          chunksProcessed === 0,
        );
        await client.query(query);
        log.info(`Next record offset for table ${tableName}: ${res.next}`);
        res = await extract(s3Config, res.next);
        chunksProcessed += 1;
      }
      await finishNationalUploads(pipeline);
      log.info(`National uploads for table ${tableName} uploaded`);
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
