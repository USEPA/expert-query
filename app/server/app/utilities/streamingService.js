import { Transform, pipeline } from 'node:stream';
import util from 'node:util';
import Papa from 'papaparse';
import { log } from '../utilities/logger.js';
const setImmediatePromise = util.promisify(setImmediate);

/**
 * Error codes that indicate the client went away rather than a fault in the application.
 * These are expected during normal operation and are logged at a lower level.
 */
const CLIENT_DISCONNECT_CODES = new Set([
  'ECONNRESET',
  'EPIPE',
  'ERR_STREAM_ALREADY_FINISHED',
  'ERR_STREAM_DESTROYED',
  'ERR_STREAM_PREMATURE_CLOSE',
  'ERR_STREAM_WRITE_AFTER_END',
]);

/**
 * Determines whether an error was caused by the client disconnecting.
 * @param {Error} error
 * @returns {boolean}
 */
function isClientDisconnect(error) {
  return (
    CLIENT_DISCONNECT_CODES.has(error?.code) ||
    error?.message === 'Premature close'
  );
}

/**
 * Determines whether a stream can still accept writes.
 * @param {import('node:stream').Writable} stream
 * @returns {boolean}
 */
function isWritable(stream) {
  return Boolean(stream) && !stream.destroyed && !stream.writableEnded;
}

export default class StreamingService {
  /**
   * @param {express.Response} outStream output response stream
   * @param {'csv'|'tsv'|'xlsx'|'json'|''} format export format file type
   */
  static getOptions = (outStream, format) => {
    return {
      preHook: () => {
        StreamingService.writeHead(outStream, 200, format);
      },
      errorHook: () => {
        StreamingService.writeHead(outStream, 500, format);
      },
      errorHandler: (error) => {
        if (!error) return;
        // exceljs writes the workbook straight to outStream and ends it itself,
        // so pipeline sees its destination close while the transform is still
        // finishing and reports a premature close even though the whole file
        // was delivered. A finished writable means nothing was actually lost.
        if (outStream?.writableFinished) return;

        if (isClientDisconnect(error)) {
          log.debug('Out stream closed before completion: ' + error);
          return;
        }

        log.warn('Out stream Error! ' + error);
      },
    };
  };

  /**
   * Writes the response headers.
   * @param {express.Response} res
   * @param {number} status http response code
   * @param {'csv'|'tsv'|'xlsx'|'json'|''} format export format file type
   */
  static writeHead = (res, status, format) => {
    if (res.destroyed) return;

    if (typeof res.headersSent === 'boolean' && !res.headersSent) {
      let contentType = 'application/json; charset=utf-8';
      if (format === 'csv') contentType = 'text/csv';
      if (format === 'tsv') contentType = 'text/tsv';
      if (format === 'xlsx')
        contentType =
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

      res.writeHead(status, {
        'Content-Type': contentType,
        'Transfer-Encoding': 'chunked',
        'X-Content-Type-Options': 'nosniff',
      });
    }
  };

  /**
   * Transforms the streaming data to csv or tsv.
   * @param {function} preHook function for writing initial headers
   * @param {'csv'|'tsv'} format export format file type
   * @returns Transform object
   */
  static getBasicTransform = (preHook, format) => {
    return new Transform({
      writableObjectMode: true,
      transform(data, encoding, callback) {
        try {
          // preHook on first data only
          if (!this.comma) preHook();

          // convert the json to csv
          const unparsedData = Papa.unparse(JSON.stringify([data]), {
            delimiter: format === 'tsv' ? '\t' : ',',
            header: !this.comma,
          });
          this.push(unparsedData);

          // set comma for subsequent data
          if (!this.comma) this.comma = '\n';
          this.push(this.comma);
          callback();
        } catch (err) {
          // hand the error to the pipeline instead of throwing out of the stream
          callback(err);
        }
      },
      final(callback) {
        callback();
      },
    });
  };

  /**
   * Transforms the streaming data to json.
   * @param {function} preHook function for writing initial headers
   * @param {Object} pageOptions page number and page size for paginated JSON
   * @returns Transform object
   */
  static getJsonTransform = (preHook, pageOptions = {}) => {
    const { pageNumber, pageSize } = pageOptions;
    const start = '{ "data": [';
    const end =
      ']' +
      (pageNumber ? `, "pageNumber": ${pageNumber}` : '') +
      (pageSize ? `, "pageSize": ${pageSize}` : '') +
      '}';
    return new Transform({
      writableObjectMode: true,
      transform(data, _encoding, callback) {
        try {
          // preHook on first data only
          if (!this.comma) preHook();
          // if first data && error then no open/close brackets
          const prefix = this.comma || (data.error ? '' : start);
          const suffix = this.comma && data.error ? end : '';
          this.push(`${prefix}${JSON.stringify(data)}${suffix}`);
          // set comma for subsequent data
          if (!this.comma) this.comma = ',\n';
          callback();
        } catch (err) {
          // hand the error to the pipeline instead of throwing out of the stream
          callback(err);
        }
      },
      final(callback) {
        try {
          if (!this.comma) this.push(start);
          this.push(end);
          callback();
        } catch (err) {
          callback(err);
        }
      },
    });
  };

  /**
   * Transforms the streaming data to xlsx.
   * @param {function} preHook function for writing initial headers
   * @param {Object} excelDoc Excel workbook and worksheet objects
   * @returns Transform object
   */
  static getXlsxTransform = (preHook, excelDoc) => {
    return new Transform({
      writableObjectMode: true,
      readableObjectMode: false,
      async transform(data, encoding, callback) {
        // Transform ignores the return value of an async transform function, so
        // a rejection here would surface as an unhandled rejection and take down
        // the process. Catch it and route it through the pipeline instead.
        try {
          // preHook on first data only
          if (!this.comma) {
            excelDoc.worksheet.columns = Object.keys(data).map((key) => {
              return { header: key, key };
            });
          }

          // convert the json to csv
          excelDoc.worksheet.addRow(data).commit();
          await setImmediatePromise();

          // set comma for subsequent data
          if (!this.comma) this.comma = '\n';

          callback();
        } catch (err) {
          callback(err);
        }
      },
      final(callback) {
        excelDoc.workbook
          .commit()
          .then(() => {
            callback();
          })
          .catch((err) => {
            // the workbook writes straight to the response, so there is no
            // usable response object here - let the pipeline handle the error
            callback(err);
          });
      },
    });
  };

  /**
   * Builds a pipe for streaming data in from the database and out to the client
   * in the specified format.
   * @param {express.Response} outStream output response stream
   * @param {Transform} inStream readable stream from database query
   * @param {'csv'|'tsv'|'xlsx'|'json'|''} format export format file type
   * @param {Object} excelDoc Excel workbook and worksheet objects
   * @param {Object} pageOptions page number and page size for paginated JSON
   */
  static streamResponse = (
    outStream,
    inStream,
    format,
    excelDoc,
    pageOptions,
  ) => {
    const { preHook, errorHook, errorHandler } = StreamingService.getOptions(
      outStream,
      format,
    );
    // This has to stay separate from the pipeline handler below. pipeline()
    // destroys outStream before invoking its callback, so by then the 500 can
    // no longer be written and the client just sees a truncated body. This
    // handler runs before that teardown. The teardown then re-emits 'error' on
    // inStream, so guard against running twice.
    let inStreamFailed = false;
    inStream.on('error', (error) => {
      if (inStreamFailed) return;
      inStreamFailed = true;

      log.warn('Streaming in error! ' + error);
      try {
        errorHook();
        // inStream is usually already destroyed here, so this reaches the
        // client only when it somehow survived
        if (!inStream.destroyed && !inStream.readableEnded) {
          inStream.push({ error: error.message });
        }
        if (isWritable(outStream)) outStream.end();
      } catch (err) {
        errorHandler(err);
      }
    });

    // if the client goes away mid-download, stop reading from the database so
    // the query stream and its connection are released
    outStream.on('close', () => {
      if (!inStream.destroyed) inStream.destroy();
    });

    let transform = StreamingService.getJsonTransform(preHook, pageOptions);
    if (format === 'csv' || format === 'tsv') {
      transform = StreamingService.getBasicTransform(preHook, format);
    }
    if (format === 'xlsx' && excelDoc) {
      transform = StreamingService.getXlsxTransform(preHook, excelDoc);
    }

    pipeline(inStream, transform, outStream, errorHandler);
  };
}
