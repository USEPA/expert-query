export const assessments = `CREATE TABLE IF NOT EXISTS assessments
  (
id SERIAL PRIMARY KEY,
reporting_cycle
assessment_unit_id
assessment_unit_name
organization_id
organization_name
organization_type
overall_status
region
state
ir_category
  )`;
export const etlLog = `CREATE TABLE IF NOT EXISTS logging.etl_log
  (
    id SERIAL PRIMARY KEY,
    end_time timestamp,
    load_error varchar,
    start_time timestamp NOT NULL
  )`;

export const etlSchemas = `CREATE TABLE IF NOT EXISTS logging.etl_schemas
  (
    id SERIAL PRIMARY KEY,
    active BOOLEAN NOT NULL,
    creation_date TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    schema_name varchar(20) NOT NULL
  )`;

// TEST TABLE
export const profileTest = `CREATE TABLE IF NOT EXISTS profile_test
  (
    id SERIAL PRIMARY KEY,
    assessment_name varchar(20) NOT NULL
  )`;
