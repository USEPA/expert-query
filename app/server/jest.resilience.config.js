// Resilience lane: inherits the main suite's Allure reporting and setup. Never runs in `npm test`.
import base from './jest.config.js';

export default {
  ...base,
  roots: ['tests/resilience'],
  maxWorkers: 1, // kept separate from the parallel main suite: each test exhausts the pool, so they run serially
  testPathIgnorePatterns: ['node_modules/', 'dist/', 'build/'],
};
