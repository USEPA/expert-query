import knexJs from 'knex';
import pg from 'pg';
import { log } from '../utilities/logger.js';

let isLocal = false;
let isDevelopment = false;
let isStaging = false;

let dbHost = '';
let dbPort = '';
const dbName = process.env.DB_NAME ?? 'expert_query';
const dbUser = process.env.DB_USERNAME;
const dbPassword = process.env.DB_PASSWORD;
const dbSsl = process.env.DB_SSL === 'true';
console.log('dbSsl: ', dbSsl);

if (process.env.NODE_ENV) {
  isLocal = 'local' === process.env.NODE_ENV.toLowerCase();
  isDevelopment = 'development' === process.env.NODE_ENV.toLowerCase();
  isStaging = 'staging' === process.env.NODE_ENV.toLowerCase();
}

if (isLocal) {
  log.info('Since local, using a localhost Postgres database.');
  dbHost = process.env.DB_HOST;
  dbPort = process.env.DB_PORT;
} else {
  log.info('Using VCAP_SERVICES Information to connect to Postgres.');
  let vcap_services = JSON.parse(process.env.VCAP_SERVICES);
  dbHost = vcap_services['aws-rds'][0].credentials.host;
  dbPort = vcap_services['aws-rds'][0].credentials.port;
}
log.info(`host: ${dbHost}`);
log.info(`port: ${dbPort}`);
log.info(`dbName: ${dbName}`);
log.info(`user: ${dbUser}`);
log.info(`DB_POOL_MIN: ${parseInt(process.env.DB_POOL_MIN)}`);
log.info(`DB_POOL_MAX: ${parseInt(process.env.DB_POOL_MAX)}`);
log.info(`STREAM_BATCH_SIZE: ${parseInt(process.env.STREAM_BATCH_SIZE)}`);
log.info(
  `STREAM_HIGH_WATER_MARK: ${parseInt(process.env.STREAM_HIGH_WATER_MARK)}`,
);
log.info(`MAX_QUERY_SIZE: ${parseInt(process.env.MAX_QUERY_SIZE)}`);
log.info(`JSON_PAGE_SIZE: ${parseInt(process.env.JSON_PAGE_SIZE)}`);

// Setup parsers for ensuring output matches datatype in database
// (i.e., return count as 124 instead of "124")
pg.types.setTypeParser(pg.types.builtins.INT8, (value) => {
  return parseInt(value);
});
pg.types.setTypeParser(pg.types.builtins.FLOAT8, (value) => {
  return parseFloat(value);
});
pg.types.setTypeParser(pg.types.builtins.NUMERIC, (value) => {
  return parseFloat(value);
});
pg.types.setTypeParser(pg.types.builtins.DATE, (value) => {
  return value.toString();
});

/**
 * Appends to the where clause of the provided query.
 * @param {Object} query KnexJS query object
 * @param {string} paramName column name
 * @param {string} paramValue URL query value
 */
function appendToWhere(query, paramName, paramValue) {
  if (paramValue === undefined) return;

  try {
    if (Array.isArray(paramValue)) {
      const nonNulls = paramValue.filter((p) => p !== 'null' && p !== null);
      const nulls = paramValue.filter((p) => p === 'null' || p === null);
      query.where((q) => {
        if (nonNulls.length > 0) q.whereIn(paramName, nonNulls);
        if (nulls.length > 0) q.orWhereNull(paramName);
      });
    } else if (paramValue === 'null' || paramValue === null) {
      query.whereNull(paramName);
    } else {
      query.where(paramName, paramValue);
    }
  } catch (ex) {
    console.error(ex);
  }
}

async function queryPool(query, first = false) {
  const { sql, bindings } = query.toSQL().toNative();
  const results = (await pool.query(`${sql}`, bindings)).rows;
  return first ? results[0] : results;
}

const knex = knexJs({
  client: 'pg',
  connection: {
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    database: dbName,
    ssl: dbSsl ? { rejectUnauthorized: false } : undefined,
  },
  pool: {
    min: 0,
    max: 0,
  },
});

const pool = new pg.Pool({
  host: dbHost,
  user: dbUser,
  port: dbPort,
  password: dbPassword,
  database: dbName,
  max: parseInt(process.env.DB_POOL_MAX),
  ssl: dbSsl ? { rejectUnauthorized: false } : undefined,
});

export { appendToWhere, knex, pool, queryPool };
