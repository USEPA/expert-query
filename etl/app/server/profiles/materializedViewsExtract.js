import axios from 'axios';
import crypto from 'crypto';
import Excel from 'exceljs';
import { createWriteStream, mkdirSync } from 'fs';
import https from 'https';
import Papa from 'papaparse';
import path, { resolve } from 'path';
import { setTimeout } from 'timers/promises';
import { fileURLToPath } from 'url';
import util from 'util';
import zlib from 'zlib';
// utils
import { createS3Stream } from '../s3.js';
import { getEnvironment } from '../utilities/environment.js';
import { logger as log } from '../utilities/logger.js';

const setImmediatePromise = util.promisify(setImmediate);

const environment = getEnvironment();

export function createPipeline(tableName) {
  // create zip streams
  const outputJson = zlib.createGzip();
  const outputCsv = zlib.createGzip();
  const outputTsv = zlib.createGzip();
  const outputXlsx = zlib.createGzip();

  // create output streams
  let writeStreamJson, writeStreamCsv, writeStreamTsv, writeStreamXlsx;
  if (environment.isLocal) {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const subFolderPath = resolve(
      __dirname,
      `../../../../app/server/app/content-etl/national-downloads/new`,
    );

    // create the sub folder if it doesn't already exist
    mkdirSync(subFolderPath, { recursive: true });

    writeStreamJson = createWriteStream(
      `${subFolderPath}/${tableName}.json.gz`,
    );
    writeStreamCsv = createWriteStream(`${subFolderPath}/${tableName}.csv.gz`);
    writeStreamTsv = createWriteStream(`${subFolderPath}/${tableName}.tsv.gz`);
    writeStreamXlsx = createWriteStream(
      `${subFolderPath}/${tableName}.xlsx.gz`,
    );

    outputJson.pipe(writeStreamJson);
    outputCsv.pipe(writeStreamCsv);
    outputTsv.pipe(writeStreamTsv);
    outputXlsx.pipe(writeStreamXlsx);
  } else {
    writeStreamJson = createS3Stream({
      contentType: 'application/gzip',
      filePath: `national-downloads/new/${tableName}.json.gz`,
      stream: outputJson,
    });

    writeStreamCsv = createS3Stream({
      contentType: 'application/gzip',
      filePath: `national-downloads/new/${tableName}.csv.gz`,
      stream: outputCsv,
    });

    writeStreamTsv = createS3Stream({
      contentType: 'application/gzip',
      filePath: `national-downloads/new/${tableName}.tsv.gz`,
      stream: outputTsv,
    });

    writeStreamXlsx = createS3Stream({
      contentType: 'application/gzip',
      filePath: `national-downloads/new/${tableName}.xlsx.gz`,
      stream: outputXlsx,
    });
  }

  // create workbook
  const workbook = new Excel.stream.xlsx.WorkbookWriter({
    stream: outputXlsx,
    useStyles: true,
  });

  const worksheet = workbook.addWorksheet('data');

  return {
    csv: {
      fileStream: writeStreamCsv,
      zipStream: outputCsv,
    },
    tsv: {
      fileStream: writeStreamTsv,
      zipStream: outputTsv,
    },
    json: {
      fileStream: writeStreamJson,
      zipStream: outputJson,
    },
    xlsx: {
      fileStream: writeStreamXlsx,
      workbook,
      worksheet,
      zipStream: outputXlsx,
    },
  };
}

export async function extract(profileName, s3Config, next = 0, retryCount = 0) {
  const chunkSize = s3Config.config.chunkSize;

  const url =
    `${s3Config.services.materializedViews}/${profileName}` +
    `?p_limit=${chunkSize}&p_offset=${next}`;

  const res = await axios.get(url, {
    headers: { 'API-key': process.env.MV_API_KEY },
    httpsAgent: new https.Agent({
      // TODO - Remove this when ordspub supports OpenSSL 3.0
      // This is needed to allow node 18 to talk with ordspub, which does
      //   not support OpenSSL 3.0
      secureOptions: crypto.constants.SSL_OP_LEGACY_SERVER_CONNECT,
    }),
  });
  if (res.status !== 200) {
    log.info(`Non-200 response returned from ${profileName} service, retrying`);
    if (retryCount < s3Config.config.retryLimit) {
      await setTimeout(s3Config.config.retryIntervalSeconds * 1000);
      return await extract(s3Config, next, retryCount + 1);
    } else {
      throw new Error('Retry count exceeded');
    }
  }

  const data = res.data.records;
  return { data: data.length ? data : null, next: next + chunkSize };
}

export async function transformToZip(rows, pipeline, first) {
  let jsonStr = first ? '[' : '';
  await rows.forEach(async (row, idx) => {
    // json
    if (!first || idx > 0) jsonStr += ',\n';
    jsonStr += JSON.stringify(row);

    // xlsx
    if (first && idx === 0) {
      pipeline.xlsx.worksheet.columns = Object.keys(row).map((key) => {
        return { header: key, key };
      });
    }
    pipeline.xlsx.worksheet.addRow(row).commit();
    await setImmediatePromise();
  });

  // json transform
  pipeline.json.zipStream.write(jsonStr);

  // csv transform
  let unparsedData = Papa.unparse(JSON.stringify(rows), {
    delimiter: ',',
    header: first,
  });
  pipeline.csv.zipStream.write(unparsedData);
  pipeline.csv.zipStream.write('\n');

  // tsv transform
  unparsedData = Papa.unparse(JSON.stringify(rows), {
    delimiter: '\t',
    header: first,
  });
  pipeline.tsv.zipStream.write(unparsedData);
  pipeline.tsv.zipStream.write('\n');
}
