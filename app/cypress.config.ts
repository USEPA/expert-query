import { defineConfig } from "cypress";

export default defineConfig({
  defaultCommandTimeout: 8000,
  retries: 1,
  video: true,
  viewportWidth: 1280,
  viewportHeight: 720,
  env: {
    codeCoverage: {
      url: 'http://localhost:3002/__coverage__',
    },
  },
  e2e: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    setupNodeEvents(on, config) {
      require("@cypress/code-coverage/task")(on, config);

      return config;
    },
    baseUrl: "http://localhost:3000",
  },
});
