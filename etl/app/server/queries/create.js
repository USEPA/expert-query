export const etlLog = `CREATE TABLE IF NOT EXISTS logging.etlLog
  (
    id SERIAL PRIMARY KEY,
    "startTime" timestamp NOT NULL,
    "endTime" timestamp,
    "loadError" varchar,
  )`;
