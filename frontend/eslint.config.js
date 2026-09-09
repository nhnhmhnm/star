import js from '@eslint/js'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

const browserGlobals = {
  Blob: 'readonly',
  console: 'readonly',
  document: 'readonly',
  fetch: 'readonly',
  URL: 'readonly',
  window: 'readonly',
  clearInterval: 'readonly',
  setInterval: 'readonly',
}

export default tseslint.config(
  {
    ignores: [
      'dist',
      'dist-stellarium',
      'coverage',
      'node_modules',
      'experiments/stellarium/public',
      'experiments/stellarium/vendor',
    ],
  },
  js.configs.recommended,
  tseslint.configs.recommended,
  // commitlint 설정 파일은 Node의 CommonJS 환경에서 실행된다.
  {
    files: ['*.cjs'],
    languageOptions: {
      globals: {
        module: 'readonly',
      },
    },
  },
  {
    files: ['experiments/**/*.js'],
    languageOptions: {
      globals: browserGlobals,
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      globals: browserGlobals,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },
)
