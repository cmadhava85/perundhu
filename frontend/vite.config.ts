import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { visualizer } from 'rollup-plugin-visualizer'
import viteCspDevPlugin from './vite-csp-plugin.js'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    viteCspDevPlugin(),
    // PHASE 2 OPTIMIZATION: Bundle size visualization
    visualizer({
      filename: './dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }) as any,
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk for React core libraries
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // Maps library chunk
          'maps-vendor': ['leaflet', 'react-leaflet'],
          // UI framework chunk
          'ui-vendor': ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
          // i18n chunk
          'i18n-vendor': ['i18next', 'react-i18next', 'i18next-browser-languagedetector'],
          // PHASE 2 OPTIMIZATION: Separate charts and query vendors
          'charts-vendor': ['recharts'],
          'query-vendor': ['@tanstack/react-query'],
        },
        // Optimize asset file names
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') || [];
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext || '')) {
            return `assets/images/[name]-[hash][extname]`;
          } else if (/woff|woff2|eot|ttf|otf/i.test(ext || '')) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
      },
    },
    // Target modern browsers for better optimization
    target: 'esnext',
    // Enable minification in production
    minify: 'esbuild',
  },
  server: {
    port: 5173,
    open: false,
    strictPort: false,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path,
      },
    },
    hmr: {
      overlay: true,
      timeout: 60000,
      port: 24678,
    },
    watch: {
      usePolling: false,
      interval: 2000,
      ignored: [
        '**/node_modules/**',
        '**/.git/**',
        '**/dist/**',
        '**/build/**',
        '**/*.log',
        '**/coverage/**',
        '**/.vscode/**',
        '**/.idea/**',
      ],
    },
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@mui/material',
      '@mui/icons-material',
      'leaflet',
      'react-leaflet',
    ],
    exclude: ['@vite/client', '@vite/env'],
  },
  // Environment variables configuration
  envPrefix: 'VITE_',
  // Note: VITE_* env vars are automatically loaded from .env files
  // Do NOT use define: {} to override them as it bypasses .env file loading
})
