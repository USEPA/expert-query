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

  log.info('Creating tables, running load, and scheduling load to run daily');

  // Create and load new schema
  await database.runJob();

  // Schedule ETL to run daily at 3AM
  cron.schedule(
    '0 3 * * *',
    async () => {
      log.info('Running cron task every day at 3AM');
      log.info(new Date(Date.now()).toLocaleString());

      database.runJob();
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
      log.info('Call tryDb2');
      app.emit('tryDb');
    }, 30 * 1000);
  });

  if (!client) return;

  log.info('postgres connection established');

  // Create expert_query user
  try {
    await database.createEqDb(client);
    log.info('Call ready');
    app.emit('ready');
  } catch (err) {
    log.warn(`${err}: Retrying in 30 seconds...`);
    setTimeout(() => {
      log.info('Call tryDb3');
      app.emit('tryDb');
    }, 30 * 1000);
  } finally {
    await client.end();
  }
});

log.info('Call tryDb1');
app.emit('tryDb');
