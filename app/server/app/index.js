import browserSync from 'browser-sync';
import cors from 'cors';
import express from 'express';
import basicAuth from 'express-basic-auth';
import helmet from 'helmet';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import routes from './routes/index.js';
import { getEnvironment } from './utilities/environment.js';
import {
  formatLogMsg,
  log,
  populateMetdataObjFromRequest,
} from './utilities/logger.js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const browserSyncPort = 9091;
let port = process.env.PORT || 9090;

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
    log.error(
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
const { isLocal, isDevelopment, isStaging } = getEnvironment();

if (isLocal) {
  log.info('Environment = local');
  app.enable('isLocal');
}
if (isDevelopment) log.info('Environment = development');
if (isStaging) log.info('Environment = staging');
if (!isLocal && !isDevelopment && !isStaging)
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
  'JSON_PAGE_SIZE',
];

if (isLocal) {
  requiredEnvVars.push('DB_HOST');
  requiredEnvVars.push('DB_PORT');
} else {
  requiredEnvVars.push('VCAP_SERVICES');
  requiredEnvVars.push('CF_S3_PUB_BUCKET_ID');
  requiredEnvVars.push('CF_S3_PUB_REGION');
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
Enable CORS/Preflight/OPTIONS request
****************************************************************/
app.options(
  '*',
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

// setup client routes (built React app)
app.get('*', function (req, res) {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// for local testing of the production flow, use the same port as browersync to avoid
// different port usage to confuse testers/developers
if (port === 9090 && !isLocal) port = browserSyncPort;

app.listen(port, function () {
  if (isLocal) {
    log.info(`Application listening on port ${browserSyncPort}`);

    browserSync({
      files: [path.join(__dirname, '/public/**')],
      online: false,
      open: false,
      port: browserSyncPort,
      proxy: 'localhost:' + port,
      ui: false,
    });
  } else {
    log.info(`Application listening on port ${port}`);
  }
});

/****************************************************************
 Worse case error handling for 404 and 500 issues
 ****************************************************************/
/* Note, the React app should be handling 404 at this point 
   but we're leaving the below 404 check in for now */
app.use(function (req, res, next) {
  res.status(404).sendFile(path.join(__dirname, 'public', '400.html'));
});

app.use(function (err, req, res, next) {
  res.status(500).sendFile(path.join(__dirname, 'public', '500.html'));
});
