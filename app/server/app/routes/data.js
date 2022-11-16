const express = require("express");
const Excel = require("exceljs");
const { getActiveSchema } = require("../middleware");
const { knex } = require("../utilities/database");
const logger = require("../utilities/logger");
const log = logger.logger;
const StreamingService = require("../utilities/streamingService");

/**
 * Tries to parse the provided string value to JSON.
 * @param {string} value
 * @returns The json representation of the provided value along with whether or not the original value was json
 */
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

/**
 * Appends to the where clause of the provided query.
 * @param {Object} query KnexJS query object
 * @param {string} paramName column name
 * @param {string} paramValue URL query value
 */
function appendToWhere(query, paramName, paramValue) {
  if (!paramValue) return;

  const parsedParam = tryParseJSON(paramValue);

  if (Array.isArray(parsedParam.value)) {
    query.whereIn(paramName, parsedParam.value);
  } else {
    query.where(paramName, parsedParam.value);
  }
}

/**
 * Builds the select clause and where clause of the query based on the provided
 * profile name.
 * @param {Object} query KnexJS query object
 * @param {string} profile name of the profile being queried
 * @param {Object} queryParams URL query value
 */
function parseCriteria(query, profile, queryParams, countOnly = false) {
  switch (profile) {
    case "assessments":
      if (countOnly) {
        query.count("id");
      } else {
        query.select(
          "id",
          "reporting_cycle as reportingCycle",
          "assessment_unit_id as assessmentUnitId",
          "assessment_unit_name as assessmentUnitName",
          "organization_id as organizationId",
          "organization_name as organizationName",
          "organization_type as organizationType",
          "overall_status as overallStatus",
          "region",
          "state",
          "ir_category as irCategory"
        );
      }

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
      if (countOnly) {
        query.count("id");
      } else {
        query.select("id", "assessment_name as assessmentName");
      }
      appendToWhere(query, "id", queryParams.id);
      appendToWhere(query, "assessment_name", queryParams.assessmentName);
      break;
    default:
      break;
  }
}

/**
 * Runs a query against the provided profile name and streams the result to the
 * client as csv, tsv, xlsx, json file, or inline json.
 * @param {string} profile name of the profile being queried
 * @param {express.Request} req
 * @param {express.Response} res
 */
async function executeQuery(profile, req, res) {
  // output types csv, tab-separated, Excel, or JSON
  try {
    const query = knex.withSchema(req.activeSchema).from(profile);

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
        res.setHeader(
          "Content-disposition",
          `attachment; filename=${profile}.json`
        );
        StreamingService.streamResponse(res, stream, format);
        break;
      default:
        StreamingService.streamResponse(res, stream, format);
        break;
    }
  } catch (error) {
    log.error(`Failed to get data from the "${profile}" profile...`);
    return res.status(500).send("Error !" + error);
  }
}

/**
 * Runs a query against the provided profile name and returns the number of records.
 * @param {string} profile name of the profile being queried
 * @param {express.Request} req
 * @param {express.Response} res
 */
function executeQueryCountOnly(profile, req, res) {
  // always return json with the count
  try {
    const query = knex.withSchema(req.activeSchema).from(profile).first();

    parseCriteria(query, profile, req.query, true);

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
  router.get("/assessments", function (req, res) {
    executeQuery("assessments", req, res);
  });
  router.get("/assessments/count", function (req, res) {
    executeQueryCountOnly("assessments", req, res);
  });

  // --- get profile_test from database
  router.get("/profileTests", function (req, res) {
    executeQuery("profile_test", req, res);
  });
  router.get("/profileTests/count", function (req, res) {
    executeQueryCountOnly("profile_test", req, res);
  });

  app.use("/attains/data", router);
};
