import { GetObjectCommand } from '@aws-sdk/client-s3';
import cors from 'cors';
import express from 'express';
import { statSync } from 'node:fs';
import path, { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getActiveSchema, protectRoutes } from '../middleware.js';
import { knex } from '../utilities/database.js';
import {
  corsOptionsDelegate,
  getEnvironment,
} from '../utilities/environment.js';
import {
  formatLogMsg,
  log,
  populateMetdataObjFromRequest,
} from '../utilities/logger.js';
import { getS3Client } from '../utilities/s3.js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const environment = getEnvironment();

const minDateTime = new Date(-8640000000000000);

export default function (app, basePath) {
  const router = express.Router();

  router.use(protectRoutes);
  router.use(getActiveSchema);

  router.get('/health', cors(corsOptionsDelegate), function (req, res) {
    res.json({ status: 'UP' });
  });

  router.get(
    '/health/etlGlossary',
    cors(corsOptionsDelegate),
    async function (req, res) {
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
        res
          .status(200)
          .json({ status: timeSinceLastUpdate >= 24.5 ? 'FAILED-TIME' : 'UP' });
      } catch (error) {
        log.error(formatLogMsg(metadataObj, 'Error!: ', error));
        res.status(500).send('Error!' + error);
      }
    },
  );

  app.use(`${basePath}api`, router);
}
