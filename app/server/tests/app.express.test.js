describe('ServerCheck', () => {
  test('App fails to start if required envs are missing', function () {
    const originalEnv = { ...process.env };
    delete process.env.DB_HOST;

    expect(() => {
      require('../app/app');
    }).toThrow(Error);

    process.env = originalEnv;
  });
});
