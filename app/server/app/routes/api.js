const { resolve } = require("node:path");
const { readFile } = require("node:fs/promises");
const express = require("express");
const axios = require("axios");
const logger = require("../utilities/logger");
const log = logger.logger;

const isLocal = process.env.NODE_ENV === "local";
const s3Bucket = process.env.CF_S3_PUB_BUCKET_ID;
const s3Region = process.env.CF_S3_PUB_REGION;
const s3BucketUrl = `https://${s3Bucket}.s3-${s3Region}.amazonaws.com`;

// local development: read files directly from disk
// Cloud.gov: fetch files from the public s3 bucket
function getFile(filename) {
  return isLocal
    ? readFile(resolve(__dirname, "../", filename), "utf8")
    : axios({
        method: "get",
        url: `${s3BucketUrl}/${filename}`,
        timeout: 10000,
      });
}

// local development: no further processing of strings needed
// Cloud.gov: get data from responses
function parseResponse(res) {
  if (Array.isArray(res)) {
    return isLocal ? res.map((r) => JSON.parse(r)) : res.map((r) => r.data);
  } else {
    return isLocal ? JSON.parse(res) : res.data;
  }
}

module.exports = function (app) {
  const router = express.Router();

  // --- get static content from S3
  router.get("/lookupFiles", (req, res) => {
    const metadataObj = logger.populateMetdataObjFromRequest(req);

    // NOTE: static content files found in `app/server/app/content/` directory
    const filenames = [
      "content/config/services.json",
      "content/alerts/config.json",
      "content-etl/glossary.json",
    ];

    const filePromises = Promise.all(
      filenames.map((filename) => {
        return getFile(filename);
      })
    )
      .then((stringsOrResponses) => {
        return parseResponse(stringsOrResponses);
      })
      .then((data) => {
        return {
          services: data[0],
          alertsConfig: data[1],
          glossary: data[2],
        };
      });

    const directories = ["content-etl/domainValues"];

    const directoryPromises = Promise.all(
      directories.map((directory) => {
        return getFile(`${directory}/index.json`).then((stringOrResponse) => {
          const dirFiles = parseResponse(stringOrResponse);
          return Promise.all(
            dirFiles.map((dirFile) => {
              return getFile(`${directory}/${dirFile}`);
            })
          )
            .then((stringsOrResponses) => {
              return parseResponse(stringsOrResponses);
            })
            .then((data) => {
              return data.reduce((a, b) => {
                return Object.assign(a, b);
              }, {});
            });
        });
      })
    ).then((data) => {
      return {
        domainValues: data[0],
      };
    });

    Promise.all([filePromises, directoryPromises])
      .then((data) => res.json({ ...data[0], ...data[1] }))
      .catch((error) => {
        if (typeof error.toJSON === "function") {
          log.debug(logger.formatLogMsg(metadataObj, error.toJSON()));
        }

        const errorStatus = error.response?.status;
        const errorMethod = error.response?.config?.method?.toUpperCase();
        const errorUrl = error.response?.config?.url;
        const message = `S3 Error: ${errorStatus} ${errorMethod} ${errorUrl}`;
        log.error(logger.formatLogMsg(metadataObj, message));

        return res
          .status(error?.response?.status || 500)
          .json({ message: "Error getting static content from S3 bucket" });
      });
  });

  // --- get static content from S3
  router.get("/getFile", (req, res) => {
    const { filepath } = req.query;
    const s3Bucket = process.env.CF_S3_PUB_BUCKET_ID;
    const s3Region = process.env.CF_S3_PUB_REGION;
    const metadataObj = logger.populateMetdataObjFromRequest(req);

    const s3BucketUrl = `https://${s3Bucket}.s3-${s3Region}.amazonaws.com`;

    // local development: read files directly from disk
    // Cloud.gov: fetch files from the public s3 bucket
    (isLocal
      ? readFile(resolve(__dirname, "../content", filepath), "utf8")
      : axios({
          method: "get",
          url: `${s3BucketUrl}/content/${filepath}`,
          timeout: 10000,
        })
    )
      .then((stringsOrResponses) => {
        // local development: return root of response
        // Cloud.gov: return data value of response
        return res.send(isLocal ? stringsOrResponses : stringsOrResponses.data);
      })
      .catch((error) => {
        if (typeof error.toJSON === "function") {
          log.debug(logger.formatLogMsg(metadataObj, error.toJSON()));
        }

        const errorStatus = error.response?.status;
        const errorMethod = error.response?.config?.method?.toUpperCase();
        const errorUrl = error.response?.config?.url;
        const message = `S3 Error: ${errorStatus} ${errorMethod} ${errorUrl}`;
        log.error(logger.formatLogMsg(metadataObj, message));

        return res
          .status(error?.response?.status || 500)
          .json({ message: "Error getting static content from S3 bucket" });
      });
  });

  app.use("/api", router);
};
