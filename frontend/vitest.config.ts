import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    globals: true,
    css: true,
    include: ['**/__tests__/**/*.{test,spec}.{ts,tsx}', '**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', 'build', 'dist', '**/e2e/**', 'tests/e2e/**'],
    // Performance optimizations
    isolate: false,
    // Reduce test timeout for faster feedback
    testTimeout: 10000,
    hookTimeout: 10000,
    // Use threads pool for better memory efficiency than forks
    // Single thread reduces jsdom memory overhead from multiple instances
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true,
        // Increase isolation timeout if needed
        isolate: false
      }
    },
    // Silent unhandled worker pool errors that don't affect test results
    silent: false,
    reporter: 'default',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/setupTests.ts',
        '**/*.d.ts',
        '**/*.config.{js,ts}',
        '**/build/**',
        '**/dist/**'
      ]
    }
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
})