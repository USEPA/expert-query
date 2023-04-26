import { extract as innerExtract } from './materializedViewsExtract.js';
import pgPromise from 'pg-promise';

const pgp = pgPromise({ capSQL: true });

/*
## Exports
*/

// Properties

export const tableName = 'assessment_units_monitoring_locations';

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
    locationdescription VARCHAR(2000) NOT NULL,
    watertype VARCHAR(40) NOT NULL,
    watersize NUMERIC(18,4) NOT NULL,
    watersizeunits VARCHAR(15) NOT NULL,
    monitoringlocationorgid VARCHAR(30),
    monitoringlocationid VARCHAR(35),
    monitoringlocationdatalink VARCHAR(255),
    assessmentunitstatus VARCHAR(1) NOT NULL,
    useclassname VARCHAR(50),
    sizesource VARCHAR(100),
    sourcescale VARCHAR(30)
  )`;

const insertColumns = new pgp.helpers.ColumnSet([
  { name: 'objectid' },
  { name: 'assessmentunitdisplayname' },
  { name: 'assessmentunitid' },
  { name: 'assessmentunitname' },
  { name: 'assessmentunitstatus' },
  { name: 'cycleid' },
  { name: 'locationdescription' },
  { name: 'monitoringlocationdatalink' },
  { name: 'monitoringlocationid' },
  { name: 'monitoringlocationorgid' },
  { name: 'organizationdisplayname' },
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
    'profile_assessment_units_monitoring_locations',
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
      assessmentunitstatus: datum.assessmentunitstatus,
      cycleid: datum.cycleid,
      locationdescription: datum.locationdescription,
      monitoringlocationdatalink: datum.monitoringlocationdatalink,
      monitoringlocationid: datum.monitoringlocationid,
      monitoringlocationorgid: datum.monitoringlocationorgid,
      organizationdisplayname: `${datum.organizationid} - ${datum.organizationname}`,
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
    });
  });
  return pgp.helpers.insert(rows, insertColumns, tableName);
}
