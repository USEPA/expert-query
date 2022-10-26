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

let database_host = "";
let database_port = "";
const database_name = process.env.DB_NAME ?? "expert_query";
const database_user = process.env.DB_USERNAME;
const database_pwd = process.env.DB_PASSWORD;

if (process.env.NODE_ENV) {
  isLocal = "local" === process.env.NODE_ENV.toLowerCase();
  isDevelopment = "development" === process.env.NODE_ENV.toLowerCase();
  isStaging = "staging" === process.env.NODE_ENV.toLowerCase();
}

if (isLocal) {
  log.info("Since local, using a localhost Postgres database.");
  database_host = process.env.DB_HOST;
  database_port = process.env.DB_PORT;
} else {
  if (!process.env.VCAP_SERVICES) {
    log.error(
      "VCAP_SERVICES Information not found. Connection will not be attempted."
    );
    return;
  }

  log.info("Using VCAP_SERVICES Information to connect to Postgres.");
  let vcap_services = JSON.parse(process.env.VCAP_SERVICES);
  database_host = vcap_services["aws-rds"][0].credentials.host;
  database_port = vcap_services["aws-rds"][0].credentials.port;
}
log.info(`host: ${database_host}`);
log.info(`port: ${database_port}`);
log.info(`dbname: ${database_name}`);
log.info(`user: ${database_user}`);

// Setup sequelize for handling connection pooling, queries, sanitization, and models
const sequelize = new Sequelize(database_name, database_user, database_pwd, {
  host: database_host,
  port: database_port,
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

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
