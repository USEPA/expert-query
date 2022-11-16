import express from 'express';
import { logger as log } from '../server/utilities/logger.js';

export function routes(app) {
  const router = express.Router();

  router.get('/internalTest', (req, res) => {
    log.info('Successfully ran internal route test code!!!');
    res
      .status(200)
      .send({ value: 'Successfully ran internal route test code!!!' });
  });

  app.use('/etl', router);
}
