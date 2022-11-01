const { resolve } = require("node:path");
const { readFile } = require("node:fs/promises");
const express = require("express");
const axios = require("axios");
const logger = require("../utilities/logger");
const log = logger.logger;

const isLocal = process.env.NODE_ENV === "local";

module.exports = function (app) {
  const router = express.Router();

  // --- get static content from S3
  router.get("/lookupFiles", (req, res) => {
    const s3Bucket = process.env.CF_DEV_S3_PUB_BUCKET_ID;
    const s3Region = process.env.CF_DEV_S3_PUB_REGION;
    const metadataObj = logger.populateMetdataObjFromRequest(req);

    // NOTE: static content files found in `app/server/app/content/` directory
    const filenames = ["config/services.json", "alerts/config.json"];

    const s3BucketUrl = `https://${s3Bucket}.s3-${s3Region}.amazonaws.com`;

    const promises = filenames.map((filename) => {
      // local development: read files directly from disk
      // Cloud.gov: fetch files from the public s3 bucket
      return isLocal
        ? readFile(resolve(__dirname, "../content", filename), "utf8")
        : axios({
            method: "get",
            url: `${s3BucketUrl}/content/${filename}`,
            timeout: 10000,
          });
    });

    Promise.all(promises)
      .then((stringsOrResponses) => {
        // local development: no further processing of strings needed
        // Cloud.gov: get data from responses
        return isLocal
          ? stringsOrResponses
          : stringsOrResponses.map((axiosRes) => axiosRes.data);
      })
      .then((data) => {
        return res.json({
          services: isLocal ? JSON.parse(data[0]) : data[0],
          alertsConfig: isLocal ? JSON.parse(data[1]) : data[1],
        });
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

  // --- get static content from S3
  router.get("/getFile", (req, res) => {
    const { filepath } = req.query;
    const s3Bucket = process.env.CF_DEV_S3_PUB_BUCKET_ID;
    const s3Region = process.env.CF_DEV_S3_PUB_REGION;
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

  router.get("/test", (req, res) => {
    const { url } = req.query;
  });

  app.use("/api", router);
};
