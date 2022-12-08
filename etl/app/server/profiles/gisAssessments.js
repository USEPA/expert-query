import axios from 'axios';
import { setTimeout } from 'timers/promises';
import pgPromise from 'pg-promise';

const pgp = pgPromise({ capSQL: true });

import { logger as log } from '../utilities/logger.js';

const selectColumns = [
  'assessmentunitidentifier',
  'assessmentunitname',
  'ircategory',
  'organizationid',
  'organizationname',
  'orgtype',
  'overallstatus',
  'region',
  'reportingcycle',
  'state',
];

/*
## Exports
*/

// Properties

export const tableName = 'gis_assessments';

// load all data
export const maxChunksOverride = Number.MAX_SAFE_INTEGER;

export const createQuery = `CREATE TABLE IF NOT EXISTS ${tableName}
  (
    id SERIAL PRIMARY KEY,
    reporting_cycle INTEGER NOT NULL,
    assessment_unit_id VARCHAR(50) NOT NULL,
    assessment_unit_name VARCHAR(255),
    organization_id VARCHAR(30) NOT NULL,
    organization_name VARCHAR(200) NOT NULL,
    organization_type VARCHAR(30) NOT NULL,
    overall_status VARCHAR(50) NOT NULL,
    region VARCHAR(2) NOT NULL,
    state VARCHAR(2) NOT NULL,
    ir_category VARCHAR(5)
  )`;

const insertColumns = new pgp.helpers.ColumnSet([
  { name: 'assessment_unit_id', prop: 'assessmentUnitId' },
  { name: 'assessment_unit_name', prop: 'assessmentUnitName' },
  { name: 'ir_category', prop: 'irCategory' },
  { name: 'organization_id', prop: 'organizationId' },
  { name: 'organization_name', prop: 'organizationName' },
  { name: 'organization_type', prop: 'organizationType' },
  { name: 'overall_status', prop: 'overallStatus' },
  { name: 'region' },
  { name: 'reporting_cycle', prop: 'reportingCycle' },
  { name: 'state' },
]);

// Methods

export async function extract(s3Config, next = 0, retryCount = 0) {
  const gisChunkSize = s3Config.config.gisChunkSize;

  const baseUrl =
    `${s3Config.services.attainsGis.summary}/query?` +
    'f=pjson&orderByFields=objectid&returnGeometry=false' +
    `&outFields=${selectColumns.join(',')}&resultRecordCount=${gisChunkSize}`;

  const url = baseUrl + `&where=objectid+>=+${next}`;
  const res = await axios.get(url);
  if (res.status !== 200) {
    log.info('Non-200 response returned from GIS service, retrying');
    if (retryCount < s3Config.config.retryLimit) {
      await setTimeout(s3Config.config.retryIntervalSeconds * 1000);
      return await extract(s3Config, next, retryCount + 1);
    } else {
      throw new Error('Retry count exceeded');
    }
  }
  const data = res.data.features.map((feature) => feature.attributes);
  return { data: data.length ? data : null, next: next + gisChunkSize };
}

export function transform(data) {
  const rows = [];
  data.forEach((datum) => {
    rows.push({
      assessmentUnitId: datum.assessmentunitidentifier,
      assessmentUnitName: datum.assessmentunitname,
      irCategory: datum.ircategory,
      organizationId: datum.organizationid,
      organizationName: datum.organizationname,
      organizationType: datum.orgtype,
      overallStatus: datum.overallstatus,
      region: datum.region,
      reportingCycle: datum.reportingcycle,
      state: datum.state,
    });
  });
  return pgp.helpers.insert(rows, insertColumns, tableName);
}
