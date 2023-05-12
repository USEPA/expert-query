import AWS from 'aws-sdk';
import express from 'express';
import { statSync } from 'node:fs';
import path, { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getActiveSchema } from '../middleware.js';
import { knex } from '../utilities/database.js';
import { getEnvironment } from '../utilities/environment.js';
import {
  formatLogMsg,
  log,
  populateMetdataObjFromRequest,
} from '../utilities/logger.js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const environment = getEnvironment();

const minDateTime = new Date(-8640000000000000);

export default function (app, basePath) {
  const router = express.Router();

  router.use(getActiveSchema);

  router.get('/health', function (req, res) {
    res.json({ status: 'UP' });
  });

  router.get('/health/etlGlossary', async function (req, res) {
    const metadataObj = populateMetdataObjFromRequest(req);

    try {
      // check etl status in db
      const query = knex
        .withSchema('logging')
        .from('etl_status')
        .select('glossary')
        .first();
      const results = await query;
      if (results.glossary === 'failed') {
        res.status(200).json({ status: 'FAILED-DB' });
        return;
      }

      // initialize timeSinceLastUpdate to the minimum time node allows
      let timeSinceLastUpdate = minDateTime;

      // verify file update date is within the last 24 hours
      if (environment.isLocal) {
        const path = resolve(__dirname, `../content-etl/glossary.json`);

        // get hours since file last modified
        const stats = statSync(path);
        timeSinceLastUpdate = (Date.now() - stats.mtime) / (1000 * 60 * 60);
      } else {
        // setup public s3 bucket
        const config = new AWS.Config({
          accessKeyId: process.env.CF_S3_PUB_ACCESS_KEY,
          secretAccessKey: process.env.CF_S3_PUB_SECRET_KEY,
          region: process.env.CF_S3_PUB_REGION,
        });
        AWS.config.update(config);
        const s3 = new AWS.S3({ apiVersion: '2006-03-01' });

        // get a list of files in the directory
        const data = await s3
          .getObject({
            Bucket: process.env.CF_S3_PUB_BUCKET_ID,
            Key: 'content-etl/glossary.json',
          })
          .promise();

        timeSinceLastUpdate =
          (Date.now() - data.LastModified) / (1000 * 60 * 60);
      }

      // check that glossary was updated in the last 25 hours
      res
        .status(200)
        .json({ status: timeSinceLastUpdate >= 24.5 ? 'FAILED-TIME' : 'UP' });
    } catch (error) {
      log.error(formatLogMsg(metadataObj, 'Error!: ', error));
      res.status(500).send('Error!' + error);
    }
  });

  app.use(`${basePath}api`, router);
}
