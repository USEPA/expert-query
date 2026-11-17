import { EventEmitter } from 'node:events';
import { jest } from '@jest/globals';

// Unit tests for createStream's connection-lifecycle handling

/**
 * Mock the pool and the streaming service so the four teardown paths can be driven deterministically.
 */
async function loadCreateStream({ streamResponseImpl } = {}) {
  jest.resetModules();

  const stream = new EventEmitter();
  stream.destroy = jest.fn();

  // the client is an EventEmitter: createStream attaches client.on('error')
  const client = Object.assign(new EventEmitter(), {
    query: jest.fn().mockReturnValue(stream),
    release: jest.fn(),
  });

  const pool = { connect: jest.fn().mockResolvedValue(client) };
  const streamResponse = jest.fn(streamResponseImpl);

  jest.unstable_mockModule('../app/utilities/database.js', () => ({
    pool,
    appendToWhere: jest.fn(),
    knex: {},
    queryPool: jest.fn(),
  }));

  jest.unstable_mockModule('../app/utilities/streamingService.js', () => ({
    default: { streamResponse },
  }));

  jest.unstable_mockModule('../app/utilities/s3.js', () => ({
    getPrivateConfig: jest.fn().mockResolvedValue({ tableConfig: {} }),
    getS3Client: jest.fn(),
  }));

  jest.unstable_mockModule('../app/utilities/environment.js', () => ({
    getEnvironment: () => ({ isLocal: true, isTest: true }),
  }));

  jest.unstable_mockModule('../app/utilities/logger.js', () => ({
    formatLogMsg: jest.fn(),
    log: {
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      debug: jest.fn(),
    },
    populateMetdataObjFromRequest: jest.fn(),
  }));

  jest.unstable_mockModule('../app/middleware.js', () => ({
    getActiveSchema: (_req, _res, next) => next(),
    protectRoutes: (_req, _res, next) => next(),
  }));

  // the real QueryStream opens a cursor; the mocked client.query ignores it
  jest.unstable_mockModule('pg-query-stream', () => ({
    default: class QueryStream {
      constructor(text, values, config) {
        this.text = text;
        this.values = values;
        this.config = config;
      }
    },
  }));

  jest.unstable_mockModule('@aws-sdk/client-s3', () => ({
    ListObjectsCommand: class {},
  }));

  const { createStream } = await import('../app/routes/attains.js');
  return { createStream, pool, client, stream, streamResponse };
}

const query = { toString: () => 'select "objectid" from "schema"."tmdl"' };
const pageOptions = { pageNumber: 1, pageSize: 20 };

function run(createStream, res) {
  return createStream(query, res, 'json', null, pageOptions, false);
}

// stands in for an http.ServerResponse
function makeRes(overrides = {}) {
  return {
    closed: false,
    destroyed: false,
    setTimeout: jest.fn(),
    destroy: jest.fn(),
    ...overrides,
  };
}

afterEach(() => {
  jest.restoreAllMocks();
  jest.resetModules();
});

describe('createStream connection lifecycle', () => {
  test('releases the client once when the stream ends normally', async () => {
    const { createStream, client, stream, streamResponse } =
      await loadCreateStream();
    const res = makeRes();

    await run(createStream, res);

    expect(client.query).toHaveBeenCalledTimes(1);
    expect(streamResponse).toHaveBeenCalledTimes(1);
    // the response and the db stream are wired through to the streaming service
    expect(streamResponse.mock.calls[0][0]).toBe(res);
    expect(streamResponse.mock.calls[0][1]).toBe(stream);

    // 'end' then a late 'close' both fire; the client is released exactly once
    stream.emit('end');
    stream.emit('close');

    expect(client.release).toHaveBeenCalledTimes(1);
    expect(client.release).toHaveBeenCalledWith(undefined);
  });

  test('returns the client clean and issues no query when res.closed is already true', async () => {
    const { createStream, client, streamResponse } = await loadCreateStream();
    const res = makeRes({ closed: true });

    await run(createStream, res);

    // no cursor was ever opened, so the connection goes back to the pool clean
    expect(client.query).not.toHaveBeenCalled();
    expect(streamResponse).not.toHaveBeenCalled();
    expect(client.release).toHaveBeenCalledTimes(1);
    expect(client.release).toHaveBeenCalledWith(undefined);
  });

  test('returns the client clean when res.destroyed is already true', async () => {
    const { createStream, client, streamResponse } = await loadCreateStream();
    const res = makeRes({ destroyed: true });

    await run(createStream, res);

    expect(client.query).not.toHaveBeenCalled();
    expect(streamResponse).not.toHaveBeenCalled();
    expect(client.release).toHaveBeenCalledTimes(1);
    expect(client.release).toHaveBeenCalledWith(undefined);
  });

  test('destroys the stream and discards the connection when streaming throws synchronously', async () => {
    const pipeErr = new Error('Cannot pipe to a closed or destroyed stream');
    pipeErr.code = 'ERR_STREAM_UNABLE_TO_PIPE';

    const { createStream, client, stream } = await loadCreateStream({
      streamResponseImpl: () => {
        throw pipeErr;
      },
    });
    const res = makeRes();

    // pipeline() throws synchronously when the response closed after the guard;
    // createStream must tear down the cursor and release with the error so pg
    // discards the connection rather than returning a half-open one to the pool
    await expect(run(createStream, res)).rejects.toBe(pipeErr);

    expect(stream.destroy).toHaveBeenCalledTimes(1);
    expect(client.release).toHaveBeenCalledTimes(1);
    expect(client.release).toHaveBeenCalledWith(pipeErr);
  });

  test('releases with the error on a stream error and ignores the trailing close', async () => {
    const { createStream, client, stream } = await loadCreateStream();
    const res = makeRes();

    await run(createStream, res);

    const streamErr = new Error('Connection terminated unexpectedly');
    stream.emit('error', streamErr);
    stream.emit('close');

    expect(client.release).toHaveBeenCalledTimes(1);
    expect(client.release).toHaveBeenCalledWith(streamErr);
  });

  test('releases with the error when the client emits a connection error', async () => {
    const { createStream, client } = await loadCreateStream();
    const res = makeRes();

    await run(createStream, res);

    // a terminated backend with a suspended cursor errors on the client, not
    // the stream; the listener must catch it so Node does not re-throw it
    const clientErr = new Error(
      'terminating connection due to administrator command',
    );
    client.emit('error', clientErr);

    expect(client.release).toHaveBeenCalledTimes(1);
    expect(client.release).toHaveBeenCalledWith(clientErr);
  });

  test('removes the client error listener on release so it does not pile up across checkouts', async () => {
    const { createStream, client, stream } = await loadCreateStream();
    const res = makeRes();

    await run(createStream, res);
    expect(client.listenerCount('error')).toBe(1);

    stream.emit('end');
    expect(client.listenerCount('error')).toBe(0);
  });
});

describe('createStream response idle timeout', () => {
  const original = process.env.STREAM_IDLE_TIMEOUT;
  afterEach(() => {
    if (original === undefined) delete process.env.STREAM_IDLE_TIMEOUT;
    else process.env.STREAM_IDLE_TIMEOUT = original;
  });

  test('does not arm a timeout when STREAM_IDLE_TIMEOUT is unset', async () => {
    delete process.env.STREAM_IDLE_TIMEOUT;
    const { createStream } = await loadCreateStream();
    const res = makeRes();

    await run(createStream, res);

    expect(res.setTimeout).not.toHaveBeenCalled();
  });

  test('arms the idle timeout and destroys the response when it fires', async () => {
    process.env.STREAM_IDLE_TIMEOUT = '5000';
    const { createStream } = await loadCreateStream();
    const res = makeRes();

    await run(createStream, res);

    expect(res.setTimeout).toHaveBeenCalledWith(5000, expect.any(Function));
    // firing the timer (no write progress) abandons the response
    const onIdle = res.setTimeout.mock.calls[0][1];
    onIdle();
    expect(res.destroy).toHaveBeenCalledTimes(1);
  });

  test('clears the idle timeout on release so a reused socket is not affected', async () => {
    process.env.STREAM_IDLE_TIMEOUT = '5000';
    const { createStream, stream } = await loadCreateStream();
    const res = makeRes();

    await run(createStream, res);
    stream.emit('end');

    // setTimeout(5000, fn) to arm, setTimeout(0) to clear
    expect(res.setTimeout).toHaveBeenCalledWith(0);
  });
});
