import { extract as innerExtract } from './materializedViewsExtract.js';
import pgPromise from 'pg-promise';

const pgp = pgPromise({ capSQL: true });

/*
## Exports
*/

// Properties

export const tableName = 'assessment_units';
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
    locationdescription VARCHAR(2000) NOT NULL,
    watertype VARCHAR(40) NOT NULL,
    watersize NUMERIC(18,4) NOT NULL,
    watersizeunits VARCHAR(15) NOT NULL,
    assessmentunitstatus VARCHAR(1) NOT NULL,
    useclassname VARCHAR(50),
    sizesource VARCHAR(100),
    sourcescale VARCHAR(30) NOT NULL,
    locationtypecode VARCHAR(22) NOT NULL,
    locationtext VARCHAR(100)
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

  CREATE INDEX IF NOT EXISTS ${indexTableName}_assessmentunitstatus_asc
    ON ${tableName} USING btree
    (assessmentunitstatus COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;

  CREATE INDEX IF NOT EXISTS ${indexTableName}_locationtext_asc
    ON ${tableName} USING btree
    (locationtext COLLATE pg_catalog."default" ASC NULLS LAST)
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

  CREATE INDEX IF NOT EXISTS ${indexTableName}_useclassname_asc
    ON ${tableName} USING btree
    (useclassname COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;

  CREATE INDEX IF NOT EXISTS ${indexTableName}_watertype_asc
    ON ${tableName} USING btree
    (watertype COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;
`;

const insertColumns = new pgp.helpers.ColumnSet([
  { name: 'objectid' },
  { name: 'assessmentunitid' },
  { name: 'assessmentunitname' },
  { name: 'assessmentunitstatus' },
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

export async function transform(data, first) {
  const rows = [];
  data.forEach((datum) => {
    rows.push({
      objectid: datum.objectid,
      assessmentunitid: datum.assessmentunitid,
      assessmentunitname: datum.assessmentunitname,
      assessmentunitstatus: datum.assessmentunitstate,
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
    });
  });
  return pgp.helpers.insert(rows, insertColumns, tableName);
}
