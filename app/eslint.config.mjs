import js from '@eslint/js';
import cypress from 'eslint-plugin-cypress';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default [
  {
    ignores: [
      'client/',
      'server/',
      'coverage/',
      '.nyc_output/',
      'combined_coverage_reports/',
      'combined_results_reports/',
      'cypress/downloads/',
      'cypress/screenshots/',
      'cypress/videos/',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended.map((config) => ({
    ...config,
    files: ['**/*.ts'],
  })),
  {
    files: ['**/*.js'],
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['**/*.ts'],
    plugins: { '@typescript-eslint': tseslint.plugin },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_' }, // ignore unused args starting with _
      ],
    },
  },
  {
    files: ['combine_coverage_reports.js'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: globals.node,
    },
  },
  {
    files: ['cypress.config.ts'],
    languageOptions: {
      sourceType: 'module',
      globals: globals.node,
    },
  },
  {
    // cypress.configs.recommended supplies the browser, mocha and cypress
    // globals that `env: { ... }` used to provide under eslintrc.
    ...cypress.configs.recommended,
    files: ['cypress/**/*.{js,ts}'],
    languageOptions: {
      ...cypress.configs.recommended.languageOptions,
      sourceType: 'module',
    },
  },
  {
    files: ['cypress/**/*.ts'],
    plugins: { '@typescript-eslint': tseslint.plugin },
    rules: {
      // `cond && cy.doThing()` is used deliberately throughout the specs.
      '@typescript-eslint/no-unused-expressions': [
        'error',
        { allowShortCircuit: true, allowTernary: true },
      ],
    },
  },
  {
    // `declare global { namespace Cypress { ... } }` is how Cypress custom
    // commands are typed; there is no module-syntax alternative.
    files: ['cypress/support/*.ts'],
    plugins: { '@typescript-eslint': tseslint.plugin },
    rules: { '@typescript-eslint/no-namespace': 'off' },
  },
];
