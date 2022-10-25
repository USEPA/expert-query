import cron from 'node-cron';
import express from 'express';

import * as database from './server/database.js';
import { logger as log } from './server/utilities/logger.js';

const app = express();
app.disable('x-powered-by');

const port = process.env.PORT || 3001;

app.on('ready', async () => {
  app.listen(port, () => {
    log.info(`Expert Query ETL app listening on port ${port}!`);
  });
  // Back up logs
  try {
    log.info('Backing up logs');
  } catch (err) {
    log.error(err);
  }

  // Create log tables if they don't exist
  await database.checkLogTables().catch((err) => {
    log.error(`Failed to check for expert_query log tables: ${err}`);
  });

  log.info('Creating tables, running load, and scheduling load to run daily');

  // Create and load new schema
  try {
    await database.runLoad();
    database.trimSchema();
  } catch (err) {
    log.warn(`First run failed, continuing to schedule cron task: ${err}`);
  }

  // Schedule ETL to run every thirty minutes
  cron.schedule(
    // '0,30 * * * *',
    '* * * * *',
    () => {
      log.info('Running cron task every 30 minutes');
      log.info(new Date(Date.now()).toLocaleString());

      database.runLoad().then(() => {
        database.trimSchema();
      });
    },
    {
      scheduled: true,
      timezone: 'America/New_York',
    },
  );
});

app.on('tryDb', async () => {
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
