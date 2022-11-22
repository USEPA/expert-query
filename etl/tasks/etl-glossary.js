import * as s3 from '../app/server/s3.js'; // './server/s3.js';
import { logger as log } from '../app/server/utilities/logger.js';

log.info('Starting Task: etl_glossary');

// load config from private s3 bucket
const s3Config = await s3.loadConfig();
await s3.syncGlossary(s3Config);

log.info('Task Completed: etl_glossary');
