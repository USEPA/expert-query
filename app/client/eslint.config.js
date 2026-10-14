import js from '@eslint/js';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';

const tsRecommended = tsPlugin.configs['flat/recommended'].find(
  (config) => config.name === 'typescript-eslint/recommended',
);

export default [
  {
    ignores: [
      'build/', // vite outDir (see vite.config.ts)
      'coverage/',
      'public/', // vendored USWDS and EPA template assets
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.browser,
      parser: tsParser,
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...tsPlugin.configs['flat/eslint-recommended'].rules,
      ...tsRecommended.rules,
      ...reactHooks.configs['recommended-latest'].rules,
      ...reactRefresh.configs.recommended.rules,
      'no-extra-boolean-cast': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_' }, // ignore unused args starting with _
      ],
    },
  },
  {
    files: ['gulpfile.js'],
    languageOptions: {
      sourceType: 'module',
      globals: globals.node,
    },
  },
];
