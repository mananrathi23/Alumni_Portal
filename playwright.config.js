const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  timeout: 60000,
  use: {
    // Tests run against a local production build of this checkout by default.
    // Set E2E_BASE_URL (e.g. the Vercel URL) to test a deployed site instead.
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:4173',
    trace: 'on-first-retry',
  },
  // API calls the specs rely on are mocked with page.route, so no backend is needed
  webServer: process.env.E2E_BASE_URL ? undefined : {
    command: 'npm --prefix frontend run build && npm --prefix frontend run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 180000,
    env: { VITE_BACKEND_URL: 'http://localhost:4000' },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
