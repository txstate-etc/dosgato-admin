import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/src',
  testMatch: '*.ts',
  outputDir: './tests/artifacts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: 30000,
  workers:  1,
  reporter: [
    ['./tests/test.reporter.ts'],
    ['list', { printSteps: false }],
    ['html', { open: 'on-failure', outputFolder: './tests/report' }]],
  use: {
    baseURL: 'http://dosgato-proxy-test',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
    headless: true,
    // launchOptions: {
    //   slowMo:  2000
    // }
  },

  projects: [
    {
      name:'setup',
      testDir: "./tests",
      testMatch: "auth.setup.ts"
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        screenshot: 'off',
        video:'off',
        trace: 'on'
      },
      dependencies: ['setup'],
    },

    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
      },
      dependencies: ['setup'],
    },

    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
      },
      dependencies: ['setup'],
    },

    /* Test against mobile viewports. */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ]
});