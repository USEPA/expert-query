import { Transform, Readable, Writable, pipeline } from 'stream';
import Papa from 'papaparse';
import bl from 'bl';
import util from 'util';
import { logger as log } from './logger.js';
const setImmediatePromise = util.promisify(setImmediate);

export default class StreamingService {
  /**
   * Transforms the streaming data to csv or tsv.
   * @param {'csv'|'tsv'} format export format file type
   * @returns Transform object
   */
  static getBasicTransform = (format) => {
    return new Transform({
      writableObjectMode: true,
      transform(data, encoding, callback) {
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
   * @returns Transform object
   */
  static getJsonTransform = () => {
    return new Transform({
      writableObjectMode: true,
      transform(data, encoding, callback) {
        // if first data && error then no open/close brackets
        const prefix = this.comma || (data.error ? '' : '[');
        const suffix = this.comma && data.error ? ']' : '';
        this.push(`${prefix}${JSON.stringify(data)}${suffix}`);
        // set comma for subsequent data
        if (!this.comma) this.comma = ',\n';
        callback();
      },
      final(callback) {
        if (!this.comma) this.push('[');
        this.push(']');
        callback();
      },
    });
  };

  /**
   * Transforms the streaming data to xlsx.
   * @param {Object} excelDoc Excel workbook and worksheet objects
   * @returns Transform object
   */
  static getXlsxTransform = (excelDoc) => {
    return new Transform({
      writableObjectMode: true,
      readableObjectMode: false,
      async transform(data, encoding, callback) {
        // on first data only
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
            log.error('Error! ', err);
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
   */
  static streamResponse = async (
    outStream,
    inStream,
    format,
    excelDoc = null,
  ) => {
    inStream.on('error', (error) => {
      log.error('Streaming in error! ' + error);
      inStream.push({ error: error.message });
      outStream.end();
    });

    let transform = StreamingService.getJsonTransform();
    if (format === 'csv' || format === 'tsv') {
      transform = StreamingService.getBasicTransform(format);
    }
    if (format === 'xlsx' && excelDoc) {
      transform = StreamingService.getXlsxTransform(excelDoc);
    }

    pipeline(inStream, transform, outStream, (error) => {
      if (!error) return;
      if (error.message === 'Premature close') return;

      log.error('Out stream Error! ' + error);
    });
  };
}
