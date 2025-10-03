import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': './src'
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          maps: ['@react-google-maps/api'],
        }
      }
    }
  },
  server: {
    port: 5173,
    open: false, // Prevent auto-opening multiple browser tabs
    hmr: {
      overlay: true,
      // Reduce ping frequency to prevent excessive requests
      timeout: 60000,
      port: 24678, // Use a different port for HMR to avoid conflicts
    },
    // Optimize file watching to reduce requests
    watch: {
      usePolling: false,
      interval: 2000, // Increase interval to reduce file watching frequency
      ignored: [
        '**/node_modules/**', 
        '**/.git/**',
        '**/dist/**',
        '**/build/**',
        '**/*.log',
        '**/coverage/**'
      ],
    }
  },
  // Define environment variables to make them available in the client-side code
  define: {
    'process.env.NODE_ENV': JSON.stringify('development'),
    'process.env.VITE_API_URL': JSON.stringify('http://localhost:8080'),
    'process.env.VITE_API_BASE_URL': JSON.stringify('http://localhost:8080')
  }
})
