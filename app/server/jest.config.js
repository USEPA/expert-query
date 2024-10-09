export default {
  setupFiles: ['./jest_setup.js'],
  roots: ['tests'],
  transform: {},
  testPathIgnorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    '.nyc_output/',
    'coverage/',
  ],
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
};
