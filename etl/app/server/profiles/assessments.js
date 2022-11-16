import axios from 'axios';
import { setTimeout } from 'timers/promises';

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

export const tableName = 'assessments';

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

export const insertQuery = `INSERT INTO ${tableName}
  (
    assessment_unit_id,
    assessment_unit_name,
    ir_category,
    organization_id,
    organization_name,
    organization_type,
    overall_status,
    region,
    reporting_cycle,
    state
  ) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
  )`;

// Methods

export async function extract(s3Config, next = 0, retryCount = 0) {
  const chunkSize = s3Config.config.chunkSize;

  const baseUrl =
    `${s3Config.services.attainsGis.summary}/query?` +
    'f=pjson&orderByFields=objectid&returnGeometry=false' +
    `&outFields=${selectColumns.join(',')}&resultRecordCount=${chunkSize}`;

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
  return { data: data.length ? data : null, next: next + chunkSize };
}

export function transform(data) {
  const rows = [];
  data.forEach((datum) => {
    rows.push([
      datum.assessmentunitidentifier,
      datum.assessmentunitname,
      datum.ircategory,
      datum.organizationid,
      datum.organizationname,
      datum.orgtype,
      datum.overallstatus,
      datum.region,
      datum.reportingcycle,
      datum.state,
    ]);
  });
  return rows;
}
