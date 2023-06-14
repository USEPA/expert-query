import axios from 'axios';
import { setTimeout } from 'timers/promises';
import { log } from './logger.js';

// determine which environment we are in
export function getEnvironment() {
  let isLocal = false;
  let isDevelopment = false;
  let isStaging = false;
  let isProduction = false;

  if (process.env.NODE_ENV) {
    isLocal = 'local' === process.env.NODE_ENV.toLowerCase();
    isDevelopment = 'development' === process.env.NODE_ENV.toLowerCase();
    isStaging = 'staging' === process.env.NODE_ENV.toLowerCase();
    isProduction = 'production' === process.env.NODE_ENV.toLowerCase();
  }

  return {
    isLocal,
    isDevelopment,
    isStaging,
    isProduction,
  };
}

// Retries an HTTP request in response to a failure
export async function retryRequest({
  url,
  s3Config,
  serviceName,
  callOptions,
  retryInterval = s3Config.config.retryIntervalSeconds,
  retryCount = 0,
}) {
  if (retryCount < s3Config.config.retryLimit) {
    log.info(`Non-200 response returned from ${serviceName} service, retrying`);
    await setTimeout(retryInterval * 1000);
    return await fetchRetry({
      url,
      s3Config,
      serviceName,
      callOptions,
      retryInterval,
      retryCount: retryCount + 1,
    });
  } else {
    throw new RetryCountExceededException(serviceName);
  }
}

export async function fetchRetry({
  url,
  s3Config,
  serviceName,
  callOptions,
  retryInterval = s3Config.config.retryIntervalSeconds,
  retryCount = 0,
}) {
  try {
    const res = await axios.get(url, callOptions);
    if (res.status !== 200) {
      return await retryRequest({
        url,
        s3Config,
        serviceName,
        callOptions,
        retryInterval,
        retryCount,
      });
    }
    return res;
  } catch (ex) {
    if (ex instanceof RetryCountExceededException) throw ex;
    return await retryRequest({
      url,
      s3Config,
      serviceName,
      callOptions,
      retryInterval,
      retryCount,
    });
  }
}

class RetryCountExceededException extends Error {
  constructor(serviceName) {
    super();
    this.code = 429;
    this.message = `${serviceName} request retry count exceeded`;
  }
}
