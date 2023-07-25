import { test as setup, expect } from '@playwright/test'
import * as fs from 'fs'

// used fixtures to get context setup for sessionStorage, need to figure out if 'setup' could resolve multi-workers running.
// const storageState = 'tests/.auth/storageState.json'

setup('authenticate', async ({ page }) => {
  // Perform authentication steps. Replace these actions with your own.
  await page.goto('/')
  await page.goto('http://localhost:3001/login?clientId=dosgato-admin&returnUrl=http%3A%2F%2Flocalhost%3A3000%2F.admin&requestedUrl=http%3A%2F%2Flocalhost%3A3000%2F.admin%2F')
  await page.getByPlaceholder('username').fill('system')
  await page.getByPlaceholder('password').fill('password')
  await page.getByRole('button', { name: 'login' }).click()
  // Wait until the page receives the cookies.
  //
  // Sometimes login flow sets cookies in the process of several redirects.
  // Wait for the final URL to ensure that the cookies are actually set.
  // await page.waitForURL('http://localhost:3000/.admin/pages')
  // Alternatively, you can wait until the page reaches a state where all cookies are set.
  await expect(page.getByRole('link', { name: 'Pages' }).first()).toBeVisible()
  // End of authentication steps.

  // await page.context().storageState({ path: storageState })
  // await page.waitForTimeout(20000)
})
