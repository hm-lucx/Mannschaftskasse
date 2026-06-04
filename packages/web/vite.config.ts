import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        // In Docker: 'api' resolves to the api container via Docker DNS
        // Locally without Docker: change to http://localhost:3000
        target: process.env.API_TARGET || 'http://api:3000',
        changeOrigin: true,
      },
    },
  },
});
