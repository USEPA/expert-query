import {
  endConnPool,
  getActiveSchema,
  startConnPool,
  streamNationalDownloads,
  trimNationalDownloads,
} from '../server/database.js';
import { archiveNationalDownloads, loadConfig } from '../server/s3.js';
import { logger as log } from '../server/utilities/logger.js';

log.info('Starting Task: etl_national_downloads');

// load config from private s3 bucket
const s3Config = await loadConfig();

const pool = startConnPool();

const activeSchema = await getActiveSchema(pool);

await streamNationalDownloads(pool, activeSchema);

// manage s3 files
await archiveNationalDownloads(activeSchema);
await trimNationalDownloads(pool);

endConnPool(pool);

log.info('Task Completed: etl_national_downloads');
