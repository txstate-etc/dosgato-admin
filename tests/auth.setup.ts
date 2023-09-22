import { test as setup, expect } from '@playwright/test'
import * as fs from 'fs'
import { serverStartupCheck } from './server.startup.check'
import { adminSession, adminStorageState } from './constants'

// used fixtures to get context setup for sessionStorage, need to figure out if 'setup' could resolve multi-workers running.

setup('authenticate', async ({ page }) => {
  await serverStartupCheck()
  const loginPath = process.env.AUTH_REDIRECT ?? ''
  await page.goto('/')
  await page.goto(loginPath)
  await page.waitForSelector('div.login-page')
  await page.getByPlaceholder('username').fill('system')
  await page.getByRole('button', { name: 'login' }).click()

  await page.waitForSelector('div.topbar', { timeout: 60000 })
  await expect(page).toHaveTitle('DEV DG Editing')
  await expect(page.getByRole('link', { name: 'Pages' }).first()).toBeVisible()

  // Get session storage and store in file
  const sessionStorage = await page.evaluate(() => JSON.stringify(sessionStorage))
  fs.writeFileSync(adminSession, JSON.stringify(sessionStorage), 'utf-8')

  await page.context().storageState({ path: adminStorageState })
})
