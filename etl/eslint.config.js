import js from '@eslint/js';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.node,
    },
    rules: {
      'comma-dangle': ['error', 'only-multiline'],
      'no-case-declarations': 'off',
      'no-fallthrough': 'off',
      'no-useless-escape': 'off',
    },
  },
];
