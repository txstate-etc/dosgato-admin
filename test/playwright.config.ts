import { type PlaywrightTestConfig, devices } from '@playwright/test'

const config: PlaywrightTestConfig = {
  // our CI runs docker-in-docker on a shared worker and can be several times slower
  // than a dev machine; these only bind when something is genuinely stuck
  timeout: 60_000,
  expect: { timeout: 10_000 },
  webServer: [{
    command: 'while true; do sleep 600; done',
    url: 'http://api/health',
    reuseExistingServer: true
  }, {
    command: 'while true; do sleep 600; done',
    url: 'http://render/health',
    reuseExistingServer: true
  }],
  use: {
    baseURL: 'http://proxy',
    screenshot: { mode: 'only-on-failure', fullPage: true },
    trace: 'retain-on-failure'
  },
  testDir: 'tests',
  testMatch: /.+\.ts/,
  projects: [
    {
      name: 'chromium',
      use: devices['Desktop Chrome']
    }/* ,
    {
      name: 'firefox',
      use: devices['Desktop Firefox']
    },
    {
      name: 'webkit',
      use: devices['Desktop Safari']
    },
    {
      name: 'Mobile Chrome',
      use: devices['Pixel 5']
    },
    {
      name: 'Mobile Safari',
      use: devices['iPhone 12']
    } */
  ]
}

export default config
