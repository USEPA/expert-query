import express from 'express';
import request from 'supertest';
import { jest } from '@jest/globals';

async function loadApiRoutes({
  environment = {},
  axiosImpl,
  queryResult = [],
  privateConfig = { tableConfig: {} },
} = {}) {
  jest.resetModules();

  const axios = axiosImpl || jest.fn();
  const queryPool = jest.fn().mockResolvedValue(queryResult);
  const getPrivateConfig = jest.fn().mockResolvedValue(privateConfig);
  const logError = jest.fn();
  const logDebug = jest.fn();

  const knex = {
    withSchema: jest.fn().mockReturnThis(),
    column: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
  };

  await jest.unstable_mockModule('axios', () => ({ default: axios }));

  await jest.unstable_mockModule('../app/middleware.js', () => ({
    getActiveSchema: (req, res, next) => {
      req.activeSchema = 'schema_1';
      next();
    },
  }));

  await jest.unstable_mockModule('../app/utilities/database.js', () => ({
    knex,
    queryPool,
  }));

  await jest.unstable_mockModule('../app/utilities/environment.js', () => ({
    getEnvironment: () => ({
      isLocal: false,
      isTest: false,
      isDevelopment: false,
      isStaging: false,
      isProduction: false,
      ...environment,
    }),
  }));

  await jest.unstable_mockModule('../app/utilities/s3.js', () => ({
    getPrivateConfig,
  }));

  await jest.unstable_mockModule('../app/utilities/logger.js', () => ({
    formatLogMsg: (metadataObj, message) => ({ metadataObj, message }),
    log: {
      error: logError,
      debug: logDebug,
    },
    populateMetdataObjFromRequest: () => ({ requestId: 'request-id' }),
  }));

  const { default: apiRoutes } = await import('../app/routes/api.js');

  const app = express();
  apiRoutes(app, '/');

  return {
    app,
    mocks: {
      axios,
      queryPool,
      getPrivateConfig,
      logError,
      logDebug,
    },
  };
}

describe('API route tests', () => {
  const originalPubBucket = process.env.CF_S3_PUB_BUCKET_ID;
  const originalPubRegion = process.env.CF_S3_PUB_REGION;

  beforeEach(() => {
    process.env.CF_S3_PUB_BUCKET_ID = 'eq-public';
    process.env.CF_S3_PUB_REGION = 'us-gov-west-1';
  });

  afterEach(() => {
    process.env.CF_S3_PUB_BUCKET_ID = originalPubBucket;
    process.env.CF_S3_PUB_REGION = originalPubRegion;
    jest.restoreAllMocks();
    jest.resetModules();
  });

  test('GET /api/openapi filters servers to production in prod environment', async () => {
    const axios = jest.fn().mockResolvedValue({
      data: {
        servers: [
          { description: 'Production', url: 'https://api.example.gov' },
          { description: 'Development', url: 'https://api-dev.example.gov' },
        ],
      },
    });

    const { app } = await loadApiRoutes({
      environment: { isProduction: true },
      axiosImpl: axios,
    });

    const response = await request(app).get('/api/openapi').expect(200);

    expect(response.body.servers).toEqual([
      { description: 'Production', url: 'https://api.example.gov' },
    ]);
  });

  test('GET /api/openapi returns upstream status code on S3 request failure', async () => {
    const error = {
      response: {
        status: 503,
        config: {
          method: 'get',
          url: 'https://s3.invalid/openapi',
        },
      },
      toJSON: () => ({ message: 'network failure' }),
    };
    const axios = jest.fn().mockRejectedValue(error);

    const { app } = await loadApiRoutes({ axiosImpl: axios });

    const response = await request(app).get('/api/openapi').expect(503);

    expect(response.body).toEqual({
      message: 'Error getting static content from S3 bucket',
    });
  });

  test('GET /api/lookupFiles returns 500 when metadata fetch fails', async () => {
    const axios = jest.fn().mockResolvedValue({
      data: {
        services: {},
      },
    });

    const { app, mocks } = await loadApiRoutes({
      axiosImpl: axios,
      queryResult: undefined,
      privateConfig: {},
    });

    mocks.queryPool.mockRejectedValueOnce(new Error('query failed'));

    const response = await request(app).get('/api/lookupFiles').expect(500);

    expect(response.body).toEqual({
      message: 'Error getting static content from S3 bucket',
    });
  });
});
