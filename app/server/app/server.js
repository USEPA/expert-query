import app from './app.js';
import browserSync from 'browser-sync';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { log } from './utilities/logger.js';
import { getEnvironment } from './utilities/environment.js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { isLocal } = getEnvironment();

const browserSyncPort = 3002;
let port = process.env.PORT || 3001;

// for local testing of the production flow, use the same port as browersync to avoid
// different port usage to confuse testers/developers
if (port === 3001 && !isLocal) port = browserSyncPort;

app.listen(port, function () {
  if (isLocal) {
    log.info(`Application listening on port ${browserSyncPort}`);

    browserSync({
      files: [path.join(__dirname, '/public/**')],
      online: false,
      open: false,
      port: browserSyncPort,
      proxy: 'localhost:' + port,
      ui: false,
    });
  } else {
    log.info(`Application listening on port ${port}`);
  }
});
