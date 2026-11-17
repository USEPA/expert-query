import os from 'node:os';

export default {
  setupFiles: ['./jest_setup.js'],
  roots: ['tests'],
  testEnvironment: 'allure-jest/node',
  testEnvironmentOptions: {
    resultsDir: '../combined_results_reports/results',
    environmentInfo: {
      os_platform: os.platform(),
      os_release: os.release(),
      os_version: os.version(),
      node_version: process.version,
    },
  },
  transform: {},
  testPathIgnorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    '.nyc_output/',
    'coverage/',
    'tests/resilience/', // run separately via `npm run test:resilience`
  ],
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
};
