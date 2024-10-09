import supertest from 'supertest';
import app from '../app/app.js';

describe('Test example', () => {
  test('GET /api/health should return UP', async () => {
    const response = await supertest(app)
      .get('/api/health')
      .expect(200)
      .expect('Content-Type', /json/);

    expect(response.body).toEqual({ status: 'UP' });
  });
});
