import axios from 'axios';
import crypto from 'crypto';
import https from 'https';
import { logger as log } from '../utilities/logger.js';
import { setTimeout } from 'timers/promises';

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
