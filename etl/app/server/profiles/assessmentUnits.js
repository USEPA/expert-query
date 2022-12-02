import axios from 'axios';
import crypto from 'crypto';
import https from 'https';
import { setTimeout } from 'timers/promises';
import pgPromise from 'pg-promise';

const pgp = pgPromise({ capSQL: true });

import { logger as log } from '../utilities/logger.js';

/*
## Exports
*/

// Properties

export const tableName = 'assessment_units';

export const createQuery = `CREATE TABLE IF NOT EXISTS ${tableName}
  (
    id SERIAL PRIMARY KEY,
    assessmentunitid VARCHAR(50) NOT NULL,
    assessmentunitname VARCHAR(255) NOT NULL,
    assessmentunitstate VARCHAR(1) NOT NULL,
    locationdescription VARCHAR(2000) NOT NULL,
    locationtext VARCHAR(100),
    locationtypecode VARCHAR(22) NOT NULL,
    objectid INTEGER NOT NULL,
    organizationid VARCHAR(30) NOT NULL,
    organizationname VARCHAR(150) NOT NULL,
    organizationtype VARCHAR(30) NOT NULL,
    region VARCHAR(2),
    reportingcycle NUMERIC(4) NOT NULL,
    sizesource VARCHAR(100),
    sourcescale VARCHAR(30) NOT NULL,
    state VARCHAR(4000),
    useclassname VARCHAR(50),
    watersize NUMERIC(18,4) NOT NULL,
    watersizeunits VARCHAR(15) NOT NULL,
    watertype VARCHAR(40) NOT NULL
  )`;

const insertColumns = new pgp.helpers.ColumnSet([
  { name: 'assessmentunitid' },
  { name: 'assessmentunitname' },
  { name: 'assessmentunitstate' },
  { name: 'locationdescription' },
  { name: 'locationtext' },
  { name: 'locationtypecode' },
  { name: 'objectid' },
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
  const chunkSize = s3Config.config.chunkSize;

  const profileName = 'profile_assessment_units';

  const url =
    `${s3Config.services.materializedViews}/${profileName}` +
    `?p_limit=${chunkSize}&p_offset=${next}`;

  const res = await axios.get(url, {
    headers: { 'API-key': '{887b8dd6-3cc5-4184-8c00-dc2b414f4a83}' },
    httpsAgent: new https.Agent({
      // TODO - Remove this when ordspub supports OpenSSL 3.0
      // This is needed to allow node 18 to talk with ordspub, which does
      //   not support OpenSSL 3.0
      secureOptions: crypto.constants.SSL_OP_LEGACY_SERVER_CONNECT,
    }),
  });
  if (res.status !== 200) {
    log.info(`Non-200 response returned from ${profileName} service, retrying`);
    if (retryCount < s3Config.config.retryLimit) {
      await setTimeout(s3Config.config.retryIntervalSeconds * 1000);
      return await extract(s3Config, next, retryCount + 1);
    } else {
      throw new Error('Retry count exceeded');
    }
  }
  const data = res.data.records.map((record) => record);
  return { data: data.length ? data : null, next: next + chunkSize };
}

export function transform(data) {
  const rows = [];
  data.forEach((datum) => {
    rows.push({
      assessmentunitid: datum.assessmentunitid,
      assessmentunitname: datum.assessmentunitname,
      assessmentunitstate: datum.assessmentunitstate,
      locationdescription: datum.locationdescription,
      locationtext: datum.locationtext,
      locationtypecode: datum.locationtypecode,
      objectid: datum.objectid,
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
