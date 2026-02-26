import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    proxy: {
      '/prweb': {
        target: process.env.VITE_PEGA_SERVER_URL || 'https://areteans-i25-plf.pegatsdemo.com/',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
