import { extract as innerExtract } from './materializedViewsExtract.js';
import pgPromise from 'pg-promise';

const pgp = pgPromise({ capSQL: true });

/*
## Exports
*/

// Properties

export const tableName = 'catchment_correspondence';

export const createQuery = `CREATE TABLE IF NOT EXISTS ${tableName}
  (
    id SERIAL PRIMARY KEY,
    assessmentunitid VARCHAR(50) NOT NULL,
    assessmentunitname VARCHAR(255) NOT NULL,
    catchmentnhdplusid NUMERIC(38) NOT NULL,
    organizationid VARCHAR(30) NOT NULL,
    organizationname VARCHAR(150) NOT NULL,
    organizationtype VARCHAR(30) NOT NULL,
    region VARCHAR(2),
    reportingcycle NUMERIC(4) NOT NULL,
    state VARCHAR(4000)
  )`;

const insertColumns = new pgp.helpers.ColumnSet([
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

export function transform(data) {
  const rows = [];
  data.forEach((datum) => {
    rows.push({
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
