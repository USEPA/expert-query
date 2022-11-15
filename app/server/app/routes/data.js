const axios = require("axios");
const express = require("express");
const { resolve } = require("node:path");
const Papa = require("papaparse");
const pg = require("pg");
const QueryStream = require("pg-query-stream");
const Excel = require("exceljs");
const { getActiveSchema } = require("../middleware");
const { knex } = require("../utilities/database");
const logger = require("../utilities/logger");
const log = logger.logger;
const StreamingService = require("../utilities/streamingService");

function tryParseJSON(value) {
  try {
    return {
      isJSON: true,
      value: JSON.parse(value),
    };
  } catch (e) {
    return {
      isJSON: false,
      value,
    };
  }
}

function appendToWhere(query, paramName, paramValue) {
  if (!paramValue) return;

  const parsedParam = tryParseJSON(paramValue);

  if (Array.isArray(parsedParam.value)) {
    query.whereIn(paramName, parsedParam.value);
  } else {
    query.where(paramName, parsedParam.value);
  }
}

function parseCriteria(query, profile, queryParams) {
  switch (profile) {
    case "assessments":
      appendToWhere(query, "id", queryParams.id);
      appendToWhere(query, "reporting_cycle", queryParams.reportingCycle);
      appendToWhere(query, "assessment_unit_id", queryParams.assessmentUnitId);
      appendToWhere(
        query,
        "assessment_unit_name",
        queryParams.assessmentUnitName
      );
      appendToWhere(query, "organization_id", queryParams.organizationId);
      appendToWhere(query, "organization_name", queryParams.organizationName);
      appendToWhere(query, "organization_type", queryParams.organizationType);
      appendToWhere(query, "overall_status", queryParams.overallStatus);
      appendToWhere(query, "region", queryParams.region);
      appendToWhere(query, "state", queryParams.state);
      appendToWhere(query, "ir_category", queryParams.irCategory);
      break;
    case "profile_test":
      appendToWhere(query, "id", queryParams.id);
      appendToWhere(query, "assessment_name", queryParams.assessmentName);
      break;
    default:
      break;
  }
}

async function executeQuery(profile, req, res, next) {
  // output types csv, tab-separated, Excel, or JSON
  try {
    const query = knex.withSchema(req.activeSchema).select("*").from(profile);

    parseCriteria(query, profile, req.query);

    const stream = await query.stream({
      batchSize: 2000,
      highWaterMark: 10000,
    });

    const format = req.query.format ?? req.query.f;
    switch (format) {
      case "csv":
      case "tsv":
        // output the data
        res.setHeader(
          "Content-disposition",
          `attachment; filename=${profile}.${format}`
        );
        StreamingService.streamResponse(res, stream, format);
        break;
      case "xlsx":
        res.setHeader(
          "Content-Disposition",
          `attachment; filename=${profile}.xlsx`
        );

        const workbook = new Excel.stream.xlsx.WorkbookWriter({
          stream: res,
          useStyles: true,
        });

        workbook.addWorksheet(profile);
        const worksheet = workbook.getWorksheet(profile);

        StreamingService.streamResponse(res, stream, format, {
          workbook,
          worksheet,
        });
        break;
      case "json":
      default:
        res.setHeader(
          "Content-disposition",
          `attachment; filename=${profile}.json`
        );
        StreamingService.streamResponse(res, stream, format);
        break;
    }
  } catch (error) {
    log.error(`Failed to get data from the "${profile}" profile...`);
    return res.status(500).send("Error !" + error);
  }
}

function executeQueryCountOnly(profile, req, res, next) {
  // always return json with the count
  try {
    const query = knex
      .withSchema(req.activeSchema)
      .count("id")
      .from(profile)
      .first();

    parseCriteria(query, profile, req.query);

    query
      .then((count) => res.status(200).send(count))
      .catch((error) => {
        log.error(`Failed to get count from the "${profile.name}" profile...`);
        res.status(500).send("Error! " + error);
      });
  } catch (error) {
    log.error(`Failed to get count from the "${profile.name}" profile...`);
    return res.status(500).send("Error !" + error);
  }
}

module.exports = function (app) {
  const router = express.Router();

  router.use(getActiveSchema);

  // --- get assessments from database
  router.get("/assessments", function (req, res, next) {
    executeQuery("assessments", req, res, next);
  });
  router.get("/assessments/count", function (req, res, next) {
    executeQueryCountOnly("assessments", req, res, next);
  });

  // --- get profile_test from database
  router.get("/profileTests", function (req, res, next) {
    executeQuery("profile_test", req, res, next);
  });
  router.get("/profileTests/count", function (req, res, next) {
    executeQueryCountOnly("profile_test", req, res, next);
  });

  app.use("/data", router);
};
