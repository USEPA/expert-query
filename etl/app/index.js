import cron from 'node-cron';
import express from 'express';

import etlJob from './server/etlJob.js';
import * as database from './server/database.js';
import { logger as log } from './server/utilities/logger.js';
import { getEnvironment } from './server/utilities/environment.js';

const app = express();
app.disable('x-powered-by');

const port = process.env.PORT || 3001;

const environment = getEnvironment();

const requiredEnvVars = ['EQ_PASSWORD', 'GLOSSARY_AUTH', 'MV_API_KEY'];

if (environment.isLocal) {
  requiredEnvVars.push('DB_USERNAME', 'DB_PASSWORD', 'DB_PORT', 'DB_HOST');
} else {
  requiredEnvVars.push(
    'CF_S3_PUB_ACCESS_KEY',
    'CF_S3_PUB_BUCKET_ID',
    'CF_S3_PUB_REGION',
    'CF_S3_PUB_SECRET_KEY',
    'CF_S3_PRIV_ACCESS_KEY',
    'CF_S3_PRIV_BUCKET_ID',
    'CF_S3_PRIV_REGION',
    'CF_S3_PRIV_SECRET_KEY',
    'VCAP_SERVICES',
  );
}

requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    const message =
      envVar === 'VCAP_SERVICES'
        ? 'VCAP_SERVICES Information not found. Connection will not be attempted.'
        : `Required environment variable ${envVar} not found.`;
    log.error(message);
    process.exit();
  }
});

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

  log.info('Scheduling load to run daily at 3AM');

  etlJob();

  // Schedule ETL to run daily at 3AM
  cron.schedule(
    '0 3 * * *',
    () => {
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

  if (!client) return;

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
