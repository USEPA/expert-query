import * as database from '../server/database.js';
import * as s3 from '../server/s3.js';
import { log } from '../server/utilities/logger.js';

log.info('Starting Task: etl_database');

// load config from private s3 bucket
const s3Config = await s3.loadConfig();

await database.checkForServerCrash();

// Create and load new schema
await database.runJob(s3Config, true);

log.info('Task Completed: etl_database');
