import express from 'express';
import request from 'supertest';
import { jest } from '@jest/globals';

async function loadHealthRoutes({
  environment = {},
  queryResult = { glossary: 'complete' },
  queryError,
  statMTime = new Date(),
} = {}) {
  jest.resetModules();

  const queryPool = queryError
    ? jest.fn().mockRejectedValue(queryError)
    : jest.fn().mockResolvedValue(queryResult);

  const knex = {
    withSchema: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
  };

  const statSync = jest.fn().mockReturnValue({
    mtime: statMTime,
  });

  const logError = jest.fn();

  await jest.unstable_mockModule('node:fs', () => ({
    statSync,
  }));

  await jest.unstable_mockModule('../app/middleware.js', () => ({
    protectRoutes: (req, res, next) => next(),
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
      isLocal: true,
      isTest: false,
      ...environment,
    }),
  }));

  await jest.unstable_mockModule('../app/utilities/s3.js', () => ({
    getS3Client: jest.fn(),
  }));

  await jest.unstable_mockModule('../app/utilities/logger.js', () => ({
    formatLogMsg: (metadataObj, message) => ({ metadataObj, message }),
    log: {
      error: logError,
    },
    populateMetdataObjFromRequest: () => ({ requestId: 'request-id' }),
  }));

  const { default: healthRoutes } = await import('../app/routes/health.js');
  const app = express();
  healthRoutes(app, '/');

  return {
    app,
    mocks: {
      queryPool,
      statSync,
      logError,
    },
  };
}

describe('Health route tests', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.resetModules();
  });

  test('GET /api/health returns UP', async () => {
    const { app } = await loadHealthRoutes();

    const response = await request(app).get('/api/health').expect(200);

    expect(response.body).toEqual({ status: 'UP' });
  });

  test('GET /api/health/etlGlossary returns FAILED-DB when db status failed', async () => {
    const { app } = await loadHealthRoutes({
      queryResult: { glossary: 'failed' },
    });

    const response = await request(app)
      .get('/api/health/etlGlossary')
      .expect(200);

    expect(response.body).toEqual({ status: 'FAILED-DB' });
  });

  test('GET /api/health/etlGlossary returns FAILED-TIME for old glossary file', async () => {
    const oldMTime = new Date(Date.now() - 26 * 60 * 60 * 1000);
    const { app } = await loadHealthRoutes({ statMTime: oldMTime });

    const response = await request(app)
      .get('/api/health/etlGlossary')
      .expect(200);

    expect(response.body).toEqual({ status: 'FAILED-TIME' });
  });

  test('GET /api/health/etlGlossary returns UP for recently updated glossary file', async () => {
    const recentMTime = new Date(Date.now() - 60 * 60 * 1000);
    const { app } = await loadHealthRoutes({ statMTime: recentMTime });

    const response = await request(app)
      .get('/api/health/etlGlossary')
      .expect(200);

    expect(response.body).toEqual({ status: 'UP' });
  });

  test('GET /api/health/etlGlossary returns 500 on exception', async () => {
    const { app, mocks } = await loadHealthRoutes({
      queryError: new Error('db failure'),
    });

    const response = await request(app)
      .get('/api/health/etlGlossary')
      .expect(500);

    expect(mocks.logError).toHaveBeenCalledTimes(1);
    expect(response.text).toContain('Error!');
  });
});
