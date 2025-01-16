import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { readFile } from 'node:fs/promises';
import path, { resolve } from 'node:path';
import { fetchRetry, getEnvironment } from './utilities/index.js';
import { log } from './utilities/logger.js';
import { fileURLToPath } from 'url';
import {
  endConnPool,
  getActiveSchema,
  startConnPool,
  updateEtlStatus,
} from './database.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const { isLocal } = getEnvironment();

// Setups the config for the s3 bucket (default config is public S3 bucket)
function getS3Client({
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
export async function loadConfig() {
  // NOTE: static content files found in `etl/app/content-private/` directory
  const filenames = [
    'config.json',
    'domainValueMappings.json',
    'services.json',
    'tableConfig.json',
  ];

  try {
    // setup private s3 bucket
    let s3;
    if (!isLocal) {
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
      if (isLocal) {
        promises.push(
          readFile(resolve(__dirname, '../content-private', filename), 'utf8'),
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

    return {
      config: parsedData[0],
      domainValueMappings: parsedData[1],
      services: parsedData[2],
      tableConfig: parsedData[3],
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
      const s3 = getS3Client();

      // upload the file
      const command = new PutObjectCommand({
        Bucket: process.env.CF_S3_PUB_BUCKET_ID,
        Key: `${subFolder}/${filePath}`,
        ACL: 'public-read',
        ContentType: 'application/json',
        Body: fileToUpload,
      });
      return s3.send(command);
    }
  } catch (err) {
    log.warn(`Error saving "${filePath}" to public S3 bucket`);
  }
}

// Sync the domain values corresponding to a single domain name
async function fetchSingleDomain(name, mapping, pool, s3Config) {
  const res = await fetchRetry({
    url: `${s3Config.services.domainValues}?domainName=${mapping.domainName}`,
    s3Config,
    serviceName: `Domain Values (${mapping.domainName})`,
    callOptions: { timeout: s3Config.config.webServiceTimeout },
  });

  const valuesAdded = new Set();
  let values = res.data
    .map((value) => {
      return {
        label: value[mapping.labelField ?? 'name'],
        value: value[mapping.valueField ?? 'code'],
      };
    })
    .filter((item) => {
      return valuesAdded.has(item.value) ? false : valuesAdded.add(item.value);
    });

  // Add any column values not represented by domain values service
  for (const colAlias of mapping.columns) {
    const colValues = await queryColumnValues(s3Config, pool, colAlias);
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
}

export async function syncDomainValues(s3Config, poolParam = null) {
  const pool = poolParam || startConnPool();
  await updateEtlStatus(pool, 'domain_values', 'running');

  try {
    const fetchPromises = [];
    fetchPromises.push(fetchStateValues(pool, s3Config));

    Object.entries(s3Config.domainValueMappings).forEach(([name, mapping]) => {
      fetchPromises.push(fetchSingleDomain(name, mapping, pool, s3Config));
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
async function fetchStateValues(pool, s3Config) {
  const res = await fetchRetry({
    url: s3Config.services.stateCodes,
    s3Config,
    serviceName: 'States',
    callOptions: {
      timeout: s3Config.config.webServiceTimeout,
    },
  });

  const valuesAdded = new Set();
  const states = res.data.data
    .map((state) => ({
      label: state.name,
      value: state.code,
    }))
    .filter((item) => {
      return valuesAdded.has(item.value) ? false : valuesAdded.add(item.value);
    });

  const colValues = await queryColumnValues(s3Config, pool, 'state');
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
}

export async function syncGlossary(s3Config, retryCount = 0) {
  const pool = startConnPool();
  await updateEtlStatus(pool, 'glossary', 'running');

  try {
    const res = await fetchRetry({
      url: s3Config.services.glossaryURL,
      s3Config,
      serviceName: 'Glossary',
      callOptions: {
        headers: {
          authorization: `basic ${process.env.GLOSSARY_AUTH}`,
        },
        timeout: s3Config.config.webServiceTimeout,
      },
    });

    // build the glossary json output
    const terms = {};
    res.data.forEach((term) => {
      if (term.ActiveStatus === 'Deleted') return;

      let definition = '';
      let definitionHtml = '';
      term.Attributes.forEach((attr) => {
        if (attr.Name === 'Def1') definition = attr.Value;
        if (attr.Name === 'Editorial Note') definitionHtml = attr.Value;
      });

      terms[term.Name] = {
        term: term.Name,
        definition,
        definitionHtml,
      };
    });

    // upload the glossary.json file
    await uploadFilePublic('glossary.json', JSON.stringify(terms));

    await updateEtlStatus(pool, 'glossary', 'success');
  } finally {
    await endConnPool(pool);
  }
}

// Delete directory on S3
export async function deleteDirectory({ directory, dirsToIgnore }) {
  try {
    if (isLocal) {
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
      const s3 = getS3Client();

      // prepend directory to dirsToIgnore
      const fullPathDirsToIgnore = dirsToIgnore.map((item) => {
        return `${directory}/${item}`;
      });

      // get a list of files in the directory
      const listCommand = new ListObjectsCommand({
        Bucket: process.env.CF_S3_PUB_BUCKET_ID,
        Prefix: directory,
      });
      const data = await s3.send(listCommand);

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
        const deleteCommand = new DeleteObjectCommand({
          Bucket: process.env.CF_S3_PUB_BUCKET_ID,
          Key: file.Key,
        });
        await s3.send(deleteCommand);
      });
    }
  } catch (err) {
    log.warn(`Error deleting directory from "${directory}": ${err}`);
  }
}

async function queryColumnValues(s3Config, pool, colAlias) {
  const values = new Set();
  try {
    const schemaName = await getActiveSchema(pool);
    if (!schemaName) return [];
    await Promise.all(
      Object.values(s3Config.tableConfig).map(async (config) => {
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
  let res = null;

  if (isLocal) {
    const fullPath = resolve(__dirname, `../../../app/server/app/${path}`);

    res = readFileSync(fullPath, 'utf8');
  } else {
    const s3 = getS3Client({
      accessKeyId: bucketInfo.accessKeyId,
      secretAccessKey: bucketInfo.secretAccessKey,
      region: bucketInfo.region,
    });

    const command = new GetObjectCommand({
      Bucket: bucketInfo.bucketId,
      Key: path,
    });
    res = await (await s3.send(command)).Body.transformToString();
  }

  return JSON.parse(res);
}
