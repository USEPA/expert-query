const { Transform, Readable, pipeline } = require("stream");
const logger = require("../utilities/logger");
const log = logger.logger;

function writeHead(res, status = 200, options = {}) {
  if (typeof res.headersSent === "boolean" && !res.headersSent) {
    res.writeHead(status, {
      "Content-Type": options.contentType,
      "Transfer-Encoding": "chunked",
      "X-Content-Type-Options": "nosniff",
    });
  }
}

function getOptions(outStream, options) {
  function preHook() {
    writeHead(outStream, 200, options);
  }

  function errorHook() {
    writeHead(outStream, 500, options);
  }

  function errorHandler(error) {
    if (!error) return;
    const { stack, message } = error;
    log.warn({ error: Object.assign({}, error, { stack, message }) });
  }

  return { preHook, errorHook, errorHandler };
}

function getBasicTransform(preHook) {
  return new Transform({
    writableObjectMode: true,
    transform(data = {}, encoding, callback) {
      // preHook on first data only
      if (!this.comma) preHook();
      this.push(data);
      // set comma for subsequent data
      if (!this.comma) this.comma = "\n";
      callback();
    },
    final(callback) {
      callback();
    },
  });
}

function getJsonTransform(preHook) {
  return new Transform({
    writableObjectMode: true,
    transform(data = {}, encoding, callback) {
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
}

function streamData(outStream, data, options = {}) {
  if (!data) return outStream.end();
  const inStream = new Readable({ objectMode: true, read: () => {} });
  streamResponse(outStream, inStream, options, data);
}

function streamResponse(outStream, inStream, options = {}, data = undefined) {
  const { preHook, errorHook, errorHandler } = getOptions(outStream, options);
  inStream.on("error", (error) => {
    errorHook();
    inStream.push({ error: error.message });
    outStream.end();
  });

  let transform = getBasicTransform(preHook);
  if (options.contentType.includes("json")) {
    transform = getJsonTransform(preHook);
  }

  pipeline(inStream, transform, outStream, errorHandler);
  if (data) {
    (Array.isArray(data) ? data : [data]).map((record) =>
      inStream.push(record)
    );
    inStream.push(null); // signal stream end
  }
}

module.exports = streamData;
