import { defineConfig, devices } from '@playwright/test'

const PORT = 3100
// Point at an already-running server (e.g. your own `npm run dev`) instead of starting one:
//   E2E_BASE_URL=http://localhost:3000 npm run test:e2e
const EXTERNAL = process.env.E2E_BASE_URL

export default defineConfig({
    testDir: './tests/e2e',
    timeout: 180_000,
    expect: { timeout: 20_000 },
    retries: process.env.CI ? 1 : 0,
    use: {
        baseURL: EXTERNAL ?? `http://localhost:${PORT}`,
        trace: 'retain-on-failure',
    },
    projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
    webServer: EXTERNAL ? undefined : {
        // CI tests the production build (`npm run build` runs first); locally, dev
        command: process.env.CI ? `npm run start -- --port ${PORT}` : `npm run dev -- --port ${PORT}`,
        url: `http://localhost:${PORT}`,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
    },
})
