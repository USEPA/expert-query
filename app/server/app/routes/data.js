const { resolve } = require("node:path");
const { readFile } = require("node:fs/promises");
const express = require("express");
const axios = require("axios");
const logger = require("../utilities/logger");
const log = logger.logger;
const { getActiveSchema } = require("../middleware");
const Assessment = require("../models").Assessment;

module.exports = function (app) {
  const router = express.Router();

  router.use(getActiveSchema);

  // --- get assessments from database
  router.get("/assessments", function (req, res, next) {
    try {
      return Assessment.schema(req.activeSchema)
        .findAndCountAll({})
        .then((assessments) => res.status(200).send(assessments))
        .catch((error) => res.status(500).send("Error! " + error));
    } catch (error) {
      log.error("Failed to get assessments...");
      return res.status(500).send("Error !" + error);
    }
  });

  app.use("/attains/data", router);
};
