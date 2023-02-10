const express = require('express');
const { knex } = require('./utilities/database');
const logger = require('./utilities/logger');
const log = logger.logger;

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
    const schema = await knex
      .withSchema('logging')
      .select('schema_name', 'active')
      .from('etl_schemas')
      .where('active', true)
      .orderBy('creation_date', 'desc')
      .first();

    // Add activeSchema to the request object
    req.activeSchema = schema.schema_name;

    next();
  } catch (error) {
    log.error('Failed to get active schema: ', error);
    res.status(500).send('Error !' + error);
  }
}

module.exports = {
  getActiveSchema,
};
