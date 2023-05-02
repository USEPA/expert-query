import AWS from 'aws-sdk';
import axios from 'axios';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { readFile } from 'node:fs/promises';
import path, { resolve } from 'node:path';
import { setTimeout } from 'timers/promises';
import { getEnvironment } from './utilities/environment.js';
import { log } from './utilities/logger.js';
import { fileURLToPath } from 'url';
import { tableConfig } from '../config/tableConfig.js';
import {
  endConnPool,
  getActiveSchema,
  startConnPool,
  updateEtlStatus,
} from './database.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const environment = getEnvironment();

// Setups the config for the s3 bucket (default config is public S3 bucket)
function setAwsConfig({
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
}

// Loads etl config from private S3 bucket
export async function loadConfig() {
  // NOTE: static content files found in `etl/app/content-private/` directory
  const filenames = [
    'config.json',
    'services.json',
    'domainValueMappings.json',
  ];

  try {
    // setup private s3 bucket
    let s3;
    if (!environment.isLocal) {
      setAwsConfig({
        accessKeyId: process.env.CF_S3_PRIV_ACCESS_KEY,
        secretAccessKey: process.env.CF_S3_PRIV_SECRET_KEY,
        region: process.env.CF_S3_PRIV_REGION,
      });

      s3 = new AWS.S3({ apiVersion: '2006-03-01' });
    }

    const promises = filenames.map((filename) => {
      // local development: read files directly from disk
      // Cloud.gov: fetch files from the public s3 bucket
      return environment.isLocal
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
      environment.isLocal
        ? JSON.parse(stringOrResponse)
        : JSON.parse(stringOrResponse.Body.toString('utf-8')),
    );

    return {
      config: parsedData[0],
      services: parsedData[1],
      domainValueMappings: parsedData[2],
    };
  } catch (err) {
    log.warn('Error loading config from private S3 bucket');
  }
}

// Uploads file to public S3 bucket
export async function uploadFilePublic(
  filePath,
  fileToUpload,
  subFolder = 'content-etl',
) {
  try {
    // local development: write files directly to disk on the client app side
    // Cloud.gov: upload files to the public s3 bucket
    if (environment.isLocal) {
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
      setAwsConfig();

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

// Retries an HTTP request in response to a failure
async function retryRequest(serviceName, count, s3Config, callback) {
  log.info(`Non-200 response returned from ${serviceName} service, retrying`);
  if (count < s3Config.config.retryLimit) {
    await setTimeout(s3Config.config.retryIntervalSeconds * 1000);
    return callback(s3Config, count + 1);
  } else {
    throw new Error(`Sync ${serviceName} retry count exceeded`);
  }
}

// Sync the domain values corresponding to a single domain name
function fetchSingleDomain(name, mapping, pool) {
  return async function (s3Config, retryCount = 0) {
    try {
      const res = await axios.get(
        `${s3Config.services.domainValues}?domainName=${mapping.domainName}`,
        { timeout: s3Config.config.webServiceTimeout },
      );

      if (res.status !== 200) {
        return await retryRequest(
          `Domain Values (${mapping.domainName})`,
          retryCount,
          s3Config,
          fetchSingleDomain(name, mapping, pool),
        );
      }

      const valuesAdded = new Set();
      let values = res.data
        .map((value) => {
          return {
            label: value[mapping.labelField ?? 'name'],
            value: value[mapping.valueField ?? 'code'],
          };
        })
        .filter((item) => {
          return valuesAdded.has(item.value)
            ? false
            : valuesAdded.add(item.value);
        });

      // Add any column values not represented by domain values service
      for (const colAlias of mapping.columns) {
        const colValues = await queryColumnValues(pool, colAlias);
        colValues.forEach((value) => {
          if (valuesAdded.has(value)) return;
          // Warn about mismatch, since value added here may not have the desired label
          log.warn(
            `Column value missing from "${mapping.domainName}" domain service: ${value}`,
          );
          valuesAdded.add(value);
          values.push({ label: value, value });
        });
      }

      const output = {};
      output[name] = values;
      await uploadFilePublic(
        `${name}.json`,
        JSON.stringify(output),
        'content-etl/domainValues',
      );
    } catch (errOuter) {
      try {
        return await retryRequest(
          `Domain Values (${mapping.domainName})`,
          retryCount,
          s3Config,
          fetchSingleDomain(name, mapping, pool),
        );
      } catch (err) {
        log.warn(`Sync Domain Values (${mapping.domainName}) failed! ${err}`);
        throw err;
      }
    }
  };
}

export async function syncDomainValues(s3Config, poolParam = null) {
  const pool = poolParam ? poolParam : startConnPool();
  await updateEtlStatus(pool, 'domain_values', 'running');

  try {
    const fetchPromises = [];
    fetchPromises.push(fetchStateValues(pool)(s3Config));

    Object.entries(s3Config.domainValueMappings).forEach(([name, mapping]) => {
      fetchPromises.push(fetchSingleDomain(name, mapping, pool)(s3Config));
    });

    await Promise.all(fetchPromises);
    const filenames = [
      'state.json',
      ...Object.keys(s3Config.domainValueMappings).map(
        (domain) => `${domain}.json`,
      ),
    ];
    await uploadFilePublic(
      'index.json',
      JSON.stringify(filenames),
      'content-etl/domainValues',
    );

    await updateEtlStatus(pool, 'domain_values', 'success');
  } catch (err) {
    log.error(`Sync Domain Values failed! ${err}`);
    await updateEtlStatus(pool, 'domain_values', 'failed');
  } finally {
    if (!poolParam) await endConnPool(pool);
  }
}

// Sync state codes and labels from the states service
function fetchStateValues(pool) {
  return async function (s3Config, retryCount = 0) {
    try {
      const res = await axios.get(s3Config.services.stateCodes, {
        timeout: s3Config.config.webServiceTimeout,
      });

      if (res.status !== 200) {
        return await retryRequest(
          'States',
          retryCount,
          s3Config,
          fetchStateValues(pool),
        );
      }

      const valuesAdded = new Set();
      const states = res.data.data
        .map((state) => {
          return {
            label: state.name,
            value: state.code,
          };
        })
        .filter((item) => {
          return valuesAdded.has(item.value)
            ? false
            : valuesAdded.add(item.value);
        });

      const colValues = await queryColumnValues(pool, 'state');
      colValues.forEach((value) => {
        if (valuesAdded.has(value)) return;
        // Warn about mismatch, since value added here will not have a nice label
        log.warn(`Column value missing from "States" domain service: ${value}`);
        valuesAdded.add(value);
        states.push({ label: value, value });
      });

      const output = {};
      output.state = states;
      await uploadFilePublic(
        'state.json',
        JSON.stringify(output),
        'content-etl/domainValues',
      );
    } catch (errOuter) {
      try {
        return await retryRequest(
          'States',
          retryCount,
          s3Config,
          fetchStateValues(pool),
        );
      } catch (err) {
        log.warn(`Sync States failed! ${err}`);
      }
    }
  };
}

export async function syncGlossary(s3Config, retryCount = 0) {
  const pool = startConnPool();
  await updateEtlStatus(pool, 'glossary', 'running');

  try {
    // query the glossary service
    const res = await axios.get(s3Config.services.glossaryURL, {
      headers: {
        authorization: `basic ${process.env.GLOSSARY_AUTH}`,
      },
      timeout: s3Config.config.webServiceTimeout,
    });

    // check response, retry on failure
    if (res.status !== 200) {
      return await retryRequest('Glossary', retryCount, s3Config, syncGlossary);
    }

    // build the glossary json output
    const terms = [];
    res.data.forEach((term) => {
      if (term.ActiveStatus === 'Deleted') return;

      let definition = '';
      let definitionHtml = '';
      term.Attributes.forEach((attr) => {
        if (attr.Name === 'Def1') definition = attr.Value;
        if (attr.Name === 'Editorial Note') definitionHtml = attr.Value;
      });

      terms.push({
        term: term.Name,
        definition,
        definitionHtml,
      });
    });

    // upload the glossary.json file
    await uploadFilePublic('glossary.json', JSON.stringify(terms));

    await updateEtlStatus(pool, 'glossary', 'success');
  } catch (errOuter) {
    try {
      return await retryRequest('Glossary', retryCount, s3Config, syncGlossary);
    } catch (err) {
      log.warn(`Sync Glossary failed! ${err}`);
      await updateEtlStatus(pool, 'glossary', 'failed');
    }
  } finally {
    await endConnPool(pool);
  }
}

// Delete directory on S3
export async function deleteDirectory({ directory, dirsToIgnore }) {
  try {
    if (environment.isLocal) {
      const dirPath = resolve(
        __dirname,
        `../../../app/server/app/content-etl/${directory}`,
      );

      // get all contents
      const items = readdirSync(dirPath);

      if (items.length === 0) return;

      items.forEach((item) => {
        if (dirsToIgnore.includes(item)) return;

        const fullPath = resolve(dirPath, item);

        // exit early if the source path doesn't exist
        if (!existsSync(fullPath)) return;

        // remove the directory
        rmSync(fullPath, { recursive: true });
      });
    } else {
      // setup public s3 bucket
      setAwsConfig();

      const s3 = new AWS.S3({ apiVersion: '2006-03-01' });

      // prepend directory to dirsToIgnore
      const fullPathDirsToIgnore = dirsToIgnore.map((item) => {
        return `${directory}/${item}`;
      });

      // get a list of files in the directory
      const data = await s3
        .listObjects({
          Bucket: process.env.CF_S3_PUB_BUCKET_ID,
          Prefix: directory,
        })
        .promise();

      data.Contents.forEach(async (file) => {
        // skip file if in dirsToIgnore
        if (
          fullPathDirsToIgnore.includes(file.Key) ||
          fullPathDirsToIgnore.includes(
            file.Key.substring(0, file.Key.lastIndexOf('/')),
          )
        ) {
          return;
        }

        // delete file from S3
        await s3
          .deleteObject({
            Bucket: process.env.CF_S3_PUB_BUCKET_ID,
            Key: file.Key,
          })
          .promise();
      });
    }
  } catch (err) {
    log.warn(`Error deleting directory from "${directory}": ${err}`);
  }
}

async function queryColumnValues(pool, colAlias) {
  const values = new Set();
  try {
    const schemaName = await getActiveSchema(pool);
    if (!schemaName) return [];
    await Promise.all(
      Object.values(tableConfig).map(async (config) => {
        const colConfig = config.columns.find((col) => col.alias === colAlias);
        if (!colConfig) return;
        const materializedView = config.materializedViews.find((mv) =>
          mv.columns.some((col) => col.name === colConfig.name),
        );
        const res = await pool.query(
          `SELECT DISTINCT "${colConfig.name}" FROM "${schemaName}"."${
            materializedView?.name ?? config.tableName
          }" WHERE "${colConfig.name}" IS NOT NULL`,
        );
        res.rows.forEach((row) => {
          values.add(row[colConfig.name]);
        });
      }),
    );
  } catch (err) {
    log.warn(`Error querying values for column "${colAlias}"! ${err}`);
  }
  return Array.from(values);
}

export async function readS3File({ bucketInfo, path }) {
  setAwsConfig({
    accessKeyId: bucketInfo.accessKeyId,
    secretAccessKey: bucketInfo.secretAccessKey,
    region: bucketInfo.region,
  });
  const s3 = new AWS.S3({ apiVersion: '2006-03-01' });

  const res = await s3
    .getObject({
      Bucket: bucketInfo.bucketId,
      Key: path,
    })
    .promise();

  const parsedData = JSON.parse(res.Body.toString('utf-8'));

  return parsedData;
}
