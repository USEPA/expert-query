const { resolve } = require("node:path");
const { readFile } = require("node:fs/promises");
const express = require("express");
const axios = require("axios");
const Op = require("sequelize").Op;
const logger = require("../utilities/logger");
const log = logger.logger;
const { getActiveSchema } = require("../middleware");
const Assessment = require("../models").Assessment;
const ProfileTest = require("../models").ProfileTest;

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
  try {
    return model
      .schema(req.activeSchema)
      .findAndCountAll({
        where: parseCriteria(model.name, req.query),
      })
      .then((data) => res.status(200).send(data))
      .catch((error) => res.status(500).send("Error! " + error));
  } catch (error) {
    log.error(`Failed to get data from the "${model.name}" profile...`);
    return res.status(500).send("Error !" + error);
  }
}

function executeQueryCountOnly(model, req, res, next) {
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
