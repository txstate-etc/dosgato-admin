// import { expect, test } from '@playwright/test'
import { test, expect } from '../fixtures'
import * as fs from 'fs'

test.beforeAll(async ({ browser }, testInfo) => {
  const page = await browser.newPage()
  const context = await browser.newContext()
  await page.goto('/')
  await page.goto('http://localhost:3001/login?clientId=dosgato-admin&returnUrl=http%3A%2F%2Flocalhost%3A3000%2F.admin&requestedUrl=http%3A%2F%2Flocalhost%3A3000%2F.admin%2F')
  await page.getByPlaceholder('username').fill('system')
  await page.getByRole('button', { name: 'login' }).click()
  await expect(page).toHaveTitle('DEV Gato Admin')
  await expect(page.getByRole('link', { name: 'Pages' }).first()).toBeVisible()
  // End of authentication steps.

  // await page.context().storageState({ path: storageState })
  // await page.waitForTimeout(20000)

  // Get session storage and store in file
  const sessionStorage = await page.evaluate(() => JSON.stringify(sessionStorage))
  fs.writeFileSync('tests/.auth/session.json', JSON.stringify(sessionStorage), 'utf-8')
  await context.close()
  await page.close()
})

test('confirm logged in', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle('DEV Gato Admin')
})
