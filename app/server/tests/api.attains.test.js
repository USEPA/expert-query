import supertest from 'supertest';
import app from '../app/app.js';

async function valuesTest(url, fieldNames) {
  for (let i = 0; i < fieldNames.length; i++) {
    const body = { text: '', limit: 20 };
    const response = await supertest(app)
      .post(`${url}/${fieldNames[i]}`)
      .send(body)
      .expect(200)
      .expect('Content-Type', /json/);

    expect(Array.isArray(response.body)).toBe(true);
  }
}

describe('API Attains Tests', () => {
  test('POST /api/attains/sources/count should return count', async () => {
    const body = { filters: { confirmed: ['Y'] }, options: { format: 'tsv' } };

    const response = await supertest(app)
      .post('/api/attains/sources/count')
      .send(body)
      .expect(200)
      .expect('Content-Type', /json/);

    expect(response.body).toHaveProperty('count');
  });

  test('GET /api/attains/sources/count should return count', async () => {
    const response = await supertest(app)
      .get('/api/attains/sources/count?confirmed=Y&format=tsv')
      .expect(200)
      .expect('Content-Type', /json/);

    expect(response.body).toHaveProperty('count');
  });

  test('POST /api/attains/sources should return data', async () => {
    const body = {
      filters: { confirmed: ['Y'], parameterGroup: ['OTHER CAUSE'] },
    };

    await supertest(app)
      .post('/api/attains/sources')
      .expect(200)
      .expect('Content-Type', /json/);
  });

  test('GET /api/attains/sources should return an array of data', async () => {
    const response = await supertest(app)
      .get('/api/attains/sources?confirmed=Y&parameterGroup=OTHER CAUSE')
      .expect(200)
      .expect('Content-Type', /json/);

    expect(Array.isArray(response.body.data)).toBe(true);
  });

  test('POST /api/attains/actions/values should return a list of values', async () => {
    const fieldNames = [
      'assessmentUnitId',
      'actionId',
      'assessmentUnitName',
      'actionName',
      'organizationName',
      'region',
    ];
    valuesTest('/api/attains/actions/values', fieldNames);
  });

  test('POST /api/attains/assessmentUnits/values should return a list of values', async () => {
    const fieldNames = [
      'assessmentUnitId',
      'assessmentUnitName',
      'locationText',
      'organizationName',
      'region',
    ];
    valuesTest('/api/attains/assessmentUnits/values', fieldNames);
  });

  test('POST /api/attains/assessments/values should return a list of values', async () => {
    const fieldNames = [
      'alternateListingIdentifier',
      'assessmentBasis',
      'assessmentMethods',
      'assessmentUnitId',
      'assessmentUnitName',
      'associatedActionId',
      'associatedActionName',
      'epaIrCategory',
      'organizationName',
      'overallStatus',
      'parameterAttainment',
      'parameterIrCategory',
      'region',
      'useGroup',
      'useIrCategory',
    ];
    valuesTest('/api/attains/assessments/values', fieldNames);
  });

  test('POST /api/attains/assessmentUnitsMonitoringLocations/values should return a list of values', async () => {
    const fieldNames = [
      'assessmentUnitId',
      'assessmentUnitName',
      'monitoringLocationId',
      'monitoringLocationOrgId',
      'organizationName',
      'region',
    ];
    valuesTest(
      '/api/attains/assessmentUnitsMonitoringLocations/values',
      fieldNames,
    );
  });

  test('POST /api/attains/catchmentCorrespondence/values should return a list of values', async () => {
    const fieldNames = [
      'assessmentUnitId',
      'assessmentUnitName',
      'organizationName',
      'region',
    ];
    valuesTest('/api/attains/catchmentCorrespondence/values', fieldNames);
  });

  test('POST /api/attains/sources/values should return a list of values', async () => {
    const fieldNames = [
      'assessmentUnitId',
      'assessmentUnitName',
      'causeName',
      'epaIrCategory',
      'organizationName',
      'overallStatus',
      'region',
    ];
    valuesTest('/api/attains/sources/values', fieldNames);
  });

  test('POST /api/attains/tmdl/values should return a list of values', async () => {
    const fieldNames = [
      'actionId',
      'actionName',
      'addressedParameter',
      'assessmentUnitId',
      'assessmentUnitName',
      'explicitMarginOfSafety',
      'implicitMarginOfSafety',
      'npdesIdentifier',
      'organizationName',
      'otherIdentifier',
      'region',
    ];
    valuesTest('/api/attains/tmdl/values', fieldNames);
  });

  test('POST /api/attains/wrongProfile/values/fieldName should return 404', async () => {
    const response = await supertest(app)
      .post('/api/attains/wrongProfile/values/fieldName')
      .expect(404)
      .expect('Content-Type', /json/);

    expect(response.body).toEqual({
      message: 'The requested profile does not exist',
    });
  });

  test('POST /api/attains/actions/values/wrongFieldName should return 400', async () => {
    const body = { text: 'ver' };
    const response = await supertest(app)
      .post('/api/attains/actions/values/wrongFieldName')
      .send(body)
      .expect(400)
      .expect('Content-Type', /json/);

    expect(response.body).toEqual({
      message:
        'The column wrongFieldName does not exist on the selected profile',
    });
  });

  test('GET /api/attains/assessmentUnits downloads csv', async () => {
    await supertest(app)
      .get(
        '/api/attains/assessmentUnits?columns=objectId&columns=region&assessmentUnitId=NHEST600030406-01&format=csv',
      )
      .expect(200)
      .expect('Content-Type', 'text/csv');
  });

  test('POST /api/attains/assessmentUnits downloads csv', async () => {
    const body = {
      columns: ['objectId', 'region'],
      filters: {
        assessmentUnitId: 'NHEST600030406-01',
      },
      options: {
        format: 'csv',
      },
    };
    await supertest(app)
      .post('/api/attains/assessmentUnits')
      .send(body)
      .expect(200)
      .expect('Content-Type', 'text/csv');
  });

  test('GET /api/attains/assessmentUnits downloads xlsx', async () => {
    await supertest(app)
      .get(
        '/api/attains/assessmentUnits?columns=objectId&columns=region&assessmentUnitId=NHEST600030406-01&format=xlsx',
      )
      .expect(200)
      .expect(
        'Content-Disposition',
        'attachment; filename=assessment_units.xlsx',
      );
  });

  test('POST /api/attains/assessmentUnits downloads xlsx', async () => {
    const body = {
      columns: ['objectId', 'region'],
      filters: {
        assessmentUnitId: 'NHEST600030406-01',
      },
      options: {
        format: 'xlsx',
      },
    };
    await supertest(app)
      .post('/api/attains/assessmentUnits')
      .send(body)
      .expect(200)
      .expect(
        'Content-Disposition',
        'attachment; filename=assessment_units.xlsx',
      );
  });

  test('GET /api/attains/assessmentUnits downloads tsv', async () => {
    await supertest(app)
      .get(
        '/api/attains/assessmentUnits?columns=objectId&columns=region&assessmentUnitId=NHEST600030406-01&format=tsv',
      )
      .expect(200)
      .expect('Content-Type', 'text/tsv');
  });

  test('POST /api/attains/assessmentUnits downloads tsv', async () => {
    const body = {
      columns: ['objectId', 'region'],
      filters: {
        assessmentUnitId: 'NHEST600030406-01',
      },
      options: {
        format: 'tsv',
      },
    };
    await supertest(app)
      .post('/api/attains/assessmentUnits')
      .send(body)
      .expect(200)
      .expect('Content-Type', 'text/tsv');
  });

  test('GET /api/tmdl range between query returns array of data', async () => {
    const response = await supertest(app)
      .get(
        '/api/attains/tmdl?columns=completionDate&organizationName=Florida&completionDateLo=06-19-2017&completionDateHi=06-19-2022',
      )
      .expect(200);

    expect(Array.isArray(response.body.data)).toBe(true);
  });

  test('GET /api/tmdl range above query returns array of data', async () => {
    const response = await supertest(app)
      .get(
        '/api/attains/tmdl?columns=completionDate&organizationName=Florida&completionDateLo=06-19-2017',
      )
      .expect(200);

    expect(Array.isArray(response.body.data)).toBe(true);
  });

  test('GET /api/tmdl range below query returns array of data', async () => {
    const response = await supertest(app)
      .get(
        '/api/attains/tmdl?columns=completionDate&organizationName=Florida&completionDateHi=06-19-2022',
      )
      .expect(200);

    expect(Array.isArray(response.body.data)).toBe(true);
  });

  test('GET /api/tmdl duplicate parameter exception', async () => {
    const response = await supertest(app)
      .get(
        '/api/attains/tmdl?columns=completionDate&organizationName=Florida&completionDateLo=06-19-2017&completionDateLo=06-19-2012',
      )
      .expect(400);

    expect(response.body).toEqual({
      error: "Error: Duplicate 'completionDateLo' parameters not allowed",
    });
  });

  test('GET /api/attains/assessmentUnits invalid parameter exception', async () => {
    const response = await supertest(app)
      .get(
        '/api/attains/assessmentUnits/count?nonExistentColumn=test&assessmentUnitId=NHEST600030406-01',
      )
      .expect(400);

    expect(response.body).toEqual({
      error:
        "Error: The parameter 'nonExistentColumn' is not valid for the specified profile",
    });
  });

  test('GET /api/attains/assessments exceeds maximum query size', async () => {
    const response = await supertest(app)
      .get('/api/attains/assessments?columns=objectId&format=csv')
      .expect(200);

    expect(response.body).toEqual({
      message:
        'The current query exceeds the maximum query size of 1,000,000 rows. Please refine the search, or visit http://localhost:3002/national-downloads to download a compressed dataset',
    });
  });

  test('POST /api/attains/assessments limit exceeded exception', async () => {
    const body = { text: '', limit: 120 };
    const response = await supertest(app)
      .post(`/api/attains/assessments/values/assessmentUnitId`)
      .send(body)
      .expect(400)
      .expect('Content-Type', /json/);

    expect(response.body).toEqual({
      error:
        'Error: The provided limit (120) exceeds the maximum 100 allowable limit.',
    });
  });

  test('GET /api/attains/assessments/countPerOrgCycle returns array of data', async () => {
    const response = await supertest(app)
      .get('/api/attains/assessments/countPerOrgCycle')
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
  });

  test('POST /api/attains/assessments/countPerOrgCycle returns array of data', async () => {
    const response = await supertest(app)
      .post('/api/attains/assessments/countPerOrgCycle')
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
  });

  test('GET /api/attains/health/etlDatabase returns up status', async () => {
    const response = await supertest(app)
      .get('/api/attains/health/etlDatabase')
      .expect(200);

    expect(JSON.stringify(response.body).includes('"status":"UP"')).toBe(true);
  });

  test('GET /api/attains/health/etlDomainValues returns up status', async () => {
    const response = await supertest(app)
      .get('/api/attains/health/etlDomainValues')
      .expect(200);

    expect(JSON.stringify(response.body).includes('"status":"UP"')).toBe(true);
  });

  test('GET /api/attains/assessmentUnits/count no parameters provided returns count and maxCount', async () => {
    const response = await supertest(app)
      .get('/api/attains/assessmentUnits/count')
      .expect(200);

    expect(response.body).toHaveProperty('count');
    expect(response.body).toHaveProperty('maxCount');
  });

  test('POST /api/attains/assessments/values with comparand returns array of value', async () => {
    const body = {
      text: '',
      limit: 20,
      additionalColumns: ['assessmentUnitName'],
      direction: 'asc',
      comparand: 'AL03130003-1301-111',
    };
    const response = await supertest(app)
      .post(`/api/attains/assessments/values/assessmentUnitId`)
      .send(body)
      .expect(200)
      .expect('Content-Type', /json/);

    expect(Array.isArray(response.body)).toBe(true);
  });
});
