import { extract as innerExtract } from './materializedViewsExtract.js';
import pgPromise from 'pg-promise';

const pgp = pgPromise({ capSQL: true });

/*
## Exports
*/

// Properties

export const tableName = 'tmdl';
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

export const createIndexes = `
  CREATE INDEX IF NOT EXISTS ${indexTableName}_actionagency_asc
    ON ${tableName} USING btree
    (actionagency COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;

  CREATE INDEX IF NOT EXISTS ${indexTableName}_actionid_asc
    ON ${tableName} USING btree
    (actionid COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;

  CREATE INDEX IF NOT EXISTS ${indexTableName}_actionname_asc
    ON ${tableName} USING btree
    (actionname COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;

  CREATE INDEX IF NOT EXISTS ${indexTableName}_addressedparameter_asc
    ON ${tableName} USING btree
    (addressedparameter COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;

  CREATE INDEX IF NOT EXISTS ${indexTableName}_assessmentunitid_asc
    ON ${tableName} USING btree
    (assessmentunitid COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;

  CREATE INDEX IF NOT EXISTS ${indexTableName}_assessmentunitname_asc
    ON ${tableName} USING btree
    (assessmentunitname COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;

  CREATE INDEX IF NOT EXISTS ${indexTableName}_completiondate_desc
    ON ${tableName} USING btree
    (completiondate DESC NULLS LAST)
    TABLESPACE pg_default;

  CREATE INDEX IF NOT EXISTS ${indexTableName}_explicitmarginofsafety_asc
    ON ${tableName} USING btree
    (explicitmarginofsafety COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;

  CREATE INDEX IF NOT EXISTS ${indexTableName}_fiscalyearestablished_desc
    ON ${tableName} USING btree
    (fiscalyearestablished COLLATE pg_catalog."default" DESC NULLS LAST)
    TABLESPACE pg_default;

  CREATE INDEX IF NOT EXISTS ${indexTableName}_implicitmarginofsafety_asc
    ON ${tableName} USING btree
    (implicitmarginofsafety COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;

  CREATE INDEX IF NOT EXISTS ${indexTableName}_includeinmeasure_asc
    ON ${tableName} USING btree
    (includeinmeasure COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;

  CREATE INDEX IF NOT EXISTS ${indexTableName}_inindiancountry_asc
    ON ${tableName} USING btree
    (inindiancountry COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;

  CREATE INDEX IF NOT EXISTS ${indexTableName}_npdesidentifier_asc
    ON ${tableName} USING btree
    (npdesidentifier COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;

  CREATE INDEX IF NOT EXISTS ${indexTableName}_organizationid_asc
    ON ${tableName} USING btree
    (organizationid COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;

  CREATE INDEX IF NOT EXISTS ${indexTableName}_organizationname_asc
    ON ${tableName} USING btree
    (organizationname COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;

  CREATE INDEX IF NOT EXISTS ${indexTableName}_otheridentifier_asc
    ON ${tableName} USING btree
    (otheridentifier COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;

  CREATE INDEX IF NOT EXISTS ${indexTableName}_pollutant_asc
    ON ${tableName} USING btree
    (pollutant COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;

  CREATE INDEX IF NOT EXISTS ${indexTableName}_region_asc
    ON ${tableName} USING btree
    (region COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;

  CREATE INDEX IF NOT EXISTS ${indexTableName}_reportingcycle_desc
    ON ${tableName} USING btree
    (reportingcycle DESC NULLS LAST)
    TABLESPACE pg_default;

  CREATE INDEX IF NOT EXISTS ${indexTableName}_sourcetype_asc
    ON ${tableName} USING btree
    (sourcetype COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;

  CREATE INDEX IF NOT EXISTS ${indexTableName}_state_asc
    ON ${tableName} USING btree
    (state COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;

  CREATE INDEX IF NOT EXISTS ${indexTableName}_tmdldate_desc
    ON ${tableName} USING btree
    (tmdldate DESC NULLS LAST)
    TABLESPACE pg_default;

  CREATE INDEX IF NOT EXISTS ${indexTableName}_watertype_asc
    ON ${tableName} USING btree
    (watertype COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;
`;

const insertColumns = new pgp.helpers.ColumnSet([
  { name: 'objectid' },
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
  { name: 'wasteloadallocation' },
  { name: 'watersize' },
  { name: 'watersizeunits' },
  { name: 'watertype' },
]);

// Methods

export async function extract(s3Config, next = 0, retryCount = 0) {
  return await innerExtract('profile_tmdl', s3Config, next, retryCount);
}

export async function transform(data, first) {
  const rows = [];
  data.forEach((datum) => {
    rows.push({
      objectid: datum.objectid,
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
      wasteloadallocation: datum.wasteloadallocation,
      watersize: datum.watersize,
      watersizeunits: datum.watersizeunits,
      watertype: datum.watertype,
    });
  });
  return pgp.helpers.insert(rows, insertColumns, tableName);
}
