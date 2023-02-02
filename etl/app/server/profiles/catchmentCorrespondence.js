import { extract as innerExtract } from './materializedViewsExtract.js';
import pgPromise from 'pg-promise';

const pgp = pgPromise({ capSQL: true });

/*
## Exports
*/

// Properties

export const tableName = 'catchment_correspondence';
const indexTableName = tableName.replaceAll('_', '');

export const createQuery = `CREATE TABLE IF NOT EXISTS ${tableName}
  (
    objectid INTEGER PRIMARY KEY,
    state VARCHAR(4000),
    region VARCHAR(2),
    organizationid VARCHAR(30) NOT NULL,
    organizationname VARCHAR(150) NOT NULL,
    organizationtype VARCHAR(30) NOT NULL,
    reportingcycle NUMERIC(4,0) NOT NULL,
    assessmentunitid VARCHAR(50) NOT NULL,
    assessmentunitname VARCHAR(255) NOT NULL,
    catchmentnhdplusid BIGINT
  )`;

export const createIndexes = `
  CREATE INDEX IF NOT EXISTS ${indexTableName}_assessmentunitid_asc
    ON ${tableName} USING btree
    (assessmentunitid COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;

  CREATE INDEX IF NOT EXISTS ${indexTableName}_assessmentunitname_asc
    ON ${tableName} USING btree
    (assessmentunitname COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;

  CREATE INDEX IF NOT EXISTS ${indexTableName}_organizationid_asc
    ON ${tableName} USING btree
    (organizationid COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;

  CREATE INDEX IF NOT EXISTS ${indexTableName}_organizationname_asc
    ON ${tableName} USING btree
    (organizationname COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;

  CREATE INDEX IF NOT EXISTS ${indexTableName}_region_asc
    ON ${tableName} USING btree
    (region COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;

  CREATE INDEX IF NOT EXISTS ${indexTableName}_reportingcycle_desc
    ON ${tableName} USING btree
    (reportingcycle DESC NULLS LAST)
    TABLESPACE pg_default;

  CREATE INDEX IF NOT EXISTS ${indexTableName}_state_asc
    ON ${tableName} USING btree
    (state COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;
`;

const insertColumns = new pgp.helpers.ColumnSet([
  { name: 'objectid' },
  { name: 'assessmentunitid' },
  { name: 'assessmentunitname' },
  { name: 'catchmentnhdplusid' },
  { name: 'organizationid' },
  { name: 'organizationname' },
  { name: 'organizationtype' },
  { name: 'region' },
  { name: 'reportingcycle' },
  { name: 'state' },
]);

// Methods

export async function extract(s3Config, next = 0, retryCount = 0) {
  return await innerExtract(
    'profile_catchment_correspondence',
    s3Config,
    next,
    retryCount,
  );
}

export async function transform(data, first) {
  const rows = [];
  data.forEach((datum) => {
    rows.push({
      objectid: datum.objectid,
      assessmentunitid: datum.assessmentunitid,
      assessmentunitname: datum.assessmentunitname,
      catchmentnhdplusid: datum.catchmentnhdplusid,
      organizationid: datum.organizationid,
      organizationname: datum.organizationname,
      organizationtype: datum.organizationtype,
      region: datum.region,
      reportingcycle: datum.reportingcycle,
      state: datum.state,
    });
  });
  return pgp.helpers.insert(rows, insertColumns, tableName);
}
