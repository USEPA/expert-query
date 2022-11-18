const path = require("path");
const express = require("express");
const helmet = require("helmet");
const logger = require("./utilities/logger");
const log = logger.logger;

const app = express();
const browserSyncPort = 9091;
let port = process.env.PORT || 9090;

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);
app.use(
  helmet.hsts({
    maxAge: 31536000,
  })
);

/****************************************************************
 Instruct web browsers to disable caching
 ****************************************************************/
app.use(function (req, res, next) {
  res.setHeader("Surrogate-Control", "no-store");
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate"
  );
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});

/****************************************************************
 Revoke unneeded and potentially harmful HTTP methods
 ****************************************************************/
app.use(function (req, res, next) {
  var whiteList = ["GET", "POST", "HEAD"];
  if (whiteList.indexOf(req.method) != -1) next();
  else {
    res.sendStatus(401);
    var metadataObj = logger.populateMetdataObjFromRequest(req);
    log.error(
      logger.formatLogMsg(
        metadataObj,
        `Attempted use of unsupported HTTP method. HTTP method = ${req.method}`
      )
    );
  }
});

/****************************************************************
 Which environment
****************************************************************/
var isLocal = false;
var isDevelopment = false;
var isStaging = false;

if (process.env.NODE_ENV) {
  isLocal = "local" === process.env.NODE_ENV.toLowerCase();
  isDevelopment = "development" === process.env.NODE_ENV.toLowerCase();
  isStaging = "staging" === process.env.NODE_ENV.toLowerCase();
}

if (isLocal) {
  log.info("Environment = local");
  app.enable("isLocal");
}
if (isDevelopment) log.info("Environment = development");
if (isStaging) log.info("Environment = staging");
if (!isLocal && !isDevelopment && !isStaging)
  log.info("Environment = staging or production");

/****************************************************************
 Required Environment Variables
****************************************************************/
// initialize to common variables
const requiredEnvVars = ["DB_NAME", "DB_USERNAME", "DB_PASSWORD"];

if (isLocal) {
  requiredEnvVars.push("DB_HOST");
  requiredEnvVars.push("DB_PORT");
} else {
  requiredEnvVars.push("VCAP_SERVICES");
  requiredEnvVars.push("CF_S3_PUB_BUCKET_ID");
  requiredEnvVars.push("CF_S3_PUB_REGION");
}

requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    const message = `Required environment variable ${envVar} not found.`;
    log.error(message);
    process.exit();
  }
});

/****************************************************************
Enable CORS for local environment proxy use
****************************************************************/
if (isLocal) {
  app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept"
    );
    res.header("X-Frame-Options", "allow-from http://localhost:3000/");
    next();
  });
}

/****************************************************************
 Setup server and routes
****************************************************************/
// serve static assets normally
app.use(express.static(__dirname + "/public"));

// parse json in body of post requests
app.use(express.json());

// setup server routes
require("./routes")(app);

// setup client routes (built React app)
app.get("*", function (req, res) {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

// for local testing of the production flow, use the same port as browersync to avoid
// different port usage to confuse testers/developers
if (port === 9090 && !isLocal) port = browserSyncPort;

app.listen(port, function () {
  if (isLocal) {
    const browserSync = require("browser-sync");

    log.info(`Application listening on port ${browserSyncPort}`);

    browserSync({
      files: [path.join(__dirname, "/public/**")],
      online: false,
      open: false,
      port: browserSyncPort,
      proxy: "localhost:" + port,
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
  res.status(404).sendFile(path.join(__dirname, "public", "400.html"));
});

app.use(function (err, req, res, next) {
  res.status(500).sendFile(path.join(__dirname, "public", "500.html"));
});
