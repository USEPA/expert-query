import js from '@eslint/js';
import prettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';

const isProduction = process.env.NODE_ENV === 'production';

export default [
  {
    ignores: [
      'coverage/',
      '.nyc_output/',
      'app/public/', // vendored EPA template assets (minified)
    ],
  },
  js.configs.recommended,
  // Applies eslint-config-prettier and turns on prettier/prettier. Prettier
  // picks up .prettierrc.json on its own, so the options need not be passed.
  prettierRecommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.node,
    },
    rules: {
      'no-console': isProduction ? 'warn' : 'off',
      'no-debugger': isProduction ? 'warn' : 'off',
      'no-unused-vars': ['error', { argsIgnorePattern: 'next' }],
    },
  },
  {
    files: ['tests/**/*.js', 'jest.config.js', 'jest_setup.js'],
    languageOptions: {
      globals: { ...globals.node, ...globals.jest },
    },
  },
];
