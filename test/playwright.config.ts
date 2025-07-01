import { type PlaywrightTestConfig, devices } from '@playwright/test'

const config: PlaywrightTestConfig = {
	webServer: [{
		command: 'while true; do sleep 600; done',
		url: 'http://api/health',
		reuseExistingServer: true
	},{
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
		}/*,
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
			use: devices['Pixel 5'],
		},
		{
			name: 'Mobile Safari',
			use: devices['iPhone 12'],
		}*/
	]
}

export default config
