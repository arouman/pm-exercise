import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite dev server: serves the React app, proxies /api to Express.
// In production, `npm run build` outputs to client/dist and Express serves it.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
