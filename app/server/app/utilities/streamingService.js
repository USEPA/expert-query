const { Transform, Readable, Writable, pipeline } = require("stream");
const Papa = require("papaparse");
const bl = require("bl");
const util = require("util");
const logger = require("../utilities/logger");
const log = logger.logger;

class StreamingService {
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

        const { stack, message } = error;
        if (message === "Premature close") return;

        log.warn("Out stream Error! " + error);
      },
    };
  };

  static writeHead = (res, status, format) => {
    if (typeof res.headersSent === "boolean" && !res.headersSent) {
      let contentType = "application/json; charset=utf-8";
      if (format === "csv") contentType = "text/csv";
      if (format === "tsv") contentType = "text/tsv";
      if (format === "xlsx")
        contentType =
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

      res.writeHead(status, {
        "Content-Type": contentType,
        "Transfer-Encoding": "chunked",
        "X-Content-Type-Options": "nosniff",
      });
    }
  };

  static getBasicTransform = (preHook, format) => {
    return new Transform({
      writableObjectMode: true,
      transform(data, encoding, callback) {
        // preHook on first data only
        if (!this.comma) preHook();

        // convert the json to csv
        const unparsedData = Papa.unparse(JSON.stringify([data]), {
          delimiter: format === "tsv" ? "\t" : ",",
          header: !this.comma,
        });
        this.push(unparsedData);

        // set comma for subsequent data
        if (!this.comma) this.comma = "\n";
        this.push(this.comma);
        callback();
      },
      final(callback) {
        callback();
      },
    });
  };

  static getJsonTransform = (preHook) => {
    return new Transform({
      writableObjectMode: true,
      transform(data, encoding, callback) {
        // preHook on first data only
        if (!this.comma) preHook();
        // if first data && error then no open/close brackets
        const prefix = this.comma || (data.error ? "" : "[");
        const suffix = this.comma && data.error ? "]" : "";
        this.push(`${prefix}${JSON.stringify(data)}${suffix}`);
        // set comma for subsequent data
        if (!this.comma) this.comma = ",\n";
        callback();
      },
      final(callback) {
        if (!this.comma) this.push("[");
        this.push("]");
        callback();
      },
    });
  };

  static getXlsxTransform = (preHook, format, excelDoc) => {
    return new Transform({
      writableObjectMode: true,
      readableObjectMode: false,
      transform(data, encoding, callback) {
        // preHook on first data only
        if (!this.comma) {
          excelDoc.worksheet.columns = Object.keys(data).map((key) => {
            return { header: key, key };
          });
        }

        // convert the json to csv
        excelDoc.worksheet.addRow(data).commit();

        // set comma for subsequent data
        if (!this.comma) this.comma = "\n";

        callback();
      },
      final(callback) {
        excelDoc.workbook
          .commit()
          .then(() => {
            callback();
          })
          .catch((err) => {
            res.status(500).send("Error! " + err);
          });
      },
    });
  };

  static streamResponse = (outStream, inStream, format, excelDoc = null) => {
    const { preHook, errorHook, errorHandler } = StreamingService.getOptions(
      outStream,
      format
    );
    inStream.on("error", (error) => {
      errorHook();
      log.warn("Streaming in error! " + error);
      inStream.push({ error: error.message });
      outStream.end();
    });

    let transform = StreamingService.getJsonTransform(preHook);
    if (format === "csv" || format === "tsv") {
      transform = StreamingService.getBasicTransform(preHook, format);
    }
    if (format === "xlsx" && excelDoc) {
      transform = StreamingService.getXlsxTransform(preHook, format, excelDoc);
    }

    pipeline(inStream, transform, outStream, errorHandler);
  };
}

module.exports = StreamingService;
