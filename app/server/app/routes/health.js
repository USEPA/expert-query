const AWS = require("aws-sdk");
const express = require("express");
const { getActiveSchema } = require("../middleware");
const { readdirSync, statSync } = require("node:fs");
const { path, resolve } = require("node:path");
const { knex, mapping } = require("../utilities/database");

// Setups the config for the s3 bucket (default config is public S3 bucket)
function setAwsConfig({
  accessKeyId = process.env.CF_S3_PUB_ACCESS_KEY,
  secretAccessKey = process.env.CF_S3_PUB_SECRET_KEY,
  region = process.env.CF_S3_PUB_REGION,
} = {}) {
  const config = new AWS.Config({
    accessKeyId,
    secretAccessKey,
    region,
  });
  AWS.config.update(config);
}

let isLocal = false;
let isDevelopment = false;
let isStaging = false;

if (process.env.NODE_ENV) {
  isLocal = "local" === process.env.NODE_ENV.toLowerCase();
  isDevelopment = "development" === process.env.NODE_ENV.toLowerCase();
  isStaging = "staging" === process.env.NODE_ENV.toLowerCase();
}

const minDateTime = new Date(-8640000000000000);
const maxDateTime = new Date(8640000000000000);

module.exports = function (app) {
  const router = express.Router();

  router.use(getActiveSchema);

  router.get("/", function (req, res) {
    res.json({ status: "UP" });
  });

  router.get("/etlDatabase", async function (req, res) {
    try {
      // check etl status in db
      let query = knex
        .withSchema("logging")
        .from("etl_status")
        .select("database")
        .first();
      let results = await query;
      if (results.database === "failed") {
        res.status(200).json({ status: "FAILED-DB" });
        return;
      }

      // verify the latest entry in the schema table is active
      query = knex
        .withSchema("logging")
        .from("etl_schemas")
        .select("active", "creation_date")
        .orderBy("creation_date", "desc")
        .first();
      results = await query;
      if (!results.active) {
        res.status(200).json({ status: "FAILED-SCHEMA" });
        return;
      }

      // verify database updated in the last week, with 1 hour buffer
      const timeSinceLastUpdate =
        (Date.now() - results.creation_date) / (1000 * 60 * 60);
      if (timeSinceLastUpdate >= 169) {
        res.status(200).json({ status: "FAILED-TIME" });
        return;
      }

      // verify a query can be ran against each table in the active db
      for (const [profileName, profile] of Object.entries(mapping)) {
        query = knex
          .withSchema(req.activeSchema)
          .from(profile.tableName)
          .select(profile.idColumn)
          .limit(1)
          .first();
        results = await query;
        if (!results[profile.idColumn]) {
          res.status(200).json({ status: "FAILED-QUERY" });
          return;
        }
      }

      // everything passed
      res.status(200).json({ status: "UP" });
    } catch (err) {
      res.status(500).send("Error!" + err);
    }
  });

  router.get("/etlDomainValues", async function (req, res) {
    try {
      // check etl status in db
      const query = knex
        .withSchema("logging")
        .from("etl_status")
        .select("domain_values")
        .first();
      const results = await query;
      if (results.domain_values === "failed") {
        res.status(200).json({ status: "FAILED-DB" });
        return;
      }

      // initialize timeSinceLastUpdate to the minimum time node allows
      let timeSinceLastUpdate = minDateTime;

      // verify file update date is within the last week
      if (isLocal) {
        const path = resolve(__dirname, `../content-etl/domainValues`);

        // get hours since file last modified
        const files = readdirSync(path);

        let oldestModifiedDate = maxDateTime;
        files.forEach((file) => {
          const stats = statSync(`${path}/${file}`);
          if (stats.mtime < oldestModifiedDate)
            oldestModifiedDate = stats.mtime;
        });

        timeSinceLastUpdate =
          (Date.now() - oldestModifiedDate) / (1000 * 60 * 60);
      } else {
        // setup public s3 bucket
        setAwsConfig();

        const s3 = new AWS.S3({ apiVersion: "2006-03-01" });

        // get a list of files in the directory
        const data = await s3
          .listObjects({
            Bucket: process.env.CF_S3_PUB_BUCKET_ID,
            Prefix: "content-etl/domainValues",
          })
          .promise();

        let oldestModifiedDate = maxDateTime;
        data.Contents.forEach((file) => {
          if (file.LastModified < oldestModifiedDate)
            oldestModifiedDate = file.LastModified;
        });

        timeSinceLastUpdate =
          (Date.now() - oldestModifiedDate) / (1000 * 60 * 60);
      }

      // check that domain values was updated in the last week and 1 hour
      res
        .status(200)
        .json({ status: timeSinceLastUpdate >= 169 ? "FAILED-FILE" : "UP" });
    } catch (err) {
      res.status(500).send("Error!" + err);
    }
  });

  router.get("/etlGlossary", async function (req, res) {
    try {
      // check etl status in db
      const query = knex
        .withSchema("logging")
        .from("etl_status")
        .select("glossary")
        .first();
      const results = await query;
      if (results.glossary === "failed") {
        res.status(200).json({ status: "FAILED-DB" });
        return;
      }

      // initialize timeSinceLastUpdate to the minimum time node allows
      let timeSinceLastUpdate = new Date(-8640000000000000);

      // verify file update date is within the last 24 hours
      if (isLocal) {
        const path = resolve(__dirname, `../content-etl/glossary.json`);

        // get hours since file last modified
        const stats = statSync(path);
        timeSinceLastUpdate = (Date.now() - stats.mtime) / (1000 * 60 * 60);
      } else {
        // setup public s3 bucket
        setAwsConfig();

        const s3 = new AWS.S3({ apiVersion: "2006-03-01" });

        // get a list of files in the directory
        const data = await s3
          .getObject({
            Bucket: process.env.CF_S3_PUB_BUCKET_ID,
            Key: "content-etl/glossary.json",
          })
          .promise();

        timeSinceLastUpdate =
          (Date.now() - data.LastModified) / (1000 * 60 * 60);
      }

      // check that glossary was updated in the last 25 hours
      res
        .status(200)
        .json({ status: timeSinceLastUpdate >= 24.5 ? "FAILED-FILE" : "UP" });
    } catch (err) {
      res.status(500).send("Error!" + err);
    }
  });

  app.use("/health", router);
};
