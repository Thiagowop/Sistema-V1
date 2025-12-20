import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    server: {
        port: 5174,  // Different port from v1.0
        proxy: {
            '/api-clickup': {
                target: 'https://api.clickup.com',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api-clickup/, '/api/v2'),
                secure: false
            }
        }
    },
    build: {
        outDir: 'dist'
    }
});
