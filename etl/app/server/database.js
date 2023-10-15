import crypto from 'crypto';
import https from 'https';
import pg from 'pg';
import pgPromise from 'pg-promise';
import { setTimeout } from 'timers/promises';
// utils
import { fetchRetry, getEnvironment } from './utilities/index.js';
import { log } from './utilities/logger.js';
import { deleteDirectory, readS3File, syncDomainValues } from './s3.js';

const { Client, Pool } = pg;
const pgp = pgPromise({ capSQL: true });

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

function extractProfileName(name) {
  return name
    .replace('attains_app.profile_', '')
    .replace('profile_', '')
    .replace('.csv', '');
}

async function cacheProfileStats(pool, schemaName, profileStats, s3Stats) {
  const client = await getClient(pool);
  try {
    await client.query('BEGIN');
    for (const profile of profileStats.details) {
      const profileName = extractProfileName(profile.name);

      // lookup the file size from s3Stats
      const s3Metadata = s3Stats.files.find(
        (f) => extractProfileName(f.name) === profileName,
      );

      await client.query(
        'INSERT INTO logging.mv_profile_stats(profile_name, schema_name, num_rows, last_refresh_end_time, last_refresh_elapsed, csv_size, gz_size, zip_size, creation_date)' +
          ' VALUES ($1, $2, $3, $4, $5, $6, $7, $8, current_timestamp)',
        [
          profileName,
          schemaName,
          profile.num_rows,
          profile.last_refresh_end_time,
          profile.last_refresh_elapsed,
          s3Metadata.csv_size,
          s3Metadata.gz_size,
          s3Metadata.zip_size,
        ],
      );
    }
    await client.query('COMMIT');
    log.info(`Profile stats cached`);
  } catch (err) {
    await client.query('ROLLBACK');
    log.warn(`Failed to cache profile stats: ${err}`);
  } finally {
    client.release();
  }
}

export async function checkLogTables() {
  const client = await connectClient(eqConfig);

  // Ensure the log tables exist; if not, create them
  try {
    await client.query('BEGIN');

    if (!environment.isLocal) {
      // create aws_s3 extension, used for pulling in data from S3
      await client.query(
        'CREATE EXTENSION IF NOT EXISTS aws_s3 WITH SCHEMA pg_catalog CASCADE',
      );
    }

    await client.query('CREATE SCHEMA IF NOT EXISTS logging');
    await client.query(
      `CREATE TABLE IF NOT EXISTS logging.etl_log
        (
          id SERIAL PRIMARY KEY,
          schema_id INTEGER,
          end_time TIMESTAMP,
          load_error VARCHAR,
          start_time TIMESTAMP,
          s3_julian VARCHAR(20),
          extract_error VARCHAR
        )`,
    );
    await client.query(
      `CREATE TABLE IF NOT EXISTS logging.etl_schemas
        (
          id SERIAL PRIMARY KEY,
          active BOOLEAN NOT NULL,
          creation_date TIMESTAMP WITHOUT TIME ZONE NOT NULL,
          schema_name VARCHAR(20) NOT NULL,
          s3_julian VARCHAR(20)
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

    // create mv_profile_stats table
    await client.query(
      `CREATE TABLE IF NOT EXISTS logging.mv_profile_stats
        (
          profile_name VARCHAR(40) NOT NULL,
          schema_name VARCHAR(20) NOT NULL,
          num_rows INTEGER NOT NULL,
          last_refresh_end_time TIMESTAMP WITH TIME ZONE NOT NULL,
          last_refresh_elapsed VARCHAR(20) NOT NULL,
          csv_size BIGINT,
          gz_size BIGINT,
          zip_size BIGINT,
          creation_date TIMESTAMP WITHOUT TIME ZONE NOT NULL,
          PRIMARY KEY (profile_name, schema_name)
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
            await logEtlLoadError(
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
async function createNewSchema(pool, schemaName, s3Julian, etlLogId) {
  const client = await getClient(pool);
  try {
    // Create new schema
    await client.query('BEGIN');
    await client.query(`CREATE SCHEMA IF NOT EXISTS ${schemaName}`);

    // Add new schema to control table
    const result = await client.query(
      'INSERT INTO logging.etl_schemas' +
        ' (schema_name, creation_date, active, s3_julian)' +
        ' VALUES ($1, current_timestamp, $2, $3) RETURNING id',
      [schemaName, '0', s3Julian],
    );
    const schemaId = result.rows[0].id;

    await client.query(
      'UPDATE logging.etl_log SET schema_id = $1 WHERE id = $2',
      [schemaId, etlLogId],
    );

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
  s3Julian,
  retryCount = 0,
) {
  const profileEtl = getProfileEtl(profile, s3Config, s3Julian);
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
        s3Julian,
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

async function logEtlExtractError(pool, etlLogId, extractError) {
  try {
    await pool.query(
      'UPDATE logging.etl_log SET extract_error = $1 WHERE id = $2',
      [JSON.stringify(extractError), etlLogId],
    );
    log.info('ETL extract errors logged');
  } catch (err) {
    log.warn(`Failed to log ETL extract errors: ${err}`);
  }
}

async function logEtlExtractStart(pool, s3Julian) {
  try {
    const result = await pool.query(
      'INSERT INTO logging.etl_log (s3_julian) VALUES ($1) RETURNING id',
      [s3Julian],
    );
    log.info('ETL extract start logged');
    return result.rows[0].id;
  } catch (err) {
    log.warn(`Failed to log ETL extract start: ${err}`);
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

async function logEtlLoadStart(pool, etlLogId) {
  try {
    await pool.query(
      'UPDATE logging.etl_log SET start_time = current_timestamp WHERE id = $1',
      [etlLogId],
    );
    log.info('ETL process start logged');
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
export async function runJob(s3Config, ignoreReady = false) {
  const pool = startConnPool();

  // check if the MV data is available in s3 and ready to be loaded
  const readyResult = await isDataReady(pool);
  const s3Julian = readyResult.julian;
  log.info(`Are MVs ready: ${readyResult.ready} | Julian ${s3Julian}`);

  // exit early if we aren't ready to run etl
  if (
    !s3Julian ||
    (!environment.isLocal && !readyResult.ready && !ignoreReady)
  ) {
    await endConnPool(pool);
    return;
  }

  await updateEtlStatus(pool, 'database', 'running');
  try {
    await runLoad(pool, s3Config, s3Julian, readyResult.logId);
    await trimSchema(pool, s3Config);
    if (!environment.isLocal) await trimNationalDownloads(pool);
    await updateEtlStatus(pool, 'database', 'success');
    await syncDomainValues(s3Config, pool);
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

async function fetchStateValues(s3Config, retryCount = 0) {
  const res = await fetchRetry({
    url: s3Config.services.stateCodes,
    s3Config,
    serviceName: 'States',
    callOptions: {
      timeout: s3Config.config.webServiceTimeout,
    },
  });

  return res.data.data;
}

async function loadStatesTable(pool, s3Config, schemaName) {
  const client = await pool.connect();
  try {
    const uniqueCodes = new Set();
    const states = (await fetchStateValues(s3Config)).filter((state) => {
      return uniqueCodes.has(state.code) ? false : uniqueCodes.add(state.code);
    });

    await client.query('BEGIN');
    await client.query(`SET search_path TO ${schemaName}`);
    await client.query('DROP TABLE IF EXISTS states');
    await client.query(
      `CREATE TABLE states
        (
          id SERIAL PRIMARY KEY,
          statecode VARCHAR(2),
          statename VARCHAR(100)
        )`,
    );
    for (const state of states) {
      await client.query(
        'INSERT INTO states(statecode, statename) VALUES ($1, $2)',
        [state.code, state.name],
      );
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    log.warn(`Failed to load states table: ${err}`);
    throw err;
  } finally {
    client.release();
  }
}

async function loadUtilityTables(pool, s3Config, schemaName) {
  await loadStatesTable(pool, s3Config, schemaName);
  log.info('Utility tables finished updating');
}

export async function runLoad(pool, s3Config, s3Julian, logId) {
  log.info('Running ETL process!');

  await logEtlLoadStart(pool, logId);

  const now = new Date();
  const schemaName = `schema_${now.valueOf()}`;

  try {
    const schemaId = await createNewSchema(pool, schemaName, s3Julian, logId);

    // Load tables first that will be used when creating profile materialized views
    await loadUtilityTables(pool, s3Config, schemaName);

    // Add tables to schema and import new data
    const loadTasks = Object.values(s3Config.tableConfig).map((profile) => {
      return loadProfile(profile, pool, schemaName, s3Config, s3Julian);
    });
    await Promise.all(loadTasks);

    const profileStats = await getProfileStats(pool, schemaName, s3Julian);

    // Verify the etl was successfull and the data matches what we expect.
    // We skip this when running locally, since the row counts will never match.
    if (!environment.isLocal) {
      await certifyEtlComplete(pool, profileStats, schemaId, schemaName);
    }

    await transferSchema(pool, schemaName, schemaId);

    log.info('Tables updated');
    await logEtlLoadEnd(pool, logId);
  } catch (err) {
    log.warn(`ETL process failed! ${err}`);
    await logEtlLoadError(pool, logId, err);
    throw err;
  }
}

async function getProfileStats(pool, schemaName, s3Julian) {
  // get profile stats from s3
  const profileStats = await readS3File({
    bucketInfo: {
      accessKeyId: process.env.CF_S3_PUB_ACCESS_KEY,
      bucketId: process.env.CF_S3_PUB_BUCKET_ID,
      region: process.env.CF_S3_PUB_REGION,
      secretAccessKey: process.env.CF_S3_PUB_SECRET_KEY,
    },
    path: `national-downloads/${s3Julian}/ready.json`,
  });

  // get file sizes from s3
  const s3Stats = await readS3File({
    bucketInfo: {
      accessKeyId: process.env.CF_S3_PUB_ACCESS_KEY,
      bucketId: process.env.CF_S3_PUB_BUCKET_ID,
      region: process.env.CF_S3_PUB_REGION,
      secretAccessKey: process.env.CF_S3_PUB_SECRET_KEY,
    },
    path: `national-downloads/${s3Julian}/status.json`,
  });

  await cacheProfileStats(pool, schemaName, profileStats, s3Stats);

  return profileStats.details;
}

// Verify the data pulled in from the ETL matches the materialized views.
async function certifyEtlComplete(pool, profileStats, logId, schemaName) {
  // loop through and make sure the tables exist and the counts match
  let issuesMessage = '';
  for (const profile of profileStats) {
    const profileName = extractProfileName(profile.name);

    // check date
    if (profile.last_refresh_end_time <= profile.last_refresh_date) {
      issuesMessage += `${profileName} issue: last_refresh_end_time (${profile.last_refresh_end_time}) is not after last_refresh_date (${profile.last_refresh_date}).\n`;
    }

    // query to get row count
    const queryRes = await pool.query(
      `SELECT COUNT(*) FROM "${schemaName}"."${profileName}"`,
    );
    const queryCount = parseInt(queryRes.rows[0].count);

    // verify row counts match
    if (queryCount !== profile.num_rows) {
      issuesMessage += `${profileName} issue: count mismatch MV has "${profile.num_rows}" rows and DB has "${queryCount}".\n`;
    }
  }

  if (issuesMessage) {
    issuesMessage = `ETL process failed!\n${issuesMessage}`;
    log.warn(issuesMessage);
    await logEtlLoadError(pool, logId, issuesMessage);
    throw issuesMessage;
  }

  return true;
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
    .query(
      'SELECT s3_julian FROM logging.etl_schemas WHERE s3_julian IS NOT NULL',
    )
    .catch((err) => {
      log.warn(`Could not query schemas: ${err}`);
    });
  if (!schemas?.rowCount) return;

  // build a list of directories (schemas) to leave on S3
  const dirsToIgnore = schemas.rows.map((schema) => schema.s3_julian);
  dirsToIgnore.push('latest.json');

  await deleteDirectory({
    directory: 'national-downloads',
    dirsToIgnore,
  });
}

// Creates an individual index
async function createIndividualIndex(
  client,
  column,
  count,
  indexCount,
  indexTableName,
  tableName,
) {
  if (column.skipIndex) return count;

  const sortOrder = column.indexOrder || 'asc';
  const collate = column.type ? '' : 'COLLATE pg_catalog."default"';
  const indexName = `${indexTableName}_${column.name}_${sortOrder}`;

  await client.query(`
    CREATE INDEX IF NOT EXISTS ${indexName}
      ON ${tableName} USING btree
      (${column.name} ${collate} ${sortOrder} NULLS LAST)
      TABLESPACE pg_default
  `);
  count += 1;
  log.info(
    `${tableName}: Created index (${count} of ${indexCount}): ${indexName}`,
  );

  return count;
}

// Build the query for creating the indexes
async function createIndexes(s3Config, client, overrideWorkMemory, tableName) {
  const indexTableName = tableName.replaceAll('_', '');

  const table = Object.values(s3Config.tableConfig).find(
    (table) => table.tableName === tableName,
  );
  if (!table) return;

  if (overrideWorkMemory)
    await client.query(`SET maintenance_work_mem TO '${overrideWorkMemory}'`);

  // count the total number of indexes needed (for logging status)
  const indexableColumns = table.columns.filter((col) => !col.skipIndex);

  // create indexes for the table
  let count = 0;
  for (const column of indexableColumns) {
    count = await createIndividualIndex(
      client,
      column,
      count,
      indexableColumns.length,
      indexTableName,
      tableName,
    );
  }

  // create materialized views for the table
  count = 0;
  for (const mv of table.materializedViews) {
    // optionally join columns from other tables
    const joinClause = (join) =>
      `LEFT JOIN ${join.table} ON ${join.joinKey[0]} = ${join.joinKey[1]}`;
    await client.query(`
      CREATE MATERIALIZED VIEW IF NOT EXISTS ${mv.name}
      AS
      SELECT DISTINCT ${mv.columns.map((col) => col.name).join(', ')}
      FROM ${tableName} ${mv.joins ? mv.joins.map(joinClause).join(' ') : ''}

      WITH DATA;
    `);
    count += 1;
    log.info(
      `${tableName}: Created materialized view (${count} of ${table.materializedViews.length}): ${mv.name}`,
    );

    const indexableColumnsMv = mv.columns.filter((col) => !col.skipIndex);

    // create indexes for the materialized view
    let mvIndexCount = 0;
    const mvIndexTableName = mv.name.replaceAll('_', '');
    for (const column of indexableColumnsMv) {
      mvIndexCount = await createIndividualIndex(
        client,
        column,
        mvIndexCount,
        indexableColumnsMv.length,
        mvIndexTableName,
        mv.name,
      );
    }
  }

  // create countPerOrgCycle view
  const groupByColumns = [];
  const hasOrgId = table.columns.find((c) => c.name === 'organizationid');
  const hasReportingCycleId = table.columns.find(
    (c) => c.name === 'reportingcycle',
  );
  const hasCycleId = table.columns.find((c) => c.name === 'cycleid');

  const orderByArray = [];
  if (hasOrgId) {
    groupByColumns.push('organizationid');
    orderByArray.push({ column: 'organizationid', order: 'ASC' });
  }
  if (hasReportingCycleId) {
    groupByColumns.push('reportingcycle');
    orderByArray.push({ column: 'reportingcycle', order: 'DESC' });
  }
  if (hasCycleId) {
    groupByColumns.push('cycleid');
    orderByArray.push({ column: 'cycleid', order: 'ASC' });
  }

  const mvName = `${tableName}_countperorgcycle`;
  await client.query(`
    CREATE MATERIALIZED VIEW IF NOT EXISTS ${mvName}
    AS
    SELECT ${groupByColumns.join(
      ', ',
    )}, count(*), count(distinct "assessmentunitid") as "assessmentUnitIdCount"
    FROM ${tableName}
    ${
      tableName === 'catchment_correspondence'
        ? 'WHERE catchmentnhdplusid IS NOT NULL'
        : ''
    }
    GROUP BY ${groupByColumns.join(', ')}
    ORDER BY ${orderByArray
      .map((col) => `${col.column} ${col.order}`)
      .join(', ')}

    WITH DATA;
  `);

  log.info(`${tableName}: Created countPerOrgCycle materialized view`);
}

// Extracts data from ordspub services
async function extract(profileName, s3Config, next = 0, retryCount = 0) {
  const chunkSize = s3Config.config.chunkSize;

  const url =
    `${s3Config.services.materializedViews}/${profileName}` +
    `?p_limit=${chunkSize}&p_offset=${next}`;
  const res = await fetchRetry({
    url,
    s3Config,
    serviceName: `ordspub - ${profileName}`,
    callOptions: {
      headers: { 'API-key': process.env.MV_API_KEY },
      httpsAgent: new https.Agent({
        // TODO - Remove this when ordspub supports OpenSSL 3.0
        // This is needed to allow node 18 to talk with ordspub, which does
        //   not support OpenSSL 3.0
        secureOptions: crypto.constants.SSL_OP_LEGACY_SERVER_CONNECT,
      }),
    },
  });

  const data = res.data.records;
  return { data: data.length ? data : null, next: next + chunkSize };
}

// Transforms data from ordspub services into postgres tables
async function transform(tableName, columns, data) {
  const colList = columns.map((col) => ({
    name: col.nameOverrideOrds || col.name,
  }));

  const insertColumns = new pgp.helpers.ColumnSet(colList);

  const rows = [];
  data.forEach((datum) => {
    rows.push(
      colList.reduce((acc, cur) => {
        const colDef = columns.find(
          (col) => cur.name === (col.nameOverrideOrds || col.name),
        );
        return { ...acc, [cur.name]: datum[colDef.name || col.name] };
      }, {}),
    );
  });
  return pgp.helpers.insert(rows, insertColumns, tableName);
}

// Get the ETL task for a particular profile
function getProfileEtl(
  { createQuery, columns, maxChunksOverride, overrideWorkMemory, tableName },
  s3Config,
  s3Julian,
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
      if (environment.isLocal) {
        const profileName = `profile_${tableName}`;
        let res = await extract(profileName, s3Config);
        let chunksProcessed = 0;
        const maxChunks = maxChunksOverride ?? process.env.MAX_CHUNKS;
        while (
          res.data !== null &&
          (!maxChunks || chunksProcessed < maxChunks)
        ) {
          const query = await transform(tableName, columns, res.data);
          await client.query(query);
          log.info(`Next record offset for table ${tableName}: ${res.next}`);
          res = await extract(profileName, s3Config, res.next);
          chunksProcessed += 1;
        }
      } else {
        await client.query(
          `
          SELECT aws_s3.table_import_from_s3(
            table_name := $1,
            column_list := '',
            options := '(format csv, header true)',
            s3_info := aws_commons.create_s3_uri(
              bucket := $2,
              file_path := $3,
              region := $4
            ),
            credentials := aws_commons.create_aws_credentials(
              access_key := $5,
              secret_key := $6,
              session_token := ''
            )
          )
        `,
          [
            `${tableName}`,
            process.env.CF_S3_PUB_BUCKET_ID,
            `national-downloads/${s3Julian}/${tableName}.csv.gz`,
            process.env.CF_S3_PUB_REGION,
            process.env.CF_S3_PUB_ACCESS_KEY,
            process.env.CF_S3_PUB_SECRET_KEY,
          ],
        );
      }

      log.info(`${tableName}: Creating indexes`);
      await createIndexes(s3Config, client, overrideWorkMemory, tableName);
      log.info(`${tableName}: Indexes created`);
    } catch (err) {
      log.warn(`Failed to load table ${tableName}! ${err}`);
      throw err;
    }
  };
}

export async function isDataReady(pool) {
  try {
    // get julian date from s3 bucket
    const latest = await readS3File({
      bucketInfo: {
        accessKeyId: process.env.CF_S3_PUB_ACCESS_KEY,
        bucketId: process.env.CF_S3_PUB_BUCKET_ID,
        region: process.env.CF_S3_PUB_REGION,
        secretAccessKey: process.env.CF_S3_PUB_SECRET_KEY,
      },
      path: 'national-downloads/latest.json',
    });

    if (!latest) return { ready: false, julian: null };

    const julian = latest.julian;

    const etlLog = await pool.query(
      'SELECT id FROM logging.etl_log WHERE s3_julian = $1',
      [julian],
    );

    let etlLogId;
    if (etlLog.rows.length > 0) {
      etlLogId = etlLog.rows[0].id;
    } else {
      etlLogId = await logEtlExtractStart(pool, julian);
    }

    // check etl status to ensure it isn't already running
    const etlRunning = await pool.query(
      'SELECT database FROM logging.etl_status',
    );
    if (
      etlRunning.rows.length > 0 &&
      etlRunning.rows[0].database === 'running'
    ) {
      return { ready: false, julian, logId: etlLogId };
    }

    // see if this julian has already been loaded into the db
    const result = await pool.query(
      `
        SELECT active FROM logging.etl_schemas WHERE s3_julian = $1
      `,
      [latest.julian],
    );

    // already been loaded in or is being loaded in
    if (result.rows.length > 0)
      return { ready: false, julian, logId: etlLogId };

    const ready = await readS3File({
      bucketInfo: {
        accessKeyId: process.env.CF_S3_PUB_ACCESS_KEY,
        bucketId: process.env.CF_S3_PUB_BUCKET_ID,
        region: process.env.CF_S3_PUB_REGION,
        secretAccessKey: process.env.CF_S3_PUB_SECRET_KEY,
      },
      path: `national-downloads/${latest.julian}/ready.json`,
    });

    if (ready.problems.length > 0) {
      await logEtlExtractError(pool, etlLogId, ready.problems);
      ready.problems.forEach((problem) => {
        log.error(`Error Building MV Backups: ${problem}`);
      });
    }

    if (ready.ready === 'go') return { ready: true, julian, logId: etlLogId };
    else return { ready: false, julian, logId: etlLogId };
  } catch (ex) {
    log.error(`Error checking if MVs are ready: ${ex}`);
  }

  return { ready: false, julian: null };
}
