import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3015,
        host: '0.0.0.0',
        // @ts-ignore
        allowedHosts: process.env.TEMPO === "true" ? true : undefined,
        proxy: {
          '/api-clickup': {
            target: 'https://api.clickup.com/api/v2',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api-clickup/, ''),
            secure: false
          }
        }
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
