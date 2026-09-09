/// <reference types="vitest/config" />

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  // React 컴포넌트 테스트가 브라우저 DOM API를 사용할 수 있도록 jsdom에서 실행한다.
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
