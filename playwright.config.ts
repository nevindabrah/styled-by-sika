import { existsSync } from 'node:fs';
import { defineConfig } from '@playwright/test';
const macChrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const chromePath = process.env.CHROME_PATH || (existsSync(macChrome) ? macChrome : undefined);
export default defineConfig({
  testDir: './tests/browser',
  timeout: 45000,
  expect: { timeout: 10000 },
  fullyParallel: false,
  workers: 1,
  // Local runs use installed Google Chrome (or CHROME_PATH); CI uses Playwright's bundled Chromium.
  use: { baseURL: 'http://127.0.0.1:3002', headless: true, reducedMotion: 'reduce', launchOptions: chromePath ? { executablePath: chromePath } : {}, trace: 'retain-on-failure' },
  reporter: [['list']],
  webServer: { command: 'npm run demo', url: 'http://127.0.0.1:3002', reuseExistingServer: true, timeout: 30000 },
});
