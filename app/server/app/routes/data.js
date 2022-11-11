const axios = require("axios");
const express = require("express");
const { resolve } = require("node:path");
const Papa = require("papaparse");
const Op = require("sequelize").Op;
const Excel = require("exceljs");
const { getActiveSchema } = require("../middleware");
const Assessment = require("../models").Assessment;
const ProfileTest = require("../models").ProfileTest;
const logger = require("../utilities/logger");
const log = logger.logger;
const streamData = require("../utilities/streamingService");

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

function parseArrayParam(param) {
  let result = [];

  if (param) {
    const parsedParam = tryParseJSON(param);
    if (Array.isArray(parsedParam.value)) {
      result = parsedParam.value;
    } else {
      result = [parsedParam.value];
    }
  }

  return result;
}

function parseCriteria(profile, query) {
  switch (profile) {
    case "Assessment":
      return {
        [Op.and]: [
          { id: { [Op.or]: parseArrayParam(query.id) } },
          {
            reportingCycle: { [Op.or]: parseArrayParam(query.reportingCycle) },
          },
          {
            assessmentUnitId: {
              [Op.or]: parseArrayParam(query.assessmentUnitId),
            },
          },
          {
            assessmentUnitName: {
              [Op.or]: parseArrayParam(query.assessmentUnitName),
            },
          },
          {
            organizationId: { [Op.or]: parseArrayParam(query.organizationId) },
          },
          {
            organizationName: {
              [Op.or]: parseArrayParam(query.organizationName),
            },
          },
          {
            organizationType: {
              [Op.or]: parseArrayParam(query.organizationType),
            },
          },
          {
            overallStatus: { [Op.or]: parseArrayParam(query.overallStatus) },
          },
          {
            region: { [Op.or]: parseArrayParam(query.region) },
          },
          {
            state: { [Op.or]: parseArrayParam(query.state) },
          },
          {
            irCategory: { [Op.or]: parseArrayParam(query.irCategory) },
          },
        ],
      };
    case "ProfileTest":
      return {
        [Op.or]: [
          { id: { [Op.or]: parseArrayParam(query.id) } },
          {
            assessmentName: { [Op.or]: parseArrayParam(query.assessmentName) },
          },
        ],
      };
    default:
      return {};
  }
}

function executeQuery(model, req, res, next) {
  // output types csv, tab-separated, Excel, or JSON
  try {
    return model
      .schema(req.activeSchema)
      .findAndCountAll({
        where: parseCriteria(model.name, req.query),
      })
      .then(async (data) => {
        const format = req.query.format ?? req.query.f;
        switch (format) {
          case "csv":
          case "tsv":
            // convert json to CSV or TSV
            const out = Papa.unparse(JSON.stringify(data.rows), {
              delimiter: format === "tsv" ? "\t" : ",",
            });

            // output the data
            res.setHeader(
              "Content-disposition",
              `attachment; filename=${model.name}.${format}`
            );
            streamData(res, out, {
              contentType: `text/${format}`,
            });
            break;
          case "xlsx":
            res.statusCode = 200;
            res.setHeader(
              "Content-Type",
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );
            res.setHeader(
              "Content-Disposition",
              `attachment; filename=${model.name}.xlsx`
            );

            const workbook = new Excel.stream.xlsx.WorkbookWriter({
              stream: res,
              useStyles: true,
            });

            workbook.addWorksheet(model.name);
            const worksheet = workbook.getWorksheet(model.name);

            const rowsJson = JSON.parse(JSON.stringify(data.rows));

            worksheet.columns = Object.keys(rowsJson[0]).map((key) => {
              return { header: key, key };
            });

            rowsJson.forEach((row) => {
              worksheet.addRow(row).commit();
            });

            workbook.commit().then(
              function () {
                res.end();
              },
              function (err) {
                log.info("Error! " + err);
                res.status(500).send("Error! " + err);
              }
            );
            break;
          case "json":
          default:
            res.setHeader(
              "Content-disposition",
              `attachment; filename=${model.name}.json`
            );
            streamData(res, data, {
              contentType: "application/json; charset=utf-8",
            });
            break;
        }
      })
      .catch((error) => res.status(500).send("Error! " + error));
  } catch (error) {
    log.error(`Failed to get data from the "${model.name}" profile...`);
    return res.status(500).send("Error !" + error);
  }
}

function executeQueryCountOnly(model, req, res, next) {
  // always return json with the count
  try {
    return model
      .schema(req.activeSchema)
      .count({
        where: parseCriteria(model.name, req.query),
      })
      .then((count) => res.status(200).send({ count }))
      .catch((error) => res.status(500).send("Error! " + error));
  } catch (error) {
    log.error(`Failed to get count from the "${model.name}" profile...`);
    return res.status(500).send("Error !" + error);
  }
}

module.exports = function (app) {
  const router = express.Router();

  router.use(getActiveSchema);

  // --- get assessments from database
  router.get("/assessments", function (req, res, next) {
    executeQuery(Assessment, req, res, next);
  });
  router.get("/assessments/count", function (req, res, next) {
    executeQueryCountOnly(Assessment, req, res, next);
  });

  // --- get profile_test from database
  router.get("/profileTests", function (req, res, next) {
    executeQuery(ProfileTest, req, res, next);
  });
  router.get("/profileTests/count", function (req, res, next) {
    executeQueryCountOnly(ProfileTest, req, res, next);
  });

  app.use("/data", router);
};
