import pg from 'pg';
import express from 'express';

import { hucs } from './hucs.js';

const { Pool } = pg;
const pool = new Pool();

function sleep(milliseconds) {
  const date = Date.now();
  let currentDate = null;
  do {
    currentDate = Date.now();
  } while (currentDate - date < milliseconds);
}

async function queryAssessments(retry = 0) {
  const huc = hucs[Math.floor(Math.random() * hucs.length)];
  const column = 'assessmentunitidentifier';
  let res = null;
  try {
    res = await pool.query(
      `SELECT ${column} from assessments_by_catchment where huc12 = '${huc}'`,
    );
  } catch (err) {
    if (retry < 5) {
      sleep(5000);
      queryAssessments(retry + 1);
    }
  }
  return res?.rows;
}

const app = express();

app.get('/', async (_req, res) => {
  const rows = await queryAssessments();
  res.send(`Count: ${rows.length}`);
});

const PORT = process.env.PORT || 8080;

const server = app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}\n`);
});

process.on('SIGTERM', () => {
  pool.end().then(() => server.close());
});
