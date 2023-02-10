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
import { log } from './utilities/logger.js';
import StreamingService from './utilities/streamingService.js';
import * as profiles from './profiles/index.js';
import { createS3Stream, deleteDirectory, readS3File } from './s3.js';
// config
import { tableConfig } from '../config/tableConfig.js';

const { Client, Pool } = pg;
const setImmediatePromise = util.promisify(setImmediate);

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
async function createNewSchema(pool, schemaName, s3Julian) {
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
export async function runJob(s3Config, checkIfReady = true) {
  const pool = startConnPool();

  // check if the MV data is available in s3 and ready to be loaded
  let s3Julian = null;
  if (!environment.isLocal) {
    const readyResult = await isDataReady(pool);
    s3Julian = readyResult.julian;
    log.info(`Are MVs ready: ${readyResult.ready} | Julian ${s3Julian}`);

    // exit early if we aren't ready to run etl
    if (checkIfReady && !readyResult.ready) {
      await endConnPool(pool);
      return;
    }
  }

  updateEtlStatus(pool, 'database', 'running');
  try {
    await runLoad(pool, s3Config, s3Julian);
    await trimSchema(pool, s3Config);
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

export async function runLoad(pool, s3Config, s3Julian) {
  log.info('Running ETL process!');

  const logId = await logEtlLoadStart(pool);

  const now = new Date();
  const schemaName = `schema_${now.valueOf()}`;

  try {
    const schemaId = await createNewSchema(pool, schemaName, s3Julian);

    // Add tables to schema and import new data
    const loadTasks = Object.values(profiles).map((profile) => {
      return loadProfile(profile, pool, schemaName, s3Config, s3Julian);
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

// Build the query for creating the indexes
function buildIndexQuery(overrideWorkMemory, tableName) {
  const indexTableName = tableName.replaceAll('_', '');

  let query = overrideWorkMemory
    ? `SET maintenance_work_mem TO '${overrideWorkMemory}';\n`
    : '';

  const table = Object.values(tableConfig).find(
    (table) => table.tableName === tableName,
  );
  if (!table) return '';

  table.columns.forEach((column) => {
    if (column.skipIndex) return;

    const sortOrder = column.indexOrder || 'asc';
    const collate = column.type ? '' : 'COLLATE pg_catalog."default"';
    query += `
      CREATE INDEX IF NOT EXISTS ${indexTableName}_${column.name}_${sortOrder}
        ON ${tableName} USING btree
        (${column.name} ${collate} ${sortOrder} NULLS LAST)
        TABLESPACE pg_default;
      COMMIT;
    `;
  });

  return query;
}

// Get the ETL task for a particular profile
function getProfileEtl(
  {
    createQuery,
    extract,
    maxChunksOverride,
    overrideWorkMemory,
    tableName,
    transform,
  },
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
        let res = await extract(s3Config);
        let chunksProcessed = 0;
        const maxChunks = maxChunksOverride ?? process.env.MAX_CHUNKS;
        while (
          res.data !== null &&
          (!maxChunks || chunksProcessed < maxChunks)
        ) {
          const query = await transform(res.data, chunksProcessed === 0);
          await client.query(query);
          log.info(`Next record offset for table ${tableName}: ${res.next}`);
          res = await extract(s3Config, res.next);
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
            process.env.CF_S3_PRIV_ETL_BUCKET_ID,
            `${s3Julian}/${tableName}.csv.gz`,
            process.env.CF_S3_PRIV_ETL_REGION,
            process.env.CF_S3_PRIV_ETL_ACCESS_KEY,
            process.env.CF_S3_PRIV_ETL_SECRET_KEY,
          ],
        );
      }

      log.info(`${tableName}: Creating indexes`);
      await client.query(buildIndexQuery(overrideWorkMemory, tableName));
      log.info(`${tableName}: Indexes created`);
    } catch (err) {
      log.warn(`Failed to load table ${tableName}! ${err}`);
      throw err;
    }

    log.info(`Table ${tableName} load success`);
  };
}

function streamNationalDownloadSingleProfile(
  pool,
  activeSchema,
  profile,
  format,
  inStream,
) {
  // output types csv, tab-separated, Excel, or JSON
  try {
    const tableName = profile.tableName;

    const stream = inStream.stream;
    const client = inStream.client;

    const extension = `.${format}.gz`;

    // create zip streams
    const gzipStream = zlib.createGzip();

    const isLocal = environment.isLocal;

    // create output stream
    let writeStream;
    if (isLocal) {
      const __dirname = path.dirname(fileURLToPath(import.meta.url));
      const subFolderPath = resolve(
        __dirname,
        `../../../app/server/app/content-etl/national-downloads/new`,
      );

      // create the sub folder if it doesn't already exist
      mkdirSync(subFolderPath, { recursive: true });

      writeStream = createWriteStream(
        `${subFolderPath}/${tableName}${extension}`,
      );

      gzipStream.pipe(writeStream);
    } else {
      writeStream = createS3Stream({
        contentType: 'application/gzip',
        filePath: `national-downloads/new/${tableName}${extension}`,
        stream: gzipStream,
      });
    }

    // start streaming/transforming the data into the S3 bucket
    if (format === 'xlsx') {
      // create workbook
      const workbook = new Excel.stream.xlsx.WorkbookWriter({
        stream: gzipStream,
        useStyles: true,
      });

      const worksheet = workbook.addWorksheet('data');

      StreamingService.streamResponse(gzipStream, stream, 'xlsx', {
        workbook,
        worksheet,
      });
    } else {
      StreamingService.streamResponse(gzipStream, stream, format);
    }

    // get the promises for verifying the streaming operation is complete
    let promise = writeStream;
    if (isLocal) {
      promise = new Promise((resolve, reject) => {
        writeStream.on('finish', () => {
          log.info(
            `Finished building national download for ${tableName}${extension}`,
          );
          resolve();
        });
        writeStream.on('error', reject);
      });
    }

    // return a promise for all of the streams and the db connection client,
    // so we can close the connection later
    return {
      promise,
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
  const tables = Object.values(tableConfig);

  const formats = ['csv'];

  const shouldShareStreams =
    !process.env.STREAM_SHARED || process.env.STREAM_SHARED === 'true';

  // fire off the streams and keep track of the db connection clients
  let promises = [];
  let clients = [];
  for (const table of tables) {
    let inStream;

    // go ahead and build the input stream if we are sharing the streams
    if (shouldShareStreams) {
      inStream = shouldShareStreams
        ? await buildInputStream(activeSchema, pool, table)
        : null;
    }

    // clear out promises and clients for next loop iteration
    if (!shouldShareStreams && process.env.STREAM_SERIALLY === 'true') {
      promises = [];
      clients = [];
    }

    // fire off streams for each format
    for (const format of formats) {
      if (!inStream) {
        inStream = await buildInputStream(activeSchema, pool, table);
      }

      const { promise, client } = streamNationalDownloadSingleProfile(
        pool,
        activeSchema,
        table,
        format,
        inStream,
      );

      promises.push(promise);
      clients.push(client);

      // for concurrent streams, close connections as promises resolve
      if (process.env.STREAM_SERIALLY !== 'true') {
        promise.then(() => {
          log.info(`Closing connection to ${table.tableName}`);
          try {
            client.release();
          } catch (ex) {}
        });
      }
    }

    // for serial streaming, close streams after await completes
    if (process.env.STREAM_SERIALLY === 'true') {
      await Promise.all(promises);
      try {
        clients.forEach((client) => client.release());
      } catch (ex) {}
    }
  }

  // for concurrent streaming, wait for all promises to complete prior to exiting
  if (process.env.STREAM_SERIALLY !== 'true') await Promise.all(promises);
}

async function buildInputStream(activeSchema, pool, profile) {
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

  return {
    client,
    stream,
  };
}

export async function isDataReady(pool) {
  try {
    // get julian date from s3 bucket
    const latest = await readS3File({
      bucketInfo: {
        accessKeyId: process.env.CF_S3_PRIV_ETL_ACCESS_KEY,
        bucketId: process.env.CF_S3_PRIV_ETL_BUCKET_ID,
        region: process.env.CF_S3_PRIV_ETL_REGION,
        secretAccessKey: process.env.CF_S3_PRIV_ETL_SECRET_KEY,
      },
      path: 'latest.json',
    });

    if (!latest) return { ready: false, julian: null };

    const julian = latest.julian;

    // see if this julian has already been loaded into the db
    const etlRunning = await pool.query(
      'SELECT database FROM logging.etl_status',
    );
    if (
      etlRunning.rows.length > 0 &&
      etlRunning.rows[0].database === 'running'
    ) {
      return { ready: false, julian };
    }

    // check etl status to ensure it isn't already running
    const result = await pool.query(
      `
        SELECT active FROM logging.etl_schemas WHERE s3_julian = $1
      `,
      [latest.julian],
    );

    // already been loaded in or is being loaded in
    if (result.rows.length > 0) return { ready: false, julian };

    const ready = await readS3File({
      bucketInfo: {
        accessKeyId: process.env.CF_S3_PRIV_ETL_ACCESS_KEY,
        bucketId: process.env.CF_S3_PRIV_ETL_BUCKET_ID,
        region: process.env.CF_S3_PRIV_ETL_REGION,
        secretAccessKey: process.env.CF_S3_PRIV_ETL_SECRET_KEY,
      },
      path: `${latest.julian}/ready.json`,
    });

    if (ready.problems.length > 0) {
      ready.problems.forEach((problem) => {
        log.error(`Error Building MV Backups: ${problem}`);
      });
    }

    if (ready.ready === 'go') return { ready: true, julian };
    else return { ready: false, julian };
  } catch (ex) {
    log.error(`Error checking if MVs are ready: ${ex}`);
  }

  return { ready: false, julian: null };
}
