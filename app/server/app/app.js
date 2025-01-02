import cors from 'cors';
import express from 'express';
import basicAuth from 'express-basic-auth';
import helmet from 'helmet';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkClientRouteExists } from './middleware.js';
import routes from './routes/index.js';
import { getEnvironment } from './utilities/environment.js';
import {
  formatLogMsg,
  log,
  populateMetdataObjFromRequest,
} from './utilities/logger.js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

/* istanbul ignore next */
if (global.__coverage__) {
  const setupCypressCodeCoverage = await import(
    '@cypress/code-coverage/middleware/express'
  );
  setupCypressCodeCoverage.default(app);
}

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }),
);
app.use(
  helmet.hsts({
    maxAge: 31536000,
  }),
);

/****************************************************************
 Instruct web browsers to disable caching
 ****************************************************************/
app.use(function (req, res, next) {
  res.setHeader('Surrogate-Control', 'no-store');
  res.setHeader(
    'Cache-Control',
    'no-store, no-cache, must-revalidate, proxy-revalidate',
  );
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

/****************************************************************
 Revoke unneeded and potentially harmful HTTP methods
 ****************************************************************/
app.use(function (req, res, next) {
  const whiteList = ['GET', 'POST', 'OPTIONS', 'HEAD'];
  if (whiteList.indexOf(req.method) != -1) next();
  else {
    res.sendStatus(401);
    const metadataObj = populateMetdataObjFromRequest(req);
    log.debug(
      formatLogMsg(
        metadataObj,
        `Attempted use of unsupported HTTP method. HTTP method = ${req.method}`,
      ),
    );
  }
});

/****************************************************************
 Which environment
****************************************************************/
const { isLocal, isTest, isDevelopment, isStaging } = getEnvironment();

if (isLocal) {
  log.info('Environment = local');
  app.enable('isLocal');
}
if (isDevelopment) log.info('Environment = development');
if (isStaging) log.info('Environment = staging');
if (!isLocal && !isTest && !isDevelopment && !isStaging)
  log.info('Environment = staging or production');

/****************************************************************
 Required Environment Variables
****************************************************************/
// initialize to common variables
const requiredEnvVars = [
  'DB_NAME',
  'DB_USERNAME',
  'DB_PASSWORD',
  'SERVER_URL',
  'DB_POOL_MIN',
  'DB_POOL_MAX',
  'STREAM_BATCH_SIZE',
  'STREAM_HIGH_WATER_MARK',
  'MAX_QUERY_SIZE',
  'MAX_VALUES_QUERY_SIZE',
  'JSON_PAGE_SIZE',
];

if (isLocal || isTest) {
  requiredEnvVars.push('DB_HOST');
  requiredEnvVars.push('DB_PORT');
} else {
  requiredEnvVars.push('VCAP_SERVICES');
  requiredEnvVars.push('CF_S3_PUB_BUCKET_ID');
  requiredEnvVars.push('CF_S3_PUB_REGION');
  requiredEnvVars.push('CF_S3_PRIV_ACCESS_KEY');
  requiredEnvVars.push('CF_S3_PRIV_BUCKET_ID');
  requiredEnvVars.push('CF_S3_PRIV_REGION');
  requiredEnvVars.push('CF_S3_PRIV_SECRET_KEY');
}

requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    const message = `Required environment variable ${envVar} not found.`;
    log.error(message);
    process.exit();
  }
});

/****************************************************************
 Setup basic auth for non-production environments
****************************************************************/
if (isDevelopment || isStaging) {
  if (process.env.EQ_BASIC_USER_NAME) {
    log.info('EQ_BASIC_USER_NAME environmental variable found, continuing.');
  } else {
    let msg = 'EQ_BASIC_USER_NAME variable NOT set, exiting system.';
    log.error(msg);
    process.exit();
  }

  if (process.env.EQ_BASIC_USER_PWD) {
    log.info('EQ_BASIC_USER_PWD environmental variable found, continuing.');
  } else {
    let msg = 'EQ_BASIC_USER_PWD variable NOT set, exiting system.';
    log.error(msg);
    process.exit();
  }

  let users = {};
  users[process.env.EQ_BASIC_USER_NAME] = process.env.EQ_BASIC_USER_PWD;

  app.use(
    basicAuth({
      users: users,
      challenge: true,
      unauthorizedResponse: (req) =>
        req.auth ? 'Invalid credentials' : 'No credentials provided',
    }),
  );
}

/****************************************************************
Enable CORS
****************************************************************/
app.use(
  cors({
    methods: ['GET', 'POST', 'HEAD'],
  }),
);

/****************************************************************
 Setup server and routes
****************************************************************/
// parse json in body of post requests
app.use(express.json());

// If SERVER_BASE_PATH is provided, serve routes and static files from there (e.g. /csb)
const basePath = `${process.env.SERVER_BASE_PATH || ''}/`;

// setup server routes
routes(app, basePath);

// Use regex to add trailing slash on static requests (required when using sub path)
const pathRegex = new RegExp(`^\\${process.env.SERVER_BASE_PATH || ''}$`);
app.all(pathRegex, (req, res) => res.redirect(`${basePath}`));

// Serve client app's static built files
// NOTE: client app's `build` directory contents copied into server app's
// `public` directory in CI/CD step
app.use(basePath, express.static(path.join(__dirname, 'public')));

// Ensure that requested client route exists (otherwise send 404).
app.use(checkClientRouteExists);

// setup client routes (built React app)
app.get('*', function (req, res) {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

/****************************************************************
 Worse case error handling for 404 and 500 issues
 ****************************************************************/
/* Note, the React app should be handling 404 at this point 
   but we're leaving the below 404 check in for now */
app.use(function (req, res, next) {
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

app.use(function (err, req, res, next) {
  res.status(500).sendFile(path.join(__dirname, 'public', '500.html'));
});

export default app;
