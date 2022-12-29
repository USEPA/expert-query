import * as database from '../server/database.js';
import etlJob from '../server/etlJob.js';
import { logger as log } from '../server/utilities/logger.js';

log.info('Starting Task: etl_all');

await database.checkForServerCrash();

await etlJob();

log.info('Task Completed: etl_all');
