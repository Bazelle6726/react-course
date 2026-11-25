import { defineConfig, devices } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// The browser tests start their own backend and front end on these ports, so
// they never touch the servers (or the database) you use while developing.
export const BACKEND_PORT = 3100;
const APP_PORT = 5180;

const here = dirname(fileURLToPath(import.meta.url));
const backendDir = join(here, '..', 'Ecommerce-backend');
// The backend keeps database.sqlite in the folder it's started from. Starting
// it here keeps the test data away from Ecommerce-backend/database.sqlite.
const testDatabaseDir = join(here, '.e2e-backend');
mkdirSync(testDatabaseDir, { recursive: true });

export default defineConfig({
    testDir: './e2e',
    // The tests share one backend and reset its data before each test,
    // so they run one at a time.
    workers: 1,
    fullyParallel: false,
    forbidOnly: true,
    retries: 0,
    reporter: [['list'], ['html', { open: 'never' }]],
    use: {
        baseURL: `http://localhost:${APP_PORT}`,
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
    },
    projects: [
        {
            name: 'edge',
            // Uses the Microsoft Edge already installed, so no browser download.
            // To use Playwright's own Chromium instead: `npx playwright install chromium`
            // and remove `channel`.
            use: { ...devices['Desktop Edge'], channel: 'msedge' },
        },
    ],
    webServer: [
        {
            command: `node "${join(backendDir, 'server.js')}"`,
            cwd: testDatabaseDir,
            env: { PORT: String(BACKEND_PORT) },
            url: `http://localhost:${BACKEND_PORT}/api/products`,
            reuseExistingServer: false,
            stdout: 'ignore',
        },
        {
            command: `npx vite --port ${APP_PORT} --strictPort`,
            env: { API_URL: `http://localhost:${BACKEND_PORT}` },
            url: `http://localhost:${APP_PORT}`,
            reuseExistingServer: false,
        },
    ],
});
