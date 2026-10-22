import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default function (app, basePath) {
  const router = express.Router();

  router.get('/', function (req, res, next) {
    // sendFile dotfile-checks every segment of an absolute path, so pass the
    // directory as root to keep it from rejecting dotted parent directories
    res
      .status(404)
      .sendFile('404.html', { root: path.join(__dirname, '../public') });
  });

  app.use(`${basePath}404.html`, router);
}
