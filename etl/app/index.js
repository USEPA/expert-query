import cron from 'node-cron';
import express from 'express';

import * as database from './server/database.js';
import * as s3 from './server/s3.js';
import { logger as log } from './server/utilities/logger.js';

const app = express();
app.disable('x-powered-by');

const port = process.env.PORT || 3001;

async function etlJob(first = false) {
  // load config from private s3 bucket
  const s3Data = await s3.loadConfig();

  if (s3Data) s3.syncGlossary(s3Data.services);
  else {
    log.warn(
      'Failed to get config from private S3 bucket, skipping glossary sync',
    );
  }

  // Create and load new schema
  await database.runJob(first);
}

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
  etlJob();

  // Schedule ETL to run daily at 3AM
  cron.schedule(
    '0 3 * * *',
    async () => {
      log.info('Running cron task every day at 3AM');

      etlJob();
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
