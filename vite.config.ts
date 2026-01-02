import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');

    return {
        plugins: [react()],
        server: {
            port: 5174,
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
            outDir: 'dist',
            chunkSizeWarningLimit: 1000,
            rollupOptions: {
                output: {
                    manualChunks: {
                        'vendor-react': ['react', 'react-dom'],
                        'vendor-supabase': ['@supabase/supabase-js'],
                        'vendor-ui': ['lucide-react', 'lz-string']
                    }
                }
            }
        }
    };
});
