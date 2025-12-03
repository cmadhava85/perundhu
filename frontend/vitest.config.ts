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
    isolate: true,
    // Reduce test timeout for faster feedback
    testTimeout: 10000,
    hookTimeout: 10000,
    // Pool options for better performance - use forks for faster execution
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: false,
        isolate: true
      }
    },
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