import { Transform, pipeline } from 'node:stream';
import util from 'node:util';
import Papa from 'papaparse';
import { log } from '../utilities/logger.js';
const setImmediatePromise = util.promisify(setImmediate);

export default class StreamingService {
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
        if (error.message === 'Premature close') return;

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
      },
      final(callback) {
        callback();
      },
    });
  };

  /**
   * Transforms the streaming data to json.
   * @param {function} preHook function for writing initial headers
   * @param {number} nextId starting objectid for the next page
   * @returns Transform object
   */
  static getJsonTransform = (preHook, nextId) => {
    const start = '{ "data": [';
    const end = ']' + (nextId ? `, "nextId": ${nextId}` : '') + '}';
    return new Transform({
      writableObjectMode: true,
      transform(data, _encoding, callback) {
        // preHook on first data only
        if (!this.comma) preHook();
        // if first data && error then no open/close brackets
        const prefix = this.comma || (data.error ? '' : start);
        const suffix = this.comma && data.error ? end : '';
        this.push(`${prefix}${JSON.stringify(data)}${suffix}`);
        // set comma for subsequent data
        if (!this.comma) this.comma = ',\n';
        callback();
      },
      final(callback) {
        if (!this.comma) this.push(start);
        this.push(end);
        callback();
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
      },
      final(callback) {
        excelDoc.workbook
          .commit()
          .then(() => {
            callback();
          })
          .catch((err) => {
            res.status(500).send('Error! ' + err);
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
   * @param {number} nextId starting objectid for the next page
   */
  static streamResponse = (
    outStream,
    inStream,
    format,
    excelDoc = null,
    nextId = null,
  ) => {
    const { preHook, errorHook, errorHandler } = StreamingService.getOptions(
      outStream,
      format,
    );
    inStream.on('error', (error) => {
      errorHook();
      log.warn('Streaming in error! ' + error);
      inStream.push({ error: error.message });
      outStream.end();
    });

    let transform = StreamingService.getJsonTransform(preHook, nextId);
    if (format === 'csv' || format === 'tsv') {
      transform = StreamingService.getBasicTransform(preHook, format);
    }
    if (format === 'xlsx' && excelDoc) {
      transform = StreamingService.getXlsxTransform(preHook, excelDoc);
    }

    pipeline(inStream, transform, outStream, errorHandler);
  };
}
