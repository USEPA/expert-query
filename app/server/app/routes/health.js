import { GetObjectCommand } from '@aws-sdk/client-s3';
import express from 'express';
import { statSync } from 'node:fs';
import path, { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getActiveSchema, protectRoutes } from '../middleware.js';
import { knex, queryPool } from '../utilities/database.js';
import { getEnvironment } from '../utilities/environment.js';
import {
  formatLogMsg,
  log,
  populateMetdataObjFromRequest,
} from '../utilities/logger.js';
import { getS3Client } from '../utilities/s3.js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const { isLocal, isTest } = getEnvironment();

export default function (app, basePath) {
  const router = express.Router();

  router.use(protectRoutes);
  router.use(getActiveSchema);

  router.get('/health', function (req, res) {
    res.json({ status: 'UP' });
  });

  router.get('/health/etlGlossary', async function (req, res) {
    const metadataObj = populateMetdataObjFromRequest(req);

    try {
      // check etl status in db
      const results =
        (await queryPool(
          knex.withSchema('logging').from('etl_status').select('glossary'),
        ),
        true);
      if (results.glossary === 'failed') {
        return res.status(200).json({ status: 'FAILED-DB' });
      }

      // initialize timeSinceLastUpdate to the minimum time node allows
      let timeSinceLastUpdate;

      // verify file update date is within the last 24 hours
      if (isLocal || isTest) {
        const path = resolve(__dirname, `../content-etl/glossary.json`);

        // get hours since file last modified
        const stats = statSync(path);
        timeSinceLastUpdate = (Date.now() - stats.mtime) / (1000 * 60 * 60);
      } else {
        // setup public s3 bucket
        const s3 = getS3Client();

        // get a list of files in the directory
        const command = new GetObjectCommand({
          Bucket: process.env.CF_S3_PUB_BUCKET_ID,
          Key: 'content-etl/glossary.json',
        });
        const data = await (await s3.send(command)).Body.transformToString();

        timeSinceLastUpdate =
          (Date.now() - data.LastModified) / (1000 * 60 * 60);
      }

      // check that glossary was updated in the last 25 hours
      return res
        .status(200)
        .json({ status: timeSinceLastUpdate >= 24.5 ? 'FAILED-TIME' : 'UP' });
    } catch (error) {
      log.error(formatLogMsg(metadataObj, 'Error!: ', error));
      return res.status(500).send('Error!' + error);
    }
  });

  app.use(`${basePath}api`, router);
}
