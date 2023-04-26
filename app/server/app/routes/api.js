import axios from 'axios';
import express from 'express';
import { readFile, stat } from 'node:fs/promises';
import path, { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tableConfig } from '../config/tableConfig.js';
import { getActiveSchema } from '../middleware.js';
import { appendToWhere, knex } from '../utilities/database.js';
import {
  formatLogMsg,
  log,
  populateMetdataObjFromRequest,
} from '../utilities/logger.js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const isLocal = process.env.NODE_ENV === 'local';
const s3Bucket = process.env.CF_S3_PUB_BUCKET_ID;
const s3Region = process.env.CF_S3_PUB_REGION;
const s3BucketUrl = `https://${s3Bucket}.s3-${s3Region}.amazonaws.com`;

function logError(error, metadataObj) {
  if (isLocal) {
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

// local development: read files directly from disk
// Cloud.gov: fetch files from the public s3 bucket
async function getFile(filename) {
  return isLocal
    ? readFile(resolve(__dirname, '../', filename), 'utf8')
    : axios({
        method: 'get',
        url: `${s3BucketUrl}/${filename}`,
        timeout: 10000,
      });
}

async function getFileSize(filename) {
  return isLocal
    ? stat(resolve(__dirname, '../', filename), 'utf8').then(
        (stats) => stats.size,
      )
    : axios({
        method: 'head',
        url: `${s3BucketUrl}/${filename}`,
        timeout: 10000,
      }).then((res) => parseInt(res.headers['content-length']));
}

// local development: no further processing of strings needed
// Cloud.gov: get data from responses
function parseResponse(res) {
  if (Array.isArray(res)) {
    return isLocal ? res.map((r) => JSON.parse(r)) : res.map((r) => r.data);
  } else {
    return isLocal ? JSON.parse(res) : res.data;
  }
}

async function queryColumnValues(profile, column, params, schema) {
  const parsedParams = {
    text: params.text ?? '',
    direction: params.direction ?? null,
    filters: params.filters ?? {},
    limit: params.limit ?? null,
  };

  // get columns for where clause
  const columnsForFilter = [];
  profile.columns.forEach((col) => {
    if (parsedParams.filters.hasOwnProperty(col.alias)) {
      columnsForFilter.push(col.name);
    }
  });

  // search through tableconfig.materializedViews to see if the column
  // we need is in here
  const materializedView = profile.materializedViews.find((mv) => {
    for (const col of columnsForFilter.concat(column.name)) {
      if (!mv.columns.find((mvCol) => mvCol.name === col)) return;
    }
    return mv;
  });

  // query table directly if a suitable materialized view was not found
  const query = knex
    .withSchema(schema)
    .from(materializedView ? materializedView.name : profile.tableName)
    .column(column.name)
    .whereNotNull(column.name)
    .distinctOn(column.name)
    .orderBy(column.name, parsedParams.direction ?? 'asc')
    .select();

  // build where clause of the query
  profile.columns.forEach((col) => {
    appendToWhere(query, col.name, parsedParams.filters[col.alias]);
  });

  if (parsedParams.text) {
    if (column.type === 'numeric' || column.type === 'timestamptz') {
      query.whereRaw('CAST(?? as TEXT) ILIKE ?', [
        column.name,
        `%${parsedParams.text}%`,
      ]);
    } else {
      query.whereILike(column.name, `%${parsedParams.text}%`);
    }
  }

  if (parsedParams.limit) query.limit(parsedParams.limit);

  return await query;
}

export default function (app, basePath) {
  const router = express.Router();

  router.use(getActiveSchema);

  // --- get static content from S3
  router.get('/lookupFiles', (req, res) => {
    const metadataObj = populateMetdataObjFromRequest(req);

    // NOTE: static content files found in `app/server/app/content/` directory
    const filenames = [
      'content/config/services.json',
      'content/alerts/config.json',
      'content-etl/glossary.json',
      'content/config/parameters.json',
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
          services: data[0],
          alertsConfig: data[1],
          glossary: data[2],
          parameters: data[3],
        };
      });

    const directories = ['content-etl/domainValues'];

    const directoryPromises = Promise.all(
      directories.map((directory) => {
        return getFile(`${directory}/index.json`).then((stringOrResponse) => {
          const dirFiles = parseResponse(stringOrResponse);
          return Promise.all(
            dirFiles.map((dirFile) => {
              return getFile(`${directory}/${dirFile}`);
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
        });
      }),
    ).then((data) => {
      return {
        domainValues: data[0],
      };
    });

    Promise.all([filePromises, directoryPromises])
      .then((data) => res.json({ ...data[0], ...data[1] }))
      .catch((error) => {
        logError(error, metadataObj);

        return res
          .status(error?.response?.status || 500)
          .json({ message: 'Error getting static content from S3 bucket' });
      });
  });

  // --- get static content from S3
  router.get('/getFile/:path*', (req, res) => {
    // get the filepath from the url and trim the leading forward slash
    const filepath = req.params[0].slice(1);
    const s3Bucket = process.env.CF_S3_PUB_BUCKET_ID;
    const s3Region = process.env.CF_S3_PUB_REGION;
    const metadataObj = populateMetdataObjFromRequest(req);

    const s3BucketUrl = `https://${s3Bucket}.s3-${s3Region}.amazonaws.com`;

    // local development: read files directly from disk
    // Cloud.gov: fetch files from the public s3 bucket
    (isLocal
      ? readFile(resolve(__dirname, '../content', filepath))
      : axios({
          method: 'get',
          url: `${s3BucketUrl}/content/${filepath}`,
          timeout: 10000,
          responseType: 'arraybuffer',
        })
    )
      .then((stringsOrResponses) => {
        // set the headers for the file
        const filename = filepath.split('/').pop();
        const format = filename.split('.').pop();
        if (format) {
          res.setHeader('Content-disposition', `inline; filename=${filename}`);
          res.setHeader('Content-type', `application/${format}`);
        }

        // local development: return root of response
        // Cloud.gov: return data value of response
        return res.send(isLocal ? stringsOrResponses : stringsOrResponses.data);
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

  // create post requests
  router.post('/:profile/values/:column', function (req, res) {
    const profile = tableConfig[req.params.profile];
    if (!profile) {
      return res
        .status(404)
        .json({ message: 'The requested profile does not exist' });
    }

    const column = profile.columns.find(
      (col) => col.alias === req.params.column,
    );
    if (!column) {
      return res.status(404).json({
        message: 'The requested column does not exist on the selected profile',
      });
    }

    queryColumnValues(profile, column, req.body, req.activeSchema)
      .then((values) =>
        res.status(200).json(values.map((value) => value[column.name])),
      )
      .catch((error) => {
        log.error(
          `Failed to get values for the "${column.name}" column from the "${profile.tableName}" table: ${error}`,
        );
        res.status(500).send('Error! ' + error);
      });
  });

  router.get('/nationalDownloads', async (req, res) => {
    const metadataObj = populateMetdataObjFromRequest(req);

    const baseDir = 'national-downloads';

    const [latestRes, profileStats] = await Promise.all([
      getFile(`${baseDir}/latest.json`).catch((err) => {
        logError(err, metadataObj);
      }),

      knex
        .withSchema('logging')
        .column({
          profileName: 'profile_name',
          numRows: 'num_rows',
          timestamp: 'last_refresh_end_time',
        })
        .from('mv_profile_stats')
        .where('schema_name', req.activeSchema)
        .select()
        .catch((err) => {
          logError(err, metadataObj);
        }),
    ]);

    if (!latestRes || !profileStats)
      return res
        .status(500)
        .json({ message: 'Error getting national downloads data' });

    const data = {};

    const latest = parseInt(parseResponse(latestRes).julian);

    await Promise.all([
      ...Object.entries(tableConfig).map(async ([profile, config]) => {
        const basename = config.tableName;
        const filename = `${baseDir}/${latest}/${basename}.csv.zip`;
        try {
          const filesize = await getFileSize(filename);
          const stats = profileStats.find(
            (p) => p.profileName === config.tableName,
          );
          if (!stats) return;

          data[profile] = {
            numRows: stats.numRows,
            size: filesize,
            timestamp: stats.timestamp,
            url: `${s3BucketUrl}/${filename}`,
          };
        } catch (err) {
          logError(err, metadataObj);
        }
      }),
    ]);

    res.status(200).json(data);
  });

  app.use(`${basePath}api`, router);
}
