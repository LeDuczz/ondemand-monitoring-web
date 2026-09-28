import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@noble/hashes/sha2.js': new URL('node_modules/@noble/hashes/sha2.js', import.meta.url).pathname,
      '@noble/hashes/utils.js': new URL('node_modules/@noble/hashes/utils.js', import.meta.url).pathname,
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    exclude: ['**/node_modules/**', '.claude/**'],
  },
})
