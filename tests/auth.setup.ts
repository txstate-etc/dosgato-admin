import { test as setup, expect } from '@playwright/test'
import * as fs from 'fs'
import { serverStartupCheck } from './server.startup.check'

// used fixtures to get context setup for sessionStorage, need to figure out if 'setup' could resolve multi-workers running.
const storageState = 'tests/.auth/storageState.json'

setup('authenticate', async ({ page }) => {
  await serverStartupCheck()

  await page.goto('/')
  // await page.goto('http://localhost:3001/login?clientId=dosgato-admin-test&returnUrl=http%3A%2F%2Flocalhost%3A3000%2F.admin&requestedUrl=http%3A%2F%2Flocalhost%3A3000%2F.admin%2Fpages')
  await page.goto('http://fakeauth-test/login?clientId=dosgato-admin-test&returnUrl=http%3A%2F%2Fdosgato-admin-test%3A3000%2F.admin&requestedUrl=http%3A%2F%2Fdosgato-admin-test%3A3000%2F.admin%2F')
  await page.waitForSelector('div.login-page')
  await page.getByPlaceholder('username').fill('system')
  await page.getByRole('button', { name: 'login' }).click()

  await page.waitForSelector('div.topbar', { timeout: 60000 })
  await expect(page).toHaveTitle('DEV DG Editing')
  await expect(page.getByRole('link', { name: 'Pages' }).first()).toBeVisible()
  // Wait until the page receives the cookies.
  //
  // Sometimes login flow sets cookies in the process of several redirects.
  // Wait for the final URL to ensure that the cookies are actually set.
  // await page.waitForURL('http://dosgato-admin-test:3000/.admin/pages')
  // Alternatively, you can wait until the page reaches a state where all cookies are set.
  // End of authentication steps.
  // await page.waitForResponse(response => response.headerValues('set-cookie') !== null, { timeout: 60000 })

  // Get session storage and store in file
  const sessionStorage = await page.evaluate(() => JSON.stringify(sessionStorage))
  fs.writeFileSync('tests/.auth/session.json', JSON.stringify(sessionStorage), 'utf-8')

  await page.context().storageState({ path: storageState })
})
