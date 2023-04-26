import { extract as innerExtract } from './materializedViewsExtract.js';
import pgPromise from 'pg-promise';

const pgp = pgPromise({ capSQL: true });

/*
## Exports
*/

// Properties

export const tableName = 'catchment_correspondence';
export const overrideWorkMemory = '790MB';

export const createQuery = `CREATE TABLE IF NOT EXISTS ${tableName}
  (
    objectid INTEGER PRIMARY KEY,
    state VARCHAR(4000),
    region VARCHAR(2),
    organizationdisplayname VARCHAR(183) NOT NULL,
    organizationid VARCHAR(30) NOT NULL,
    organizationname VARCHAR(150) NOT NULL,
    organizationtype VARCHAR(30) NOT NULL,
    reportingcycle NUMERIC(4,0) NOT NULL,
    cycleid NUMERIC(38,0) NOT NULL,
    assessmentunitdisplayname VARCHAR(308) NOT NULL,
    assessmentunitid VARCHAR(50) NOT NULL,
    assessmentunitname VARCHAR(255) NOT NULL,
    catchmentnhdplusid NUMERIC(38,0)
  )`;

const insertColumns = new pgp.helpers.ColumnSet([
  { name: 'objectid' },
  { name: 'assessmentunitdisplayname' },
  { name: 'assessmentunitid' },
  { name: 'assessmentunitname' },
  { name: 'catchmentnhdplusid' },
  { name: 'cycleid' },
  { name: 'organizationdisplayname' },
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

export async function transform(data) {
  const rows = [];
  data.forEach((datum) => {
    rows.push({
      objectid: datum.objectid,
      assessmentunitdisplayname: `${datum.assessmentunitid} - ${datum.assessmentunitname}`,
      assessmentunitid: datum.assessmentunitid,
      assessmentunitname: datum.assessmentunitname,
      catchmentnhdplusid: datum.catchmentnhdplusid,
      cycleid: datum.cycleid,
      organizationdisplayname: `${datum.organizationid} - ${datum.organizationname}`,
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
