import { extract as innerExtract } from './materializedViewsExtract.js';
import pgPromise from 'pg-promise';

const pgp = pgPromise({ capSQL: true });

/*
## Exports
*/

// Properties

export const tableName = 'tmdl';

export const createQuery = `CREATE TABLE IF NOT EXISTS ${tableName}
  (
    objectid INTEGER PRIMARY KEY,
    state VARCHAR(4000),
    region VARCHAR(2),
    organizationdisplayname VARCHAR(183) NOT NULL,
    organizationid VARCHAR(30) NOT NULL,
    organizationname VARCHAR(150) NOT NULL,
    organizationtype VARCHAR(30) NOT NULL,
    assessmentunitdisplayname VARCHAR(308) NOT NULL,
    assessmentunitid VARCHAR(50) NOT NULL,
    assessmentunitname VARCHAR(255) NOT NULL,
    actiondisplayname VARCHAR(303) NOT NULL,
    actionid VARCHAR(45) NOT NULL,
    actionname VARCHAR(255) NOT NULL,
    completiondate DATE,
    tmdldate DATE,
    fiscalyearestablished VARCHAR(4),
    pollutant VARCHAR(240) NOT NULL,
    sourcetype VARCHAR(40) NOT NULL,
    addressedparameter VARCHAR(240) NOT NULL,
    locationdescription VARCHAR(2000) NOT NULL,
    watertype VARCHAR(40) NOT NULL,
    watersize NUMERIC(18,4) NOT NULL,
    watersizeunits VARCHAR(15) NOT NULL,
    actionagency VARCHAR(10) NOT NULL,
    loadallocation NUMERIC(21,3) NOT NULL,
    loadallocationunits VARCHAR(40) NOT NULL,
    explicitmarginofsafety VARCHAR(255),
    implicitmarginofsafety VARCHAR(255),
    npdesidentifier VARCHAR(60),
    otheridentifier VARCHAR(4000),
    wasteloadallocation NUMERIC(24,3),
    inindiancountry VARCHAR(1),
    includeinmeasure VARCHAR(1)
  )`;

const insertColumns = new pgp.helpers.ColumnSet([
  { name: 'objectid' },
  { name: 'actionagency' },
  { name: 'actiondisplayname' },
  { name: 'actionid' },
  { name: 'actionname' },
  { name: 'addressedparameter' },
  { name: 'assessmentunitdisplayname' },
  { name: 'assessmentunitid' },
  { name: 'assessmentunitname' },
  { name: 'completiondate' },
  { name: 'explicitmarginofsafety' },
  { name: 'fiscalyearestablished' },
  { name: 'implicitmarginofsafety' },
  { name: 'includeinmeasure' },
  { name: 'inindiancountry' },
  { name: 'loadallocation' },
  { name: 'loadallocationunits' },
  { name: 'locationdescription' },
  { name: 'npdesidentifier' },
  { name: 'organizationdisplayname' },
  { name: 'organizationid' },
  { name: 'organizationname' },
  { name: 'organizationtype' },
  { name: 'otheridentifier' },
  { name: 'pollutant' },
  { name: 'region' },
  { name: 'sourcetype' },
  { name: 'state' },
  { name: 'tmdldate' },
  { name: 'wasteloadallocation' },
  { name: 'watersize' },
  { name: 'watersizeunits' },
  { name: 'watertype' },
]);

// Methods

export async function extract(s3Config, next = 0, retryCount = 0) {
  return await innerExtract('profile_tmdl', s3Config, next, retryCount);
}

export async function transform(data) {
  const rows = [];
  data.forEach((datum) => {
    rows.push({
      objectid: datum.objectid,
      actionagency: datum.actionagency,
      actiondisplayname: `${datum.actionid} - ${datum.actionname}`,
      actionid: datum.actionid,
      actionname: datum.actionname,
      addressedparameter: datum.addressedparameter,
      assessmentunitdisplayname: `${datum.assessmentunitid} - ${datum.assessmentunitname}`,
      assessmentunitid: datum.assessmentunitid,
      assessmentunitname: datum.assessmentunitname,
      completiondate: datum.completiondate,
      explicitmarginofsafety: datum.explicitmarginofsafety,
      fiscalyearestablished: datum.fiscalyearestablished,
      implicitmarginofsafety: datum.implicitmarginofsafety,
      includeinmeasure: datum.includeinmeasure,
      inindiancountry: datum.inindiancountry,
      loadallocation: datum.loadallocation,
      loadallocationunits: datum.loadallocationunits,
      locationdescription: datum.locationdescription,
      npdesidentifier: datum.npdesidentifier,
      organizationdisplayname: `${datum.organizationid} - ${datum.organizationname}`,
      organizationid: datum.organizationid,
      organizationname: datum.organizationname,
      organizationtype: datum.organizationtype,
      otheridentifier: datum.otheridentifier,
      pollutant: datum.pollutant,
      region: datum.region,
      sourcetype: datum.sourcetype,
      state: datum.state,
      tmdldate: datum.tmdldate,
      wasteloadallocation: datum.wasteloadallocation,
      watersize: datum.watersize,
      watersizeunits: datum.watersizeunits,
      watertype: datum.watertype,
    });
  });
  return pgp.helpers.insert(rows, insertColumns, tableName);
}
