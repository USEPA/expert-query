import dotenv from 'dotenv';
import cron from 'node-cron';
import express from 'express';

import database from './server/database';
import { logger as log } from './server/utilities/logger';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.on('listening', async () => {
  // Back up log tables
  try {
    const backupResult = await database.backupLogs();
    log.info(backupResult);
  } catch (err) {
    log.error(err);
  }

  // Create and load tables
  await database.checkLogTables().catch((err) => {
    log.error(`Failed to check for expert_query log tables: ${err}`);
  });

  log.info('Creating tables, running load, and scheduling load to run daily');

  database.runLoad();

  // Schedule ETL to run daily at 3AM
  cron.schedule(
    '0 0 3 * * *',
    () => {
      log.info('running every day at 3AM');
      log.info(new Date(Date.now()).toLocaleString());

      database.runLoad();
    },
    {
      scheduled: true,
      timezone: 'America/New_York',
    },
  );
});

app.on('ready', () => {
  app.listen(port, () => {
    log.info(`Expert Query ETL app listening on port ${port}!`);
  });
});

app.on('tryDb', async () => {
  if (process.env.OW_USERNAME === null || process.env.OW_PASSWORD === null) {
    log.error('The OWPUB connection information has not been properly set');
    process.exit();
  }

  if (process.env.EQ_USERNAME === null || process.env.EQ_PASSWORD === null) {
    log.error(
      'The experty_query connection information has not been properly set',
    );
    process.exit();
  }

  const client = await database.connectPostgres().catch((err) => {
    log.warn(
      'Failed to connect to postgres! Retrying in 30 seconds...\n' + err,
    );
    setTimeout(() => {
      app.emit('tryDb');
    }, 30 * 1000);
  });

  if (!client) return;

  log.info('postgres connection established');

  // Create expert_query user
  const dbSuccess = await database.createEqDb(client).catch((err) => {
    log.warn(`${err}: Retrying in 30 seconds...`);
    setTimeout(() => {
      app.emit('tryDb');
    }, 30 * 1000);
    return false;
  });

  if (dbSuccess) app.emit('ready');
});

app.emit('tryDb');
