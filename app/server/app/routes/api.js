import axios from 'axios';
import cors from 'cors';
import express from 'express';
import { readFile } from 'node:fs/promises';
import path, { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getActiveSchema } from '../middleware.js';
import { knex, queryPool } from '../utilities/database.js';
import { getEnvironment } from '../utilities/environment.js';
import {
  formatLogMsg,
  log,
  populateMetdataObjFromRequest,
} from '../utilities/logger.js';
import { getPrivateConfig } from '../utilities/s3.js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const { isLocal, isTest, isDevelopment, isStaging, isProduction } =
  getEnvironment();

const s3Bucket = process.env.CF_S3_PUB_BUCKET_ID;
const s3Region = process.env.CF_S3_PUB_REGION;
const s3BucketUrl = `https://${s3Bucket}.s3-${s3Region}.amazonaws.com`;

function logError(error, metadataObj) {
  if (isLocal || isTest) {
    log.error(error);
    return;
  }

  if (typeof error.toJSON === 'function') {
    log.debug(formatLogMsg(metadataObj, error.toJSON()));
  }

  const errorStatus = error.response?.status;
  const errorMethod = error.response?.config?.method?.toUpperCase();
  const errorUrl = error.response?.config?.url;
  const message = `S3 Error: ${errorStatus} ${errorMethod} ${errorUrl}`;
  log.error(formatLogMsg(metadataObj, message));
}

async function fetchMetadata(req) {
  const metadataObj = populateMetdataObjFromRequest(req);

  const baseDir = 'national-downloads';

  // The S3 directory of the data currently loaded in the database. Using this
  // instead of `latest.json` keeps the download links pointed at the active
  // schema's data, even when a newer extract failed to load.
  const [activeSchema, profileStats] = await Promise.all([
    queryPool(
      knex
        .withSchema('logging')
        .column({ s3Julian: 's3_julian' })
        .from('etl_schemas')
        .where('schema_name', req.activeSchema)
        .select(),
      true,
    ).catch((err) => {
      logError(err, metadataObj);
    }),

    queryPool(
      knex
        .withSchema('logging')
        .column({
          profileName: 'profile_name',
          numRows: 'num_rows',
          timestamp: 'last_refresh_end_time',
          csvSize: 'csv_size',
          zipSize: 'zip_size',
        })
        .from('mv_profile_stats')
        .where('schema_name', req.activeSchema)
        .select(),
    ).catch((err) => {
      logError(err, metadataObj);
    }),
  ]);

  if (!activeSchema?.s3Julian || !profileStats)
    throw new Error('Error getting national downloads data');

  const data = {};

  const s3Julian = activeSchema.s3Julian;

  // get config from private S3 bucket
  const privateConfig = await getPrivateConfig();

  Object.entries(privateConfig.tableConfig).map(([profile, config]) => {
    const basename = config.tableName;
    const filename = `${baseDir}/${s3Julian}/${basename}.csv.zip`;
    const stats = profileStats.find((p) => p.profileName === config.tableName);
    if (!stats) return;

    data[profile] = {
      csvSize: stats.csvSize,
      numRows: stats.numRows,
      timestamp: stats.timestamp,
      url: `${s3BucketUrl}/${filename}`,
      zipSize: stats.zipSize,
    };
  });

  return { metadata: data };
}
// local development: read files directly from disk
// Cloud.gov: fetch files from the public s3 bucket
async function getFile(
  filename,
  encoding = undefined,
  responseType = undefined,
) {
  return isLocal || isTest
    ? readFile(resolve(__dirname, '../', filename), encoding)
    : axios({
        method: 'get',
        url: `${s3BucketUrl}/${filename}`,
        timeout: 10000,
        responseType,
      });
}

// local development: no further processing of strings needed
// Cloud.gov: get data from responses
function parseResponse(res) {
  if (Array.isArray(res)) {
    return isLocal || isTest
      ? res.map((r) => JSON.parse(r))
      : res.map((r) => r.data);
  } else {
    return isLocal || isTest ? JSON.parse(res) : res.data;
  }
}

export default function (app, basePath) {
  const router = express.Router();

  router.use(getActiveSchema);

  // ****************************** //
  // Public / CORS Enabled          //
  // ****************************** //
  const corsOptions = {
    methods: 'GET,HEAD,POST',
  };

  router.get('/openapi', cors(corsOptions), (req, res) => {
    const metadataObj = populateMetdataObjFromRequest(req);

    getFile('content/eq-openapi.json', 'utf-8')
      .then((stringsOrResponses) => {
        let responseJson = parseResponse(stringsOrResponses);

        // Production: Only allow production in the servers selection in swagger
        if (isProduction) {
          responseJson = {
            ...responseJson,
            servers: responseJson.servers.filter(
              (s) => s.description === 'Production',
            ),
          };
        }

        return res.json(responseJson);
      })
      .catch((error) => {
        if (typeof error.toJSON === 'function') {
          log.debug(formatLogMsg(metadataObj, error.toJSON()));
        }

        const errorStatus = error.response?.status;
        const errorMethod = error.response?.config?.method?.toUpperCase();
        const errorUrl = error.response?.config?.url;
        const message = `S3 Error: ${errorStatus} ${errorMethod} ${errorUrl}`;
        log.error(formatLogMsg(metadataObj, message));

        return res
          .status(error?.response?.status || 500)
          .json({ message: 'Error getting static content from S3 bucket' });
      });
  });

  // ****************************** //
  // Private / NOT CORS Enabled     //
  // ****************************** //

  // --- get static content from S3
  router.get('/lookupFiles', (req, res) => {
    const metadataObj = populateMetdataObjFromRequest(req);

    // NOTE: static content files found in `app/server/app/content/` directory
    const filenames = [
      'content/alerts/config.json',
      'content-etl/glossary.json',
      'content/config/parameters.json',
      'content/config/fields.json',
      'content/config/listOptions.json',
      'content/config/profiles.json',
      'content/config/nationalDownloads.json',
    ];

    const filePromises = Promise.all(
      filenames.map((filename) => {
        return getFile(filename);
      }),
    )
      .then((stringsOrResponses) => {
        return parseResponse(stringsOrResponses);
      })
      .then((data) => {
        return {
          services: {
            eqApiKey: process.env.EQ_API_KEY ?? '',
            eqApiSignupKey: process.env.EQ_API_SIGNUP_KEY ?? '',
            eqDataApi: process.env.EQ_DATA_API_URL ?? '',
          },
          alertsConfig: data[0],
          glossary: data[1],
          parameters: data[2],
          filterConfig: data[3],
          listOptions: data[4],
          profileConfig: data[5],
          nationalDownloads: data[6],
        };
      });

    const directories = ['content-etl/domainValues'];

    const directoryPromises = Promise.all(
      directories.map((directory) => {
        return getFile(`${directory}/index.json`, 'utf-8').then(
          (stringOrResponse) => {
            const dirFiles = parseResponse(stringOrResponse);
            return Promise.all(
              dirFiles.map((dirFile) => {
                return getFile(`${directory}/${dirFile}`, 'utf-8');
              }),
            )
              .then((stringsOrResponses) => {
                return parseResponse(stringsOrResponses);
              })
              .then((data) => {
                return data.reduce((a, b) => {
                  return Object.assign(a, b);
                }, {});
              });
          },
        );
      }),
    ).then((data) => {
      return {
        domainValues: data[0],
      };
    });

    const metadataPromise = fetchMetadata(req);

    Promise.all([filePromises, directoryPromises, metadataPromise])
      .then((data) => res.json({ ...data[0], ...data[1], ...data[2] }))
      .catch((error) => {
        logError(error, metadataObj);

        return res
          .status(error?.response?.status || 500)
          .json({ message: 'Error getting static content from S3 bucket' });
      });
  });

  app.use(`${basePath}api`, router);
}
