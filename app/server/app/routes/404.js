import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default function (app) {
  const router = express.Router();

  router.get('/', function (req, res, next) {
    res.status(404).sendFile(path.join(__dirname, '../../public', '400.html'));
  });

  app.use('/404.html', router);
}
