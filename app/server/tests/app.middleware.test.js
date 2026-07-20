import supertest from 'supertest';
import app from '../app/app.js';
import { jest } from '@jest/globals';

describe('Middleware tests', () => {
  const originalBasePath = process.env.SERVER_BASE_PATH;
  const originalEqSecret = process.env.EQ_SECRET;

  afterEach(() => {
    process.env.SERVER_BASE_PATH = originalBasePath;
    process.env.EQ_SECRET = originalEqSecret;
    jest.restoreAllMocks();
    jest.resetModules();
  });

  test('GET /api/health sets no-cache headers', async () => {
    const response = await supertest(app).get('/api/health').expect(200);

    expect(response.headers['surrogate-control']).toBe('no-store');
    expect(response.headers['cache-control']).toBe(
      'no-store, no-cache, must-revalidate, proxy-revalidate',
    );
    expect(response.headers.pragma).toBe('no-cache');
    expect(response.headers.expires).toBe('0');
  });

  test('OPTIONS /api/health is allowed by HTTP method whitelist', async () => {
    const response = await supertest(app).options('/api/health');

    expect(response.status).not.toBe(401);
  });

  test('checkClientRouteExists should allow valid client route', async () => {
    process.env.SERVER_BASE_PATH = '/csb';
    const { checkClientRouteExists } = await loadMiddleware();
    const req = createRequest({ path: '/csb/attains' });
    const res = createResponse();
    const next = jest.fn();

    checkClientRouteExists(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  test('checkClientRouteExists should return 404 for invalid route', async () => {
    const { checkClientRouteExists } = await loadMiddleware();
    const req = createRequest({ path: '/not-a-client-route' });
    const res = createResponse();
    const next = jest.fn();

    checkClientRouteExists(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.sendFile).toHaveBeenCalled();
  });

  test('getActiveSchema should set request activeSchema and call next', async () => {
    const { getActiveSchema, mocks } = await loadMiddleware({
      queryResult: { schema_name: 'prod_schema' },
    });
    const req = createRequest();
    const res = createResponse();
    const next = jest.fn();

    await getActiveSchema(req, res, next);

    expect(mocks.queryPool).toHaveBeenCalledTimes(1);
    expect(req.activeSchema).toBe('prod_schema');
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  test('getActiveSchema should return 500 when query fails', async () => {
    const { getActiveSchema, mocks } = await loadMiddleware({
      queryError: new Error('db unavailable'),
    });
    const req = createRequest();
    const res = createResponse();
    const next = jest.fn();

    await getActiveSchema(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(mocks.error).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('Error !') }),
    );
  });

  test('protectRoutes should bypass checks in local environment', async () => {
    const { protectRoutes } = await loadMiddleware({
      environment: { isLocal: true },
    });
    const req = createRequest();
    const res = createResponse();
    const next = jest.fn();

    await protectRoutes(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  test('protectRoutes should return 401 when EQ-SECRET is missing', async () => {
    process.env.EQ_SECRET = 'expected-secret';
    const { protectRoutes, mocks } = await loadMiddleware();
    const req = createRequest({ headers: {} });
    const res = createResponse();
    const next = jest.fn();

    await protectRoutes(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(mocks.warn).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
  });

  test('protectRoutes should allow request with valid secret outside dev/stage', async () => {
    process.env.EQ_SECRET = 'expected-secret';
    const { protectRoutes, mocks } = await loadMiddleware();
    const req = createRequest({
      headers: {
        'EQ-SECRET': 'expected-secret',
      },
    });
    const res = createResponse();
    const next = jest.fn();

    await protectRoutes(req, res, next);

    expect(mocks.getPrivateConfig).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  test('protectRoutes should return 500 in development when approved users are missing', async () => {
    process.env.EQ_SECRET = 'expected-secret';
    const { protectRoutes } = await loadMiddleware({
      environment: { isDevelopment: true },
      privateConfig: {},
    });
    const req = createRequest({
      headers: {
        'EQ-SECRET': 'expected-secret',
        'x-api-user-id': 'approved-user',
      },
    });
    const res = createResponse();
    const next = jest.fn();

    await protectRoutes(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Server failed to load configuration',
    });
  });

  test('protectRoutes should return 401 in development for unapproved user', async () => {
    process.env.EQ_SECRET = 'expected-secret';
    const { protectRoutes } = await loadMiddleware({
      environment: { isDevelopment: true },
      privateConfig: { approvedUsers: [{ userId: 'approved-user' }] },
    });
    const req = createRequest({
      headers: {
        'EQ-SECRET': 'expected-secret',
        'x-api-user-id': 'not-approved',
      },
    });
    const res = createResponse();
    const next = jest.fn();

    await protectRoutes(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
  });

  test('protectRoutes should allow approved user in development', async () => {
    process.env.EQ_SECRET = 'expected-secret';
    const { protectRoutes, mocks } = await loadMiddleware({
      environment: { isDevelopment: true },
      privateConfig: { approvedUsers: [{ userId: 'approved-user' }] },
    });
    const req = createRequest({
      headers: {
        'EQ-SECRET': 'expected-secret',
        'x-api-user-id': 'approved-user',
      },
    });
    const res = createResponse();
    const next = jest.fn();

    await protectRoutes(req, res, next);

    expect(mocks.getPrivateConfig).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});

function createResponse() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    sendFile: jest.fn().mockReturnThis(),
  };
}

function createRequest({ path = '/', headers = {} } = {}) {
  return {
    path,
    header: (name) => headers[name],
  };
}

async function loadMiddleware({
  environment = {},
  queryResult = { schema_name: 'logging_schema' },
  queryError,
  privateConfig = { approvedUsers: [{ userId: 'approved-user' }] },
} = {}) {
  jest.resetModules();

  const knex = {
    withSchema: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnValue('query-builder-result'),
  };

  const queryPool = queryError
    ? jest.fn().mockRejectedValue(queryError)
    : jest.fn().mockResolvedValue(queryResult);

  const getPrivateConfig = jest.fn().mockResolvedValue(privateConfig);
  const warn = jest.fn();
  const error = jest.fn();

  await jest.unstable_mockModule('../app/utilities/database.js', () => ({
    knex,
    queryPool,
  }));

  await jest.unstable_mockModule('../app/utilities/environment.js', () => ({
    getEnvironment: jest.fn().mockReturnValue({
      isLocal: false,
      isTest: false,
      isDevelopment: false,
      isStaging: false,
      ...environment,
    }),
  }));

  await jest.unstable_mockModule('../app/utilities/s3.js', () => ({
    getPrivateConfig,
  }));

  await jest.unstable_mockModule('../app/utilities/logger.js', () => ({
    formatLogMsg: jest.fn((metadataObj, message, err) => ({
      metadataObj,
      message,
      err,
    })),
    log: {
      warn,
      error,
    },
    populateMetdataObjFromRequest: jest.fn().mockReturnValue({
      traceId: 'trace-id',
    }),
  }));

  const middleware = await import('../app/middleware.js');

  return {
    ...middleware,
    mocks: {
      queryPool,
      getPrivateConfig,
      warn,
      error,
    },
  };
}
