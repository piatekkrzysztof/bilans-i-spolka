import { defineConfig, devices } from '@playwright/test'

/**
 * E2E na buildzie produkcyjnym (`next start`), leady w pamięci (LEAD_STORE=memory), testowy sekret Turnstile.
 * Lokalnie można wskazać działający serwer: E2E_BASE_URL=http://localhost:3000 pnpm test:e2e
 */
const external = process.env.E2E_BASE_URL
const port = 3310

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: external ?? `http://localhost:${port}`,
    locale: 'pl-PL',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] }, testMatch: /mobile\.spec\.ts/ },
  ],
  webServer: external
    ? undefined
    : {
        command: `pnpm start --port ${port}`,
        port,
        reuseExistingServer: !process.env.CI,
        // Testowy sekret Cloudflare (zawsze przechodzi) - produkcja bez sekretu odrzuca leady z 503.
        env: { LEAD_STORE: 'memory', TURNSTILE_SECRET_KEY: '1x0000000000000000000000000000000AA' },
      },
})
