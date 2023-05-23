import AWS from 'aws-sdk';
import { readFile } from 'node:fs/promises';
import path, { resolve } from 'node:path';
import { getEnvironment } from '../utilities/environment.js';
import { log } from '../utilities/logger.js';
import { fileURLToPath } from 'url';

let privateConfig = null;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const environment = getEnvironment();

// Setups the config for the s3 bucket (default config is public S3 bucket)
export function getS3Bucket({
  accessKeyId = process.env.CF_S3_PUB_ACCESS_KEY,
  secretAccessKey = process.env.CF_S3_PUB_SECRET_KEY,
  region = process.env.CF_S3_PUB_REGION,
} = {}) {
  const config = new AWS.Config({
    accessKeyId,
    secretAccessKey,
    region,
  });
  AWS.config.update(config);

  return new AWS.S3({ apiVersion: '2006-03-01' });
}

// Loads etl config from private S3 bucket
export async function getPrivateConfig() {
  // exit early if we already loaded this
  if (privateConfig) return privateConfig;

  // NOTE: static content files found in `etl/app/content-private/` directory
  const filenames = [];

  const isDevOrStage = environment.isDevelopment || environment.isStaging;
  if (isDevOrStage) {
    filenames.push('approvedUsersDevStage.json');
  }

  try {
    // setup private s3 bucket
    let s3;
    if (!environment.isLocal) {
      s3 = getS3Bucket({
        accessKeyId: process.env.CF_S3_PRIV_ACCESS_KEY,
        secretAccessKey: process.env.CF_S3_PRIV_SECRET_KEY,
        region: process.env.CF_S3_PRIV_REGION,
      });
    }

    const promises = filenames.map((filename) => {
      // local development: read files directly from disk
      // Cloud.gov: fetch files from the public s3 bucket
      return environment.isLocal
        ? readFile(
            resolve(__dirname, '../../../../etl/app/content-private', filename),
            'utf8',
          )
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
      environment.isLocal
        ? JSON.parse(stringOrResponse)
        : JSON.parse(stringOrResponse.Body.toString('utf-8')),
    );

    privateConfig = {};
    if (isDevOrStage) privateConfig['approvedUsers'] = parsedData[0];

    return privateConfig;
  } catch (err) {
    log.warn('Error loading config from private S3 bucket');
  }
}
