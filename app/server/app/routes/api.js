const { resolve } = require("node:path");
const { readFile } = require("node:fs/promises");
const express = require("express");
const axios = require("axios").default;

module.exports = function (app) {
  const router = express.Router();

  // --- Placeholder for API calls
  router.get("/db-query", function (req, res, next) {
    res.json({ success: true });
  });

  // --- get static content from S3
  router.get("/lookupFiles", (req, res) => {
    const s3Bucket = process.env.S3_PUBLIC_BUCKET;
    const s3Region = process.env.S3_PUBLIC_REGION;

    // NOTE: static content files found in `app/server/app/content/` directory
    const filenames = ["config/services.json", "alerts/config.json"];

    const s3BucketUrl = `https://${s3Bucket}.s3-${s3Region}.amazonaws.com`;

    Promise.all(
      filenames.map((filename) => {
        // local development: read files directly from disk
        // Cloud.gov: fetch files from the public s3 bucket
        return process.env.NODE_ENV === "local"
          ? readFile(resolve(__dirname, "../content", filename), "utf8")
          : axios.get(`${s3BucketUrl}/content/${filename}`);
      })
    )
      .then((stringsOrResponses) => {
        // local development: no further processing of strings needed
        // Cloud.gov: get data from responses
        return process.env.NODE_ENV === "local"
          ? stringsOrResponses
          : stringsOrResponses.map((axiosRes) => axiosRes.data);
      })
      .then((data) => {
        return res.json({
          services: JSON.parse(data[0]),
          alertsConfig: JSON.parse(data[1]),
          alertsSiteLevel: data[2],
        });
      })
      .catch((error) => {
        if (typeof error.toJSON === "function") {
          log({ level: "debug", message: error.toJSON(), req });
        }

        const errorStatus = error.response?.status;
        const errorMethod = error.response?.config?.method?.toUpperCase();
        const errorUrl = error.response?.config?.url;
        const message = `S3 Error: ${errorStatus} ${errorMethod} ${errorUrl}`;
        log({ level: "error", message, req });

        return res
          .status(error?.response?.status || 500)
          .json({ message: "Error getting static content from S3 bucket" });
      });
  });

  // --- get static content from S3
  router.get("/getFile", (req, res) => {
    const { filepath } = req.query;
    const s3Bucket = process.env.S3_PUBLIC_BUCKET;
    const s3Region = process.env.S3_PUBLIC_REGION;

    const s3BucketUrl = `https://${s3Bucket}.s3-${s3Region}.amazonaws.com`;

    // local development: read files directly from disk
    // Cloud.gov: fetch files from the public s3 bucket
    (process.env.NODE_ENV === "local"
      ? readFile(resolve(__dirname, "../content", filepath), "utf8")
      : axios.get(`${s3BucketUrl}/content/${filepath}`)
    )
      .then((stringsOrResponses) => {
        // local development: no further processing of strings needed
        // Cloud.gov: get data from responses
        return process.env.NODE_ENV === "local"
          ? stringsOrResponses
          : stringsOrResponses.map((axiosRes) => axiosRes.data);
      })
      .then((data) => {
        return res.send(data);
      })
      .catch((error) => {
        if (typeof error.toJSON === "function") {
          log({ level: "debug", message: error.toJSON(), req });
        }

        const errorStatus = error.response?.status;
        const errorMethod = error.response?.config?.method?.toUpperCase();
        const errorUrl = error.response?.config?.url;
        const message = `S3 Error: ${errorStatus} ${errorMethod} ${errorUrl}`;
        log({ level: "error", message, req });

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
