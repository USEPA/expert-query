import {
  createPipeline as innerCreatePipeline,
  extract as innerExtract,
  transformToZip,
} from './materializedViewsExtract.js';
import pgPromise from 'pg-promise';

const pgp = pgPromise({ capSQL: true });

/*
## Exports
*/

// Properties

export const tableName = 'assessment_units';

export const createQuery = `CREATE TABLE IF NOT EXISTS ${tableName}
  (
    id SERIAL PRIMARY KEY,
    assessmentunitid VARCHAR(50) NOT NULL,
    assessmentunitname VARCHAR(255) NOT NULL,
    assessmentunitstate VARCHAR(1) NOT NULL,
    locationdescription VARCHAR(2000) NOT NULL,
    locationtext VARCHAR(100),
    locationtypecode VARCHAR(22) NOT NULL,
    organizationid VARCHAR(30) NOT NULL,
    organizationname VARCHAR(150) NOT NULL,
    organizationtype VARCHAR(30) NOT NULL,
    region VARCHAR(2),
    reportingcycle NUMERIC(4) NOT NULL,
    sizesource VARCHAR(100),
    sourcescale VARCHAR(30) NOT NULL,
    state VARCHAR(4000),
    useclassname VARCHAR(50),
    watersize NUMERIC(18,4) NOT NULL,
    watersizeunits VARCHAR(15) NOT NULL,
    watertype VARCHAR(40) NOT NULL
  )`;

const insertColumns = new pgp.helpers.ColumnSet([
  { name: 'assessmentunitid' },
  { name: 'assessmentunitname' },
  { name: 'assessmentunitstate' },
  { name: 'locationdescription' },
  { name: 'locationtext' },
  { name: 'locationtypecode' },
  { name: 'organizationid' },
  { name: 'organizationname' },
  { name: 'organizationtype' },
  { name: 'region' },
  { name: 'reportingcycle' },
  { name: 'sizesource' },
  { name: 'sourcescale' },
  { name: 'state' },
  { name: 'useclassname' },
  { name: 'watersize' },
  { name: 'watersizeunits' },
  { name: 'watertype' },
]);

// Methods

export async function extract(s3Config, next = 0, retryCount = 0) {
  return await innerExtract(
    'profile_assessment_units',
    s3Config,
    next,
    retryCount,
  );
}

export function createPipeline() {
  return innerCreatePipeline(tableName);
}

export async function transform(data, pipeline, first) {
  const rows = [];
  data.forEach((datum, idx) => {
    const row = {
      assessmentunitid: datum.assessmentunitid,
      assessmentunitname: datum.assessmentunitname,
      assessmentunitstate: datum.assessmentunitstate,
      locationdescription: datum.locationdescription,
      locationtext: datum.locationtext,
      locationtypecode: datum.locationtypecode,
      organizationid: datum.organizationid,
      organizationname: datum.organizationname,
      organizationtype: datum.organizationtype,
      region: datum.region,
      reportingcycle: datum.reportingcycle,
      sizesource: datum.sizesource,
      sourcescale: datum.sourcescale,
      state: datum.state,
      useclassname: datum.useclassname,
      watersize: datum.watersize,
      watersizeunits: datum.watersizeunits,
      watertype: datum.watertype,
    };
    rows.push(row);
  });

  await transformToZip(rows, pipeline, first);

  return pgp.helpers.insert(rows, insertColumns, tableName);
}
