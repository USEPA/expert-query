import AWS from 'aws-sdk';
import axios from 'axios';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path, { resolve } from 'node:path';
import { logger as log } from './utilities/logger.js';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let isLocal = false;
let isDevelopment = false;
let isStaging = false;

if (process.env.NODE_ENV) {
  isLocal = 'local' === process.env.NODE_ENV.toLowerCase();
  isDevelopment = 'development' === process.env.NODE_ENV.toLowerCase();
  isStaging = 'staging' === process.env.NODE_ENV.toLowerCase();
}

const requiredEnvVars = ['GLOSSARY_AUTH'];

if (!isLocal) {
  requiredEnvVars.push('CF_S3_PUB_ACCESS_KEY');
  requiredEnvVars.push('CF_S3_PUB_BUCKET_ID');
  requiredEnvVars.push('CF_S3_PUB_REGION');
  requiredEnvVars.push('CF_S3_PUB_SECRET_KEY');
  requiredEnvVars.push('CF_S3_PRIV_ACCESS_KEY');
  requiredEnvVars.push('CF_S3_PRIV_BUCKET_ID');
  requiredEnvVars.push('CF_S3_PRIV_REGION');
  requiredEnvVars.push('CF_S3_PRIV_SECRET_KEY');
}

requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    const message = `Required environment variable ${envVar} not found.`;
    log.error(message);
    process.exit();
  }
});

// Loads etl config from private S3 bucket
export async function loadConfig() {
  // NOTE: static content files found in `etl/app/content-private/` directory
  const filenames = ['config.json', 'services.json'];

  try {
    // setup private s3 bucket
    let s3;
    if (!isLocal) {
      let config = new AWS.Config({
        accessKeyId: process.env.CF_S3_PRIV_ACCESS_KEY,
        secretAccessKey: process.env.CF_S3_PRIV_SECRET_KEY,
        region: process.env.CF_S3_PRIV_REGION,
      });
      AWS.config.update(config);

      s3 = new AWS.S3({ apiVersion: '2006-03-01' });
    }

    const promises = filenames.map((filename) => {
      // local development: read files directly from disk
      // Cloud.gov: fetch files from the public s3 bucket
      return isLocal
        ? readFile(resolve(__dirname, '../content-private', filename), 'utf8')
        : s3
            .getObject({
              Bucket: process.env.CF_S3_PRIV_BUCKET_ID,
              Key: `content-private/${filename}`,
            })
            .promise();
    });

    const stringsOrResponses = await Promise.all(promises);

    // convert to json
    const parsedData = stringsOrResponses.map((stringOrResponse) =>
      isLocal
        ? JSON.parse(stringOrResponse)
        : JSON.parse(stringOrResponse.Body.toString('utf-8')),
    );

    return {
      config: parsedData[0],
      services: parsedData[1],
    };
  } catch (err) {
    log.warn(`Error getting static content from private S3 bucket`);
  }
}

// Uploads file to public S3 bucket
export async function uploadFilePublic(filePath, fileToUpload) {
  const subFolder = 'content-etl';

  try {
    // local development: write files directly to disk on the client app side
    // Cloud.gov: upload files to the public s3 bucket
    if (isLocal) {
      const subFolderPath = resolve(
        __dirname,
        `../../../app/server/app/${subFolder}`,
      );

      // create the sub folder if it doesn't already exist
      mkdirSync(subFolderPath, { recursive: true });

      // write the file
      writeFileSync(`${subFolderPath}/${filePath}`, fileToUpload);
    } else {
      // setup public s3 bucket
      const config = new AWS.Config({
        accessKeyId: process.env.CF_S3_PUB_ACCESS_KEY,
        secretAccessKey: process.env.CF_S3_PUB_SECRET_KEY,
        region: process.env.CF_S3_PUB_REGION,
      });
      AWS.config.update(config);

      const s3 = new AWS.S3({ apiVersion: '2006-03-01' });

      // upload the file
      await s3
        .upload({
          Bucket: process.env.CF_S3_PUB_BUCKET_ID,
          Key: `${subFolder}/${filePath}`,
          ACL: 'public-read',
          ContentType: 'application/json',
          Body: fileToUpload,
        })
        .promise();
    }
  } catch (err) {
    log.warn(`Error saving "${filePath}" to public S3 bucket`);
  }
}

export async function syncGlossary(services, retryCount = 0) {
  try {
    // query the glossary service
    const res = await axios.get(services.glossaryURL, {
      headers: {
        authorization: `basic ${process.env.GLOSSARY_AUTH}`,
      },
    });

    // check response, retry on failure
    if (res.status !== 200) {
      log.info('Non-200 response returned from Glossary service, retrying');
      if (retryCount < 5) {
        return setTimeout(
          () => syncGlossary(services, retryCount + 1),
          5 * 1000,
        );
      } else {
        throw new Error('Sync glossary retry count exceeded');
      }
    }

    // build the glossary json output
    const terms = [];
    res.data.forEach((term) => {
      if (term.ActiveStatus === 'Deleted') return;

      let definition = '';
      let definitionHtml = '';
      term.Attributes.forEach((attr) => {
        if (attr.Name === 'Def1') definition = attr.Value;
        if (attr.Name === 'Editorial Note') definition = attr.Value;
      });

      terms.push({
        term: term.Name,
        definition,
        definitionHtml,
      });
    });

    // upload the glossary.json file
    uploadFilePublic('glossary.json', JSON.stringify(terms));
  } catch (err) {
    log.warn(`Sync Glossary failed! ${err}`);
  }
}
