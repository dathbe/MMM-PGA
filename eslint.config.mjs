import eslintPluginJs from '@eslint/js'
import eslintPluginStylistic from '@stylistic/eslint-plugin'
import globals from 'globals'

const config = [
  eslintPluginJs.configs.recommended,
  eslintPluginStylistic.configs.recommended,
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
]

export default config
