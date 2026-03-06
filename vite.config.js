import { defineConfig } from 'vite';

export default defineConfig({
    plugins: [],
    server: {
        proxy: {
            // Proxy /api requests to the Bun backend during development
            '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true,
            },
        },
    },
});
