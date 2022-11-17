import pgPromise from 'pg-promise';

const pgp = pgPromise({ capSQL: true });

const limit = 1;
const values = ['a', 'b', 'c', 'd', 'e'];

/*
## Exports
*/

// Properties

export const tableName = 'profile_test';

export const createQuery = `CREATE TABLE IF NOT EXISTS ${tableName}
  (
    id SERIAL PRIMARY KEY,
    assessment_name varchar(20) NOT NULL
  )`;

const insertColumns = new pgp.helpers.ColumnSet([
  { name: 'assessment_name', prop: 'assessmentName' },
]);

// Methods

export async function extract(_s3Config, next = 0) {
  return next < values.length
    ? { data: [{ name: values[next] }], next: next + limit }
    : { data: null, next: next + limit };
}

export function transform(data) {
  const rows = [];
  data.forEach((datum) => {
    rows.push({
      assessmentName: datum.name,
    });
  });
  return pgp.helpers.insert(rows, insertColumns, tableName);
}
