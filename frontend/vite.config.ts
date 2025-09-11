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
    port: 3000,
    open: true,
  },
  // Define environment variables to make them available in the client-side code
  define: {
    'process.env.NODE_ENV': JSON.stringify('development'),
    'process.env.VITE_API_URL': JSON.stringify('http://localhost:8080'),
    'process.env.VITE_API_BASE_URL': JSON.stringify('http://localhost:8080')
  }
})
