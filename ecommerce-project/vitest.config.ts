import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: './src/setupTests.ts',
        // Only the unit tests; the browser tests in e2e/ run with Playwright.
        include: ['src/**/*.test.{ts,tsx}'],
    },
});
