const logger = require("../utilities/logger");
const log = logger.logger;

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
  log.info("Using VCAP_SERVICES Information to connect to Postgres.");
  let vcap_services = JSON.parse(process.env.VCAP_SERVICES);
  dbHost = vcap_services["aws-rds"][0].credentials.host;
  dbPort = vcap_services["aws-rds"][0].credentials.port;
}
log.info(`host: ${dbHost}`);
log.info(`port: ${dbPort}`);
log.info(`dbName: ${dbName}`);
log.info(`user: ${dbUser}`);
log.info(`DB_POOL_MIN: ${parseInt(process.env.DB_POOL_MIN)}`);
log.info(`DB_POOL_MAX: ${parseInt(process.env.DB_POOL_MAX)}`);
log.info(`STREAM_BATCH_SIZE: ${parseInt(process.env.STREAM_BATCH_SIZE)}`);
log.info(
  `STREAM_HIGH_WATER_MARK: ${parseInt(process.env.STREAM_HIGH_WATER_MARK)}`
);

const knex = require("knex")({
  client: "pg",
  connection: {
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    database: dbName,
  },
  pool: {
    min: parseInt(process.env.DB_POOL_MIN),
    max: parseInt(process.env.DB_POOL_MAX),
  },
});

module.exports = {
  knex,
};
