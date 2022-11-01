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
  await database.runJob(true);

  // Schedule ETL to run daily at 3AM
  cron.schedule(
    '0 3 * * *',
    async () => {
      log.info('Running cron task every day at 3AM');

      database.runJob();
    },
    {
      scheduled: true,
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

  // Create expert_query user
  try {
    await database.createEqDb(client);
    app.emit('ready');
  } catch (err) {
    log.warn(`${err}: Retrying in 30 seconds...`);
    setTimeout(() => {
      app.emit('tryDb');
    }, 30 * 1000);
  } finally {
    await client.end();
  }
});

app.emit('tryDb');
