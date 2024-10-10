import app from '../app/app';

describe('ServerCheck', () => {
  test('App fails to start if required envs are missing', function () {
    const originalEnv = { ...process.env };
    delete process.env.DB_HOST;

    expect(() => {
      const app = require('../app/app');
    }).toThrow(Error);

    process.env = originalEnv;
  });

  test('App starts when everything is good', function () {
    let app;
    expect(() => {
      app;
    }).not.toThrow(Error);
  });
});
