import { extract as innerExtract } from './materializedViewsExtract.js';
import pgPromise from 'pg-promise';

const pgp = pgPromise({ capSQL: true });

/*
## Exports
*/

// Properties

export const tableName = 'sources';
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
    overallstatus VARCHAR(4000),
    epaircategory VARCHAR(5),
    stateircategory VARCHAR(5),
    sourcename VARCHAR(240) NOT NULL,
    confirmed VARCHAR(1) NOT NULL,
    parametergroup VARCHAR(60) NOT NULL,
    causename VARCHAR(240) NOT NULL,
    locationdescription VARCHAR(2000) NOT NULL,
    watertype VARCHAR(40) NOT NULL,
    watersize NUMERIC(18,4) NOT NULL,
    watersizeunits VARCHAR(15) NOT NULL
  )`;

export const createIndexes = `
  CREATE INDEX IF NOT EXISTS ${indexTableName}_assessmentunitid_asc
    ON ${tableName} USING btree
    (assessmentunitid COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;
  COMMIT;

  CREATE INDEX IF NOT EXISTS ${indexTableName}_assessmentunitname_asc
    ON ${tableName} USING btree
    (assessmentunitname COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;
  COMMIT;

  CREATE INDEX IF NOT EXISTS ${indexTableName}_causename_asc
    ON ${tableName} USING btree
    (causename COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;
  COMMIT;

  CREATE INDEX IF NOT EXISTS ${indexTableName}_confirmed_asc
    ON ${tableName} USING btree
    (confirmed COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;
  COMMIT;

  CREATE INDEX IF NOT EXISTS ${indexTableName}_epaircategory_asc
    ON ${tableName} USING btree
    (epaircategory COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;
  COMMIT;

  CREATE INDEX IF NOT EXISTS ${indexTableName}_organizationid_asc
    ON ${tableName} USING btree
    (organizationid COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;
  COMMIT;

  CREATE INDEX IF NOT EXISTS ${indexTableName}_organizationname_asc
    ON ${tableName} USING btree
    (organizationname COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;
  COMMIT;

  CREATE INDEX IF NOT EXISTS ${indexTableName}_overallstatus_asc
    ON ${tableName} USING btree
    (overallstatus COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;
  COMMIT;

  CREATE INDEX IF NOT EXISTS ${indexTableName}_parametergroup_asc
    ON ${tableName} USING btree
    (parametergroup COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;
  COMMIT;

  CREATE INDEX IF NOT EXISTS ${indexTableName}_region_asc
    ON ${tableName} USING btree
    (region COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;
  COMMIT;

  CREATE INDEX IF NOT EXISTS ${indexTableName}_reportingcycle_desc
    ON ${tableName} USING btree
    (reportingcycle DESC NULLS LAST)
    TABLESPACE pg_default;
  COMMIT;

  CREATE INDEX IF NOT EXISTS ${indexTableName}_sourcename_asc
    ON ${tableName} USING btree
    (sourcename COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;
  COMMIT;

  CREATE INDEX IF NOT EXISTS ${indexTableName}_state_asc
    ON ${tableName} USING btree
    (state COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;
  COMMIT;

  CREATE INDEX IF NOT EXISTS ${indexTableName}_stateircategory_asc
    ON ${tableName} USING btree
    (stateircategory COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;
  COMMIT;

  CREATE INDEX IF NOT EXISTS ${indexTableName}_watertype_asc
    ON ${tableName} USING btree
    (watertype COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;
  COMMIT;
`;

const insertColumns = new pgp.helpers.ColumnSet([
  { name: 'objectid' },
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

export async function transform(data, first) {
  const rows = [];
  data.forEach((datum) => {
    rows.push({
      objectid: datum.objectid,
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
