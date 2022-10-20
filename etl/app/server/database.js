import Crypto from 'crypto';
import fs from 'fs';
import numeral from 'numeral';
import pg from 'pg';

import { logger as log } from './utilities/logger.js';
import * as create from './queries/create.js';

const { Pool } = pg;

const dbName = 'expert_query';

let isLocal = false;
let isDevelopment = false;
let isStaging = false;

if (process.env.NODE_ENV) {
  isLocal = 'local' === process.env.NODE_ENV.toLowerCase();
  isDevelopment = 'development' === process.env.NODE_ENV.toLowerCase();
  isStaging = 'staging' === process.env.NODE_ENV.toLowerCase();
}

const loadTestProducts = isLocal || isDevelopment || isStaging;

const createConfig = {
  user: process.env.PG_USERNAME,
  password: process.env.PG_PASSWORD,
  database: 'postgres',
  port: process.env.PG_PORT,
  host: process.env.PG_HOST,
};
const createPool = new Pool(createConfig);

const eqConfig = {
  ...createConfig,
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
  if (createConfig.user === '') {
    throw new Error('Database information not set!');
  } else {
    log.info(
      'Connecting to postgres: ' + createConfig.host + ':' + createConfig.port,
    );
    try {
      const client = await createPool.connect();
      return client;
    } catch (err) {
      throw err;
    }
  }
}

export async function createEqDb(client) {
  try {
    try {
      // Create the expert_query db and ignore any errors, i.e. the db already exists
      client.query('CREATE DATABASE ' + dbName);
      log.info(`${dbName} database created!`);
    } catch (err) {
      log.info(`Warning: ${dbName} database! ${err}`);
    }

    try {
      // Create the eq user and ignore any errors, i.e. the eq user already exists
      client.query(
        `CREATE USER ${process.env.EQ_USERNAME} WITH PASSWORD '${process.env.EQ_PASSWORD}'`,
      );
      log.info(`${process.env.EQ_USERNAME} user created!`);
    } catch (err) {
      log.info(`Warning: ${process.env.EQ_USERNAME} user! ${err}`);
    }

    return true;
  } catch (err) {
    throw new Error(`Failed to create ${dbName} database! ${err}`);
  } finally {
    client.release();
  }
}

export async function runLoad() {}
