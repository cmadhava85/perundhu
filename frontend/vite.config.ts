import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { visualizer } from 'rollup-plugin-visualizer'
import viteCspDevPlugin from './vite-csp-plugin.js'
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // PHASE 1 OPTIMIZATION: React Compiler for auto-memoization
      // Eliminates need for manual useMemo/useCallback in most cases
      // Results in 30-50% fewer re-renders and faster rendering
      // Note: Using Babel for React Compiler (SWC doesn't support it yet)
      babel: {
        plugins: [
          ['babel-plugin-react-compiler', {
            target: '19'
          }]
        ]
      }
    }),
    viteCspDevPlugin(),
    // PHASE 2 OPTIMIZATION: Bundle size visualization
    visualizer({
      filename: './dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }) as any,
    // PHASE 2 OPTIMIZATION: Image optimization
    // Automatically compresses images during build (40-60% smaller)
    // Reduces bandwidth and improves page load times
    ViteImageOptimizer({
      png: {
        quality: 80,
      },
      jpeg: {
        quality: 80,
      },
      jpg: {
        quality: 80,
      },
      webp: {
        lossless: false,
        quality: 80,
      },
      svg: {
        multipass: true,
        plugins: [
          {
            name: 'preset-default',
          },
        ],
      },
    }),
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
          // i18n chunk
          'i18n-vendor': ['i18next', 'react-i18next', 'i18next-browser-languagedetector'],
          // PHASE 2 OPTIMIZATION: Separate charts and query vendors
          'charts-vendor': ['recharts'],
          'query-vendor': ['@tanstack/react-query'],
        },
        // Optimize asset file names
        assetFileNames: (assetInfo) => {
          const name = assetInfo.names?.[0] || '';
          const info = name.split('.');
          const ext = info.at(-1);
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
      '/v1': {
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
