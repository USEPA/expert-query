const { Transform, Readable, Writable, pipeline } = require("stream");
const Papa = require("papaparse");
const bl = require("bl");
const util = require("util");

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
        console.error({ error: Object.assign({}, error, { stack, message }) });
      },
    };
  };

  static writeHead = (res, status, format) => {
    if (typeof res.headersSent === "boolean" && !res.headersSent) {
      let contentType = "application/json; charset=utf-8";
      if (format === "csv") contentType = "text/csv";
      if (format === "tsv") contentType = "text/tsv";

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

  static streamResponse = (outStream, inStream, format) => {
    const { preHook, errorHook, errorHandler } = StreamingService.getOptions(
      outStream,
      format
    );
    inStream.on("error", (error) => {
      errorHook();
      inStream.push({ error: error.message });
      outStream.end();
    });

    let transform = StreamingService.getJsonTransform(preHook);
    if (format === "csv" || format === "tsv") {
      transform = StreamingService.getBasicTransform(preHook, format);
    }

    pipeline(inStream, transform, outStream, errorHandler);
  };
}

const ExcelTransform = function (options) {
  Transform.call(this, {
    writableObjectMode: true,
    readableObjectMode: false,
  });

  this.workbook = options.workbook;
  const that = this;
  this.workbook.stream.on("readable", function () {
    const chunk = this.workbook.stream.read();
    that.push(chunk);
  });
  this.worksheet = options.worksheet;
};

util.inherits(ExcelTransform, Transform);

ExcelTransform.prototype._transform = function (data, encoding, callback) {
  if (!this.worksheet.columns) {
    this.worksheet.columns = Object.keys(data).map((key) => {
      return { header: key, key };
    });
  }

  this.worksheet.addRow(data).commit();

  callback();
};

ExcelTransform.prototype._flush = function (callback) {
  this.workbook.commit();
  callback();
};

module.exports = {
  StreamingService,
  ExcelTransform,
};
