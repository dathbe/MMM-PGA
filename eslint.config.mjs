import eslintPluginJs from '@eslint/js'
import eslintPluginStylistic from '@stylistic/eslint-plugin'
import globals from 'globals'
import { defineConfig } from 'eslint/config'
// import css from '@eslint/css'

export default defineConfig([
  eslintPluginJs.configs.recommended,
  eslintPluginStylistic.configs.recommended,
  // {files: ["**/*.css"], languageOptions: {tolerant: true}, plugins: {css}, language: "css/css", extends: ["css/recommended"], rules: {"css/use-baseline": ["error", {available: "newly"}]}},
  {
    files: ['**/*.js'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        Log: 'readonly',
        Module: 'readonly',
        moment: 'readonly',
        config: 'readonly',
      },
      sourceType: 'commonjs',
    },
    rules: {
    },
  },
  {
    files: ['**/*.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: {
        ...globals.node,
      },
      sourceType: 'module',
    },
    rules: {
    },
  },
])
