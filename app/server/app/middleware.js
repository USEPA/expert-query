import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { knex, queryPool } from './utilities/database.js';
import { getEnvironment } from './utilities/environment.js';
import { getPrivateConfig } from './utilities/s3.js';
import {
  formatLogMsg,
  log,
  populateMetdataObjFromRequest,
} from './utilities/logger.js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const environment = getEnvironment();

function checkClientRouteExists(req, res, next) {
  const subPath = process.env.SERVER_BASE_PATH || '';

  const clientRoutes = [
    '/',
    '/api-documentation',
    '/api-key-signup',
    '/attains',
    '/attains/actions',
    '/attains/assessments',
    '/attains/assessmentUnits',
    '/attains/assessmentUnitsMonitoringLocations',
    '/attains/catchmentCorrespondence',
    '/attains/sources',
    '/attains/tmdl',
    '/national-downloads',
  ].map((route) => `${subPath}${route}`);

  if (!clientRoutes.includes(req.path)) {
    return res.status(404).sendFile(path.join(__dirname, 'public', '400.html'));
  }

  next();
}

/**
 * Middleware to get/set the active schema and add it to the original request
 *
 * @param {express.Request} req
 * @param {express.Response} res
 * @param {express.NextFunction} next
 */
async function getActiveSchema(req, res, next) {
  const metadataObj = populateMetdataObjFromRequest(req);

  try {
    // query the logging schema to get the active schema
    const schema = await queryPool(
      knex
        .withSchema('logging')
        .select('schema_name', 'active')
        .from('etl_schemas')
        .where('active', true)
        .orderBy('creation_date', 'desc'),
      true,
    );

    // Add activeSchema to the request object
    req.activeSchema = schema.schema_name;

    next();
  } catch (error) {
    log.error(
      formatLogMsg(metadataObj, 'Failed to get active schema: ', error),
    );
    return res.status(500).json({ message: 'Error !' + error });
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
async function protectRoutes(req, res, next) {
  if (environment.isLocal) {
    next();
    return;
  }

  const eqSecret = req.header('EQ-SECRET');

  function handleError(message = 'Unauthorized', status = 401) {
    const metadataObj = populateMetdataObjFromRequest(req);
    const errJson = { message };
    log.warn(formatLogMsg(metadataObj, errJson));
    return res.status(status).json(errJson);
  }

  if (!eqSecret || eqSecret !== process.env.EQ_SECRET) return handleError();

  // For dev and stage only, check if user-id is authorized
  if (environment.isDevelopment || environment.isStaging) {
    const apiUserId = req.header('x-api-user-id');

    // get config from private S3 bucket
    const privateConfig = await getPrivateConfig();
    if (!privateConfig?.approvedUsers) {
      return handleError('Server failed to load configuration', 500);
    }

    const approvedUserIds = privateConfig.approvedUsers.map(
      (user) => user.userId,
    );

    // check if apiUserId is approved
    if (!approvedUserIds.includes(apiUserId)) return handleError();
  }

  next();
}

export { checkClientRouteExists, getActiveSchema, protectRoutes };
