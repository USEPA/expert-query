/*
## Config
*/
const limit = 1;
const values = ['a', 'b', 'c', 'd', 'e'];

/*
## Exports
*/

// Variables

export const tableName = 'profile_test';

export const createQuery = `CREATE TABLE IF NOT EXISTS ${tableName}
  (
    id SERIAL PRIMARY KEY,
    assessment_name varchar(20) NOT NULL
  )`;

export const insertQuery = `INSERT INTO ${tableName} (assessment_name) VALUES ($1)`;

// Methods

export async function extract(next = 0) {
  return next < values.length
    ? { data: [[values[next]]], next: next + limit }
    : { data: null, next: next + limit };
}

export function transform(data) {
  return data;
}
