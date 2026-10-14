import { PassThrough, Readable } from 'node:stream';
import { jest } from '@jest/globals';

/**
 * Loads StreamingService with a mocked logger so log calls can be asserted on.
 */
async function loadStreamingService() {
  jest.resetModules();

  const logWarn = jest.fn();
  const logDebug = jest.fn();

  await jest.unstable_mockModule('../app/utilities/logger.js', () => ({
    formatLogMsg: (metadataObj, message) => ({ metadataObj, message }),
    log: {
      debug: logDebug,
      error: jest.fn(),
      info: jest.fn(),
      warn: logWarn,
    },
    populateMetdataObjFromRequest: () => ({ requestId: 'request-id' }),
  }));

  const { default: StreamingService } = await import(
    '../app/utilities/streamingService.js'
  );

  return { StreamingService, mocks: { logWarn, logDebug } };
}

/**
 * Minimal stand-in for the express response the service streams out to.
 */
function createResponse() {
  const res = new PassThrough();
  const chunks = [];

  res.headersSent = false;
  res.writeHead = jest.fn((status) => {
    res.headersSent = true;
    res.statusCode = status;
    return res;
  });
  res.on('data', (chunk) => chunks.push(chunk.toString()));
  res.getBody = () => chunks.join('');

  return res;
}

/**
 * Stand-in for the pg-query-stream the results are read from.
 */
function createQueryStream() {
  return new Readable({ objectMode: true, read() {} });
}

/**
 * Records anything that would have terminated the process, so a test can assert
 * the streaming code never escalates a stream failure into a crash.
 */
function watchForCrashes() {
  const crashes = [];
  const onUncaught = (err) => crashes.push(`uncaughtException: ${err.message}`);
  const onUnhandled = (err) =>
    crashes.push(`unhandledRejection: ${err?.message}`);

  process.on('uncaughtException', onUncaught);
  process.on('unhandledRejection', onUnhandled);

  return {
    crashes,
    stop: () => {
      process.off('uncaughtException', onUncaught);
      process.off('unhandledRejection', onUnhandled);
    },
  };
}

/** Lets pending stream callbacks and promise rejections settle. */
function settle(ms = 60) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('StreamingService tests', () => {
  let watcher;

  beforeEach(() => {
    watcher = watchForCrashes();
  });

  afterEach(() => {
    watcher.stop();
    jest.restoreAllMocks();
    jest.resetModules();
  });

  test('streams JSON results with page options', async () => {
    const { StreamingService } = await loadStreamingService();
    const res = createResponse();
    const inStream = createQueryStream();

    StreamingService.streamResponse(res, inStream, 'json', null, {
      pageNumber: 1,
      pageSize: 2,
    });

    inStream.push({ id: 1 });
    inStream.push({ id: 2 });
    inStream.push(null);
    await settle();

    expect(JSON.parse(res.getBody())).toEqual({
      data: [{ id: 1 }, { id: 2 }],
      pageNumber: 1,
      pageSize: 2,
    });
    expect(res.writeHead).toHaveBeenCalledWith(200, expect.any(Object));
    expect(watcher.crashes).toEqual([]);
  });

  test('streams csv results', async () => {
    const { StreamingService } = await loadStreamingService();
    const res = createResponse();
    const inStream = createQueryStream();

    StreamingService.streamResponse(res, inStream, 'csv', null, {});

    inStream.push({ id: 1, name: 'a' });
    inStream.push({ id: 2, name: 'b' });
    inStream.push(null);
    await settle();

    expect(res.getBody()).toBe('id,name\r\n1,a\n2,b\n');
    expect(watcher.crashes).toEqual([]);
  });

  test('does not crash when the client disconnects mid-stream', async () => {
    const { StreamingService } = await loadStreamingService();
    const res = createResponse();
    const inStream = createQueryStream();

    StreamingService.streamResponse(res, inStream, 'json', null, {});
    inStream.push({ id: 1 });
    await settle(10);

    // the client goes away part way through the download
    res.destroy(new Error('socket hang up'));
    inStream.push({ id: 2 });
    inStream.push({ id: 3 });
    await settle();

    expect(watcher.crashes).toEqual([]);
  });

  test('destroys the query stream when the client disconnects', async () => {
    const { StreamingService } = await loadStreamingService();
    const res = createResponse();
    const inStream = createQueryStream();

    StreamingService.streamResponse(res, inStream, 'json', null, {});
    inStream.push({ id: 1 });
    await settle(10);

    res.destroy();
    await settle();

    // the database read must be torn down, otherwise the pooled connection
    // backing it is never released
    expect(inStream.destroyed).toBe(true);
    expect(watcher.crashes).toEqual([]);
  });

  test('reports a query stream error to the client without crashing', async () => {
    const { StreamingService, mocks } = await loadStreamingService();
    const res = createResponse();
    const inStream = createQueryStream();

    StreamingService.streamResponse(res, inStream, 'json', null, {});
    inStream.emit('error', new Error('query failed'));
    await settle();

    expect(mocks.logWarn).toHaveBeenCalledWith(
      expect.stringContaining('query failed'),
    );
    // the 500 is the part the client actually sees. It has to be written from
    // the inStream error handler, because pipeline() destroys the response
    // before it calls its own callback
    expect(res.writeHead).toHaveBeenCalledWith(500, expect.any(Object));
    expect(watcher.crashes).toEqual([]);
  });

  test('handles a query stream error only once', async () => {
    const { StreamingService, mocks } = await loadStreamingService();
    const res = createResponse();
    const inStream = createQueryStream();

    StreamingService.streamResponse(res, inStream, 'json', null, {});
    // a real pg-query-stream failure destroys the stream, and pipeline's
    // teardown then re-emits 'error' on it
    inStream.destroy(new Error('query failed'));
    await settle();

    const inStreamWarnings = mocks.logWarn.mock.calls.filter(([message]) =>
      message.startsWith('Streaming in error!'),
    );
    expect(inStreamWarnings).toHaveLength(1);
    expect(watcher.crashes).toEqual([]);
  });

  test('does not push an error into an already destroyed query stream', async () => {
    const { StreamingService } = await loadStreamingService();
    const res = createResponse();
    const inStream = createQueryStream();

    StreamingService.streamResponse(res, inStream, 'json', null, {});
    inStream.destroy();
    inStream.emit('error', new Error('query failed after destroy'));
    await settle();

    expect(watcher.crashes).toEqual([]);
  });

  test('does not crash when the xlsx transform throws', async () => {
    const { StreamingService } = await loadStreamingService();
    const res = createResponse();
    const inStream = createQueryStream();
    const excelDoc = {
      worksheet: {
        set columns(value) {},
        addRow: () => {
          throw new Error('worksheet exploded');
        },
      },
      workbook: { commit: jest.fn().mockResolvedValue(undefined) },
    };

    StreamingService.streamResponse(res, inStream, 'xlsx', excelDoc, {});
    inStream.push({ id: 1 });
    await settle(100);

    // Transform ignores the promise returned by an async transform function, so
    // an uncaught throw here would surface as an unhandled rejection
    expect(watcher.crashes).toEqual([]);
  });

  test('does not crash when the xlsx workbook fails to commit', async () => {
    const { StreamingService, mocks } = await loadStreamingService();
    const res = createResponse();
    const inStream = createQueryStream();
    const excelDoc = {
      worksheet: {
        set columns(value) {},
        addRow: () => ({ commit: jest.fn() }),
      },
      workbook: {
        commit: jest.fn().mockRejectedValue(new Error('commit failed')),
      },
    };

    StreamingService.streamResponse(res, inStream, 'xlsx', excelDoc, {});
    inStream.push({ id: 1 });
    inStream.push(null);
    await settle(120);

    expect(watcher.crashes).toEqual([]);
    expect(mocks.logWarn).toHaveBeenCalledWith(
      expect.stringContaining('commit failed'),
    );
  });

  test('logs client disconnects below warn level', async () => {
    const { StreamingService, mocks } = await loadStreamingService();
    const res = createResponse();
    const { errorHandler } = StreamingService.getOptions(res, 'json');

    const premature = new Error('Premature close');
    premature.code = 'ERR_STREAM_PREMATURE_CLOSE';
    errorHandler(premature);

    const reset = new Error('aborted');
    reset.code = 'ECONNRESET';
    errorHandler(reset);

    expect(mocks.logWarn).not.toHaveBeenCalled();
    expect(mocks.logDebug).toHaveBeenCalledTimes(2);
  });

  test('stays silent when the response finished before pipeline tore it down', async () => {
    const { StreamingService, mocks } = await loadStreamingService();
    const res = createResponse();
    const { errorHandler } = StreamingService.getOptions(res, 'xlsx');

    // exceljs ends the response itself, so pipeline reports a premature close
    // on a response that was in fact fully delivered
    res.end();
    await settle(10);

    const premature = new Error('Premature close');
    premature.code = 'ERR_STREAM_PREMATURE_CLOSE';
    errorHandler(premature);

    expect(res.writableFinished).toBe(true);
    expect(mocks.logWarn).not.toHaveBeenCalled();
    expect(mocks.logDebug).not.toHaveBeenCalled();
  });

  test('still reports a premature close on an unfinished response', async () => {
    const { StreamingService, mocks } = await loadStreamingService();
    const res = createResponse();
    const { errorHandler } = StreamingService.getOptions(res, 'xlsx');

    // a genuine disconnect leaves the response unfinished
    res.destroy();

    const premature = new Error('Premature close');
    premature.code = 'ERR_STREAM_PREMATURE_CLOSE';
    errorHandler(premature);

    expect(res.writableFinished).toBe(false);
    expect(mocks.logDebug).toHaveBeenCalledTimes(1);
  });

  test('logs unexpected stream errors as warnings', async () => {
    const { StreamingService, mocks } = await loadStreamingService();
    const res = createResponse();
    const { errorHandler } = StreamingService.getOptions(res, 'json');

    errorHandler(new Error('something unexpected'));

    expect(mocks.logWarn).toHaveBeenCalledWith(
      expect.stringContaining('something unexpected'),
    );
  });

  test('writeHead is a no-op once the response is destroyed', async () => {
    const { StreamingService } = await loadStreamingService();
    const res = createResponse();
    res.destroy();

    StreamingService.writeHead(res, 200, 'json');

    expect(res.writeHead).not.toHaveBeenCalled();
  });
});
