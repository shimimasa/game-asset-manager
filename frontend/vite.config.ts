import { defineConfig, splitVendorChunkPlugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    splitVendorChunkPlugin(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Enable tree shaking
    treeShake: true,
    // Enable minification
    minify: 'esbuild',
    // Generate source maps for production
    sourcemap: true,
    // Set chunk size warning limit
    chunkSizeWarningLimit: 1000,
    // Manual chunks for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // React ecosystem
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // Material UI
          'mui-vendor': ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
          // Other large dependencies
          'query-vendor': ['@tanstack/react-query', 'axios'],
          // Utilities
          'utils-vendor': ['date-fns', 'react-dropzone'],
        },
      },
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
      '@tanstack/react-query',
      'axios',
    ],
  },
  server: {
    // Enable compression in dev server
    compress: true,
    // Proxy API requests to backend
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});