import supertest from 'supertest';
import app from '../app/app.js';

describe('API Tests', () => {
  test('GET /api/health should return UP', async () => {
    const response = await supertest(app)
      .get('/api/health')
      .expect(200)
      .expect('Content-Type', /json/);

    expect(response.body).toEqual({ status: 'UP' });
  });

  test('GET /api/health/etlGlossary should return UP', async () => {
    const response = await supertest(app)
      .get('/api/health/etlGlossary')
      .expect(200)
      .expect('Content-Type', /json/);

    expect(response.body).toEqual({ status: 'UP' });
  });

  test('GET /api/lookupFiles should return config json', async () => {
    const response = await supertest(app)
      .get('/api/lookupFiles')
      .expect(200)
      .expect('Content-Type', /json/);

    expect(response.body).toHaveProperty('alertsConfig');
    expect(response.body).toHaveProperty('domainValues');
    expect(response.body).toHaveProperty('glossary');
    expect(response.body).toHaveProperty('services');
  });

  test('POST /api/lookupFiles should return 404', async () => {
    const response = await supertest(app)
      .post('/api/lookupFiles')
      .expect(404)
      .expect('Content-Type', /json/);

    expect(response.body).toEqual({ message: 'The api route does not exist.' });
  });

  test('GET /api/thisIsNotReal should return 404', async () => {
    const response = await supertest(app)
      .get('/api/thisIsNotReal')
      .expect(404)
      .expect('Content-Type', /json/);

    expect(response.body).toEqual({ message: 'The api route does not exist.' });
  });

  test('POST /api/thisIsNotReal should return 404', async () => {
    const response = await supertest(app)
      .post('/api/thisIsNotReal')
      .expect(404)
      .expect('Content-Type', /json/);

    expect(response.body).toEqual({ message: 'The api route does not exist.' });
  });

  test('GET test checkClientRouteExists middleware', async () => {
    const response = await supertest(app).get('/attains/test').expect(404);
  });

  test('PUT should return 401 unauthorized', async () => {
    await supertest(app).put('/api/health').expect(401);
  });

  test('DELETE should return 401 unauthorized', async () => {
    await supertest(app).delete('/api/health').expect(401);
  });

  test('GET /bogusRoute should return 404', async () => {
    await supertest(app)
      .get('/bogusRoute')
      .expect(404)
      .expect('Content-type', 'text/html; charset=UTF-8');
  });

  test('GET /404.html should return 404 and html', async () => {
    await supertest(app)
      .get('/404.html')
      .expect(404)
      .expect('Content-type', 'text/html; charset=UTF-8');
  });

  test('GET /500.html should return 200 and html', async () => {
    await supertest(app)
      .get('/500.html')
      .expect(200)
      .expect('Content-type', 'text/html; charset=UTF-8');
  });
});
