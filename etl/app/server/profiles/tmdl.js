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

export const tableName = 'tmdl';

export const createQuery = `CREATE TABLE IF NOT EXISTS ${tableName}
  (
    id SERIAL PRIMARY KEY,
    actionagency VARCHAR(10) NOT NULL,
    actionid VARCHAR(45) NOT NULL,
    actionname VARCHAR(255) NOT NULL,
    addressedparameter VARCHAR(240) NOT NULL,
    assessmentunitid VARCHAR(50) NOT NULL,
    assessmentunitname VARCHAR(255) NOT NULL,
    completiondate TIMESTAMP WITH TIME ZONE,
    explicitmarginofsafety VARCHAR(255),
    fiscalyearestablished VARCHAR(4),
    implicitmarginofsafety VARCHAR(255),
    includeinmeasure VARCHAR(1),
    inindiancountry VARCHAR(1),
    loadallocation NUMERIC(21,3) NOT NULL,
    loadallocationunits VARCHAR(40) NOT NULL,
    locationdescription VARCHAR(2000) NOT NULL,
    npdesidentifier VARCHAR(60),
    organizationid VARCHAR(30) NOT NULL,
    organizationname VARCHAR(150) NOT NULL,
    organizationtype VARCHAR(30) NOT NULL,
    otheridentifier VARCHAR(4000),
    pollutant VARCHAR(240) NOT NULL,
    region VARCHAR(2),
    reportingcycle NUMERIC(4) NOT NULL,
    sourcetype VARCHAR(40) NOT NULL,
    state VARCHAR(4000),
    tmdldate TIMESTAMP WITH TIME ZONE,
    tmdlendpoint TEXT,
    wasteloadallocation NUMERIC(24,3),
    watersize NUMERIC(18,4) NOT NULL,
    watersizeunits VARCHAR(15) NOT NULL,
    watertype VARCHAR(40) NOT NULL
  )`;

const insertColumns = new pgp.helpers.ColumnSet([
  { name: 'actionagency' },
  { name: 'actionid' },
  { name: 'actionname' },
  { name: 'addressedparameter' },
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
  { name: 'organizationid' },
  { name: 'organizationname' },
  { name: 'organizationtype' },
  { name: 'otheridentifier' },
  { name: 'pollutant' },
  { name: 'region' },
  { name: 'reportingcycle' },
  { name: 'sourcetype' },
  { name: 'state' },
  { name: 'tmdldate' },
  { name: 'tmdlendpoint' },
  { name: 'wasteloadallocation' },
  { name: 'watersize' },
  { name: 'watersizeunits' },
  { name: 'watertype' },
]);

// Methods

export async function extract(s3Config, next = 0, retryCount = 0) {
  return await innerExtract('profile_tmdl', s3Config, next, retryCount);
}

export function createPipeline() {
  return innerCreatePipeline(tableName);
}

export async function transform(data, pipeline, first) {
  const rows = [];
  data.forEach((datum) => {
    rows.push({
      actionagency: datum.actionagency,
      actionid: datum.actionid,
      actionname: datum.actionname,
      addressedparameter: datum.addressedparameter,
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
      organizationid: datum.organizationid,
      organizationname: datum.organizationname,
      organizationtype: datum.organizationtype,
      otheridentifier: datum.otheridentifier,
      pollutant: datum.pollutant,
      region: datum.region,
      reportingcycle: datum.reportingcycle,
      sourcetype: datum.sourcetype,
      state: datum.state,
      tmdldate: datum.tmdldate,
      tmdlendpoint: datum.tmdlendpoint,
      wasteloadallocation: datum.wasteloadallocation,
      watersize: datum.watersize,
      watersizeunits: datum.watersizeunits,
      watertype: datum.watertype,
    });
  });

  await transformToZip(rows, pipeline, first);

  return pgp.helpers.insert(rows, insertColumns, tableName);
}
