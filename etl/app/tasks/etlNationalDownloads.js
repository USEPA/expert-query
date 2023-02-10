import {
  endConnPool,
  getActiveSchema,
  startConnPool,
  streamNationalDownloads,
  trimNationalDownloads,
} from '../server/database.js';
import { archiveNationalDownloads, loadConfig } from '../server/s3.js';
import { log } from '../server/utilities/logger.js';

log.info('Starting Task: etl_national_downloads');

const startTime = performance.now();

// load config from private s3 bucket
const s3Config = await loadConfig();

const pool = startConnPool();

const activeSchema = await getActiveSchema(pool);

await streamNationalDownloads(pool, activeSchema);

log.info(
  `Build national downloads took ${(performance.now() - startTime) / 1000}s`,
);

const startTimeManage = performance.now();

// manage s3 files
await archiveNationalDownloads(activeSchema);
await trimNationalDownloads(pool);

log.info(
  `Manage national downloads took ${
    (performance.now() - startTimeManage) / 1000
  }s`,
);

endConnPool(pool);

log.info(
  `Task Completed: etl_national_downloads : ${
    (performance.now() - startTime) / 1000
  }s`,
);
