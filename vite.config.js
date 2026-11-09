import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 1000
  },
  server: {
    proxy: {
      // Forwards frontend calls to /api/* to the Express backend in
      // server/index.js during `npm run dev`, so the browser never needs
      // to know the backend's port and CORS stays a non-issue in dev.
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      },
      // Community chat's real-time connection (Socket.IO) needs the ws
      // upgrade proxied too, or the client falls back to slow polling.
      '/socket.io': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        ws: true
      }
    }
  }
});
