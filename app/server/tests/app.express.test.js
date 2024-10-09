import app from '../app/app';

describe('ServerCheck', () => {
  test('Test1', function () {
    let app;
    expect(() => {
      app;
    }).not.toThrow(Error);
  });
});
