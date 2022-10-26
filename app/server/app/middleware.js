const express = require("express");
const logger = require("./utilities/logger");
const log = logger.logger;
const etlSchema = require("./models").etlSchema;

/**
 * Middleware to get/set the active schema and add it to the original request
 *
 * @param {express.Request} req
 * @param {express.Response} res
 * @param {express.NextFunction} next
 */
async function getActiveSchema(req, res, next) {
  try {
    // query the logging schema to get the active schema
    const schema = await etlSchema.findOne({
      where: { active: true },
      attributes: ["schemaName", "active"],
      order: [["creationDate", "DESC"]],
    });

    // Add activeSchema to the request object
    req.activeSchema = schema.schemaName;

    next();
  } catch (error) {
    log.error("Failed to get active schema...");
    res.status(400).send("Error !" + error);
  }
}

module.exports = {
  getActiveSchema,
};
