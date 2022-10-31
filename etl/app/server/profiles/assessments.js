import axios from 'axios';

import { logger as log } from '../utilities/logger.js';

/*
## Config
*/
const limit = 2000;

const remoteColumns = [
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
const baseUrl =
  'https://gispub.epa.gov/arcgis/rest/services/OW/ATTAINS_Assessment/MapServer/4/query?' +
  'f=pjson&orderByFields=OBJECTID&returnGeometry=false&where=1%3D1' +
  `&outFields=${remoteColumns.join(',')}&resultRecordCount=${limit}`;

/*
## Exports
*/

// Constants

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

export async function extract(next = 0, retryCount = 0) {
  const url = next > 0 ? baseUrl + `&resultOffset=${next}` : baseUrl;
  const res = await axios.get(url);
  if (res.status !== 200) {
    log.info('Non-200 response returned from GIS service, retrying');
    if (retryCount < 5) {
      return setTimeout(() => extract(next, retryCount + 1), 5 * 1000);
    } else {
      throw new Error('Retry count exceeded');
    }
  }
  const data = res.data.features.map((feature) => feature.attributes);
  return { data: data.length ? data : null, next: next + limit };
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
