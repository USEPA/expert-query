const fs = require("fs");
const path = require("path");
const Sequelize = require("sequelize");
const basename = path.basename(__filename);
const db = {};
const logger = require("../utilities/logger.js");
const log = logger.logger;
require("dotenv").config();

let isLocal = false;
let isDevelopment = false;
let isStaging = false;

let dbHost = "";
let dbPort = "";
const dbName = process.env.DB_NAME ?? "expert_query";
const dbUser = process.env.DB_USERNAME;
const dbPassword = process.env.DB_PASSWORD;

if (process.env.NODE_ENV) {
  isLocal = "local" === process.env.NODE_ENV.toLowerCase();
  isDevelopment = "development" === process.env.NODE_ENV.toLowerCase();
  isStaging = "staging" === process.env.NODE_ENV.toLowerCase();
}

if (isLocal) {
  log.info("Since local, using a localhost Postgres database.");
  dbHost = process.env.DB_HOST;
  dbPort = process.env.DB_PORT;
} else {
  if (!process.env.VCAP_SERVICES) {
    log.error(
      "VCAP_SERVICES Information not found. Connection will not be attempted."
    );
    return;
  }

  log.info("Using VCAP_SERVICES Information to connect to Postgres.");
  let vcap_services = JSON.parse(process.env.VCAP_SERVICES);
  dbHost = vcap_services["aws-rds"][0].credentials.host;
  dbPort = vcap_services["aws-rds"][0].credentials.port;
}
log.info(`host: ${dbHost}`);
log.info(`port: ${dbPort}`);
log.info(`dbName: ${dbName}`);
log.info(`user: ${dbUser}`);

// Setup sequelize for handling connection pooling, queries, sanitization, and models
const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
  host: dbHost,
  port: dbPort,
  dialect: "postgres",
  pool: {
    max: 20,
    min: 5,
    acquire: 30000,
    idle: 10000,
  },
  logging: log.debug.bind(log),
});

fs.readdirSync(__dirname)
  .filter((file) => {
    return (
      file.indexOf(".") !== 0 && file !== basename && file.slice(-3) === ".js"
    );
  })
  .forEach((file) => {
    const model = require(path.join(__dirname, file))(
      sequelize,
      Sequelize.DataTypes
    );
    db[model.name] = model;
  });

module.exports = db;
