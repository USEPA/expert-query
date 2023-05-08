import { knex } from './utilities/database.js';
import { getEnvironment } from './utilities/environment.js';
import {
  formatLogMsg,
  log,
  populateMetdataObjFromRequest,
} from './utilities/logger.js';

const environment = getEnvironment();

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

/**
 * Middleware to protect routes by checking that a secret key was provided and
 * matches the environment.
 *
 * @param {express.Request} req
 * @param {express.Response} res
 * @param {express.NextFunction} next
 */
function protectRoutes(req, res, next) {
  if (!environment.isLocal) {
    next();
    return;
  }

  const eqSecret = req.header('EQ-SECRET');

  const metadataObj = populateMetdataObjFromRequest(req);

  if (!eqSecret || eqSecret !== process.env.EQ_SECRET) {
    const errJson = {
      message: 'Unauthorized',
    };
    log.warn(formatLogMsg(metadataObj, errJson));
    return res.status(401).json(errJson);
  }

  next();
}

export { getActiveSchema, protectRoutes };
