export const etlLog = `CREATE TABLE IF NOT EXISTS logging.etl_log
  (
    id SERIAL PRIMARY KEY,
    start_time timestamp NOT NULL,
    end_time timestamp,
    load_error varchar
  )`;

export const etlCurrent = `CREATE TABLE IF NOT EXISTS logging.etl_current
  (
    id SERIAL PRIMARY KEY,
    schema_name varchar(20) NOT NULL,
    creation_date DATE NOT NULL
  )`;

export const profileTest = `CREATE TABLE IF NOT EXISTS profile_test
  (
    id SERIAL PRIMARY KEY,
    assessment_name varchar(20) NOT NULL
  )`;
