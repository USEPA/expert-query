import { extract as innerExtract } from './materializedViewsExtract.js';
import pgPromise from 'pg-promise';

const pgp = pgPromise({ capSQL: true });

/*
## Exports
*/

// Properties

export const tableName = 'assessments';
export const overrideWorkMemory = '1GB';

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
    cyclelastassessed NUMERIC(4,0) NOT NULL,
    overallstatus VARCHAR(4000),
    epaircategory VARCHAR(5),
    stateircategory VARCHAR(5),
    parametergroup VARCHAR(60),
    parametername VARCHAR(240) NOT NULL,
    parameterstatus VARCHAR(240) NOT NULL,
    usegroup VARCHAR(128),
    usename VARCHAR(255),
    useircategory BIGINT,
    usestateircategory BIGINT,
    usesupport VARCHAR(1),
    parameterattainment VARCHAR(240) NOT NULL,
    parameterircategory BIGINT,
    parameterstateircategory BIGINT,
    cyclefirstlisted NUMERIC(4,0),
    associatedactionid VARCHAR(45),
    associatedactionname VARCHAR(255),
    associatedactiontype DOUBLE PRECISION,
    locationdescription VARCHAR(2000) NOT NULL,
    watertype VARCHAR(40),
    watersize NUMERIC(18,4) NOT NULL,
    watersizeunits VARCHAR(15) NOT NULL,
    sizesource VARCHAR(100),
    sourcescale VARCHAR(30),
    assessmentunitstatus VARCHAR(1) NOT NULL,
    useclassname VARCHAR(50),
    assessmentdate DATE,
    assessmentbasis VARCHAR(30),
    monitoringstartdate DATE,
    monitoringenddate DATE,
    assessmentmethods VARCHAR(150),
    assessmenttypes VARCHAR(30),
    delisted VARCHAR(1),
    delistedreason VARCHAR(100),
    seasonstartdate DATE,
    seasonenddate DATE,
    pollutantindicator VARCHAR(1),
    cyclescheduledfortmdl NUMERIC(4,0),
    cycleexpectedtoattain NUMERIC(4,0),
    cwa303dpriorityranking VARCHAR(25),
    vision303dpriority VARCHAR(1),
    alternatelistingidentifier VARCHAR(50),
    consentdecreecycle NUMERIC(4,0),
    associatedactionstatus VARCHAR(30),
    associatedactionagency VARCHAR(10)
  )`;

const insertColumns = new pgp.helpers.ColumnSet([
  { name: 'objectid' },
  { name: 'alternatelistingidentifier' },
  { name: 'assessmentbasis' },
  { name: 'assessmentdate' },
  { name: 'assessmentmethods' },
  { name: 'assessmenttypes' },
  { name: 'assessmentunitid' },
  { name: 'assessmentunitname' },
  { name: 'assessmentunitstatus' },
  { name: 'associatedactionagency' },
  { name: 'associatedactionid' },
  { name: 'associatedactionname' },
  { name: 'associatedactionstatus' },
  { name: 'associatedactiontype' },
  { name: 'consentdecreecycle' },
  { name: 'cwa303dpriorityranking' },
  { name: 'cycleexpectedtoattain' },
  { name: 'cyclefirstlisted' },
  { name: 'cyclelastassessed' },
  { name: 'cyclescheduledfortmdl' },
  { name: 'delisted' },
  { name: 'delistedreason' },
  { name: 'epaircategory' },
  { name: 'locationdescription' },
  { name: 'monitoringenddate' },
  { name: 'monitoringstartdate' },
  { name: 'organizationid' },
  { name: 'organizationname' },
  { name: 'organizationtype' },
  { name: 'overallstatus' },
  { name: 'parameterattainment' },
  { name: 'parametergroup' },
  { name: 'parameterircategory' },
  { name: 'parametername' },
  { name: 'parameterstateircategory' },
  { name: 'parameterstatus' },
  { name: 'pollutantindicator' },
  { name: 'region' },
  { name: 'reportingcycle' },
  { name: 'seasonenddate' },
  { name: 'seasonstartdate' },
  { name: 'sizesource' },
  { name: 'sourcescale' },
  { name: 'state' },
  { name: 'stateircategory' },
  { name: 'useclassname' },
  { name: 'usegroup' },
  { name: 'useircategory' },
  { name: 'usename' },
  { name: 'usestateircategory' },
  { name: 'usesupport' },
  { name: 'vision303dpriority' },
  { name: 'watersize' },
  { name: 'watersizeunits' },
  { name: 'watertype' },
]);

// Methods

export async function extract(s3Config, next = 0, retryCount = 0) {
  return await innerExtract('profile_assessments', s3Config, next, retryCount);
}

export async function transform(data) {
  const rows = [];
  data.forEach((datum) => {
    rows.push({
      objectid: datum.objectid,
      alternatelistingidentifier: datum.alternatelistingidentifier,
      assessmentbasis: datum.assessmentbasis,
      assessmentdate: datum.assessmentdate?.toString(),
      assessmentmethods: datum.assessmentmethods,
      assessmenttypes: datum.assessmenttypes,
      assessmentunitid: datum.assessmentunitid,
      assessmentunitname: datum.assessmentunitname,
      assessmentunitstatus: datum.assessmentunitstatus,
      associatedactionagency: datum.associatedactionagency,
      associatedactionid: datum.associatedactionid,
      associatedactionname: datum.associatedactionname,
      associatedactionstatus: datum.associatedactionstatus,
      associatedactiontype: datum.associatedactiontype,
      consentdecreecycle: datum.consentdecreecycle,
      cwa303dpriorityranking: datum.cwa303dpriorityranking,
      cycleexpectedtoattain: datum.cycleexpectedtoattain,
      cyclefirstlisted: datum.cyclefirstlisted,
      cyclelastassessed: datum.cyclelastassessed,
      cyclescheduledfortmdl: datum.cyclescheduledfortmdl,
      delisted: datum.delisted,
      delistedreason: datum.delistedreason,
      epaircategory: datum.epaircategory,
      locationdescription: datum.locationdescription,
      monitoringenddate: datum.monitoringenddate?.toString(),
      monitoringstartdate: datum.monitoringstartdate?.toString(),
      organizationid: datum.organizationid,
      organizationname: datum.organizationname,
      organizationtype: datum.organizationtype,
      overallstatus: datum.overallstatus,
      parameterattainment: datum.parameterattainment,
      parametergroup: datum.parametergroup,
      parameterircategory: datum.parameterircategory,
      parametername: datum.parametername,
      parameterstateircategory: datum.parameterstateircategory,
      parameterstatus: datum.parameterstatus,
      pollutantindicator: datum.pollutantindicator,
      region: datum.region,
      reportingcycle: datum.reportingcycle,
      seasonenddate: datum.seasonenddate?.toString(),
      seasonstartdate: datum.seasonstartdate?.toString(),
      sizesource: datum.sizesource,
      sourcescale: datum.sourcescale,
      state: datum.state,
      stateircategory: datum.stateircategory,
      useclassname: datum.useclassname,
      usegroup: datum.usegroup,
      useircategory: datum.useircategory,
      usename: datum.usename,
      usestateircategory: datum.usestateircategory,
      usesupport: datum.usesupport,
      vision303dpriority: datum.vision303dpriority,
      watersize: datum.watersize,
      watersizeunits: datum.watersizeunits,
      watertype: datum.watertype,
    });
  });
  return pgp.helpers.insert(rows, insertColumns, tableName);
}
