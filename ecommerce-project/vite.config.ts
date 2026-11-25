import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Where /api and /images requests go. The Playwright tests point this at
// their own backend; normally it's the one you start on port 3000.
const backend = process.env.API_URL ?? 'http://localhost:3000';

// https://vite.dev/config/
export default defineConfig({
    plugins: [react({
        babel: {
            plugins: [['babel-plugin-react-compiler', { target: '19' }]],
        },
    })],
    server: {
        proxy: {
            '/api': { target: backend },
            '/images': { target: backend },
        },
    },
});
