import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { readFile } from 'node:fs/promises';
import path, { resolve } from 'node:path';
import { getEnvironment } from '../utilities/environment.js';
import { log } from '../utilities/logger.js';
import { fileURLToPath } from 'url';

let privateConfig = null;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const { isLocal, isTest, isDevelopment, isStaging } = getEnvironment();

// Setups the config for the s3 bucket (default config is public S3 bucket)
export function getS3Client({
  accessKeyId = process.env.CF_S3_PUB_ACCESS_KEY,
  secretAccessKey = process.env.CF_S3_PUB_SECRET_KEY,
  region = process.env.CF_S3_PUB_REGION,
} = {}) {
  return new S3Client({
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    region,
  });
}

// Loads etl config from private S3 bucket
export async function getPrivateConfig() {
  // exit early if we already loaded this
  if (privateConfig) return privateConfig;

  // NOTE: static content files found in `etl/app/content-private/` directory
  const filenames = ['tableConfig.json'];
  const isDevOrStage = isDevelopment || isStaging;
  if (isDevOrStage) {
    filenames.push('approvedUsersDevStage.json');
  }

  try {
    // setup private s3 bucket
    let s3;
    if (!isLocal && !isTest) {
      s3 = getS3Client({
        accessKeyId: process.env.CF_S3_PRIV_ACCESS_KEY,
        secretAccessKey: process.env.CF_S3_PRIV_SECRET_KEY,
        region: process.env.CF_S3_PRIV_REGION,
      });
    }

    const promises = [];
    for (const filename of filenames) {
      // local development: read files directly from disk
      // Cloud.gov: fetch files from the public s3 bucket
      if (isLocal || isTest) {
        promises.push(
          readFile(
            resolve(__dirname, '../../../../etl/app/content-private', filename),
            'utf8',
          ),
        );
      } else {
        const command = new GetObjectCommand({
          Bucket: process.env.CF_S3_PRIV_BUCKET_ID,
          Key: `content-private/${filename}`,
        });
        promises.push((await s3.send(command)).Body.transformToString());
      }
    }

    const stringsOrResponses = await Promise.all(promises);

    // convert to json
    const parsedData = stringsOrResponses.map((stringOrResponse) =>
      JSON.parse(stringOrResponse),
    );

    privateConfig = {
      tableConfig: parsedData[0],
    };
    if (isDevOrStage) privateConfig['approvedUsers'] = parsedData[1];

    return privateConfig;
  } catch (err) {
    log.warn('Error loading config from private S3 bucket');
  }
}
