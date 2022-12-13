import { extract as innerExtract } from './materializedViewsExtract.js';
import pgPromise from 'pg-promise';

const pgp = pgPromise({ capSQL: true });

/*
## Exports
*/

// Properties

export const tableName = 'sources';

export const createQuery = `CREATE TABLE IF NOT EXISTS ${tableName}
  (
    id SERIAL PRIMARY KEY,
    assessmentunitid VARCHAR(50) NOT NULL,
    assessmentunitname VARCHAR(255) NOT NULL,
    causename VARCHAR(240) NOT NULL,
    confirmed VARCHAR(1) NOT NULL,
    epaircategory VARCHAR(5),
    locationdescription VARCHAR(2000) NOT NULL,
    organizationid VARCHAR(30) NOT NULL,
    organizationname VARCHAR(150) NOT NULL,
    organizationtype VARCHAR(30) NOT NULL,
    overallstatus VARCHAR(4000),
    parametergroup VARCHAR(60) NOT NULL,
    region VARCHAR(2),
    reportingcycle NUMERIC(4) NOT NULL,
    sourcename VARCHAR(240) NOT NULL,
    state VARCHAR(4000),
    stateircategory VARCHAR(5),
    watersize NUMERIC(18,4) NOT NULL,
    watersizeunits VARCHAR(15) NOT NULL,
    watertype VARCHAR(40) NOT NULL
  )`;

const insertColumns = new pgp.helpers.ColumnSet([
  { name: 'assessmentunitid' },
  { name: 'assessmentunitname' },
  { name: 'causename' },
  { name: 'confirmed' },
  { name: 'epaircategory' },
  { name: 'locationdescription' },
  { name: 'organizationid' },
  { name: 'organizationname' },
  { name: 'organizationtype' },
  { name: 'overallstatus' },
  { name: 'parametergroup' },
  { name: 'region' },
  { name: 'reportingcycle' },
  { name: 'sourcename' },
  { name: 'state' },
  { name: 'stateircategory' },
  { name: 'watersize' },
  { name: 'watersizeunits' },
  { name: 'watertype' },
]);

// Methods

export async function extract(s3Config, next = 0, retryCount = 0) {
  return await innerExtract('profile_sources', s3Config, next, retryCount);
}

export function transform(data) {
  const rows = [];
  data.forEach((datum) => {
    rows.push({
      assessmentunitid: datum.assessmentunitid,
      assessmentunitname: datum.assessmentunitname,
      causename: datum.causename,
      confirmed: datum.confirmed,
      epaircategory: datum.epaircategory,
      locationdescription: datum.locationdescription,
      organizationid: datum.organizationid,
      organizationname: datum.organizationname,
      organizationtype: datum.organizationtype,
      overallstatus: datum.overallstatus,
      parametergroup: datum.parametergroup,
      region: datum.region,
      reportingcycle: datum.reportingcycle,
      sourcename: datum.sourcename,
      state: datum.state,
      stateircategory: datum.stateircategory,
      watersize: datum.watersize,
      watersizeunits: datum.watersizeunits,
      watertype: datum.watertype,
    });
  });
  return pgp.helpers.insert(rows, insertColumns, tableName);
}
