import { test as setup, type Page,  expect } from '@playwright/test'
import * as fs from 'fs'
import { serverStartupCheck } from './server.startup.check'
import { adminSession, adminStorageState, editorSession, editorStorageState } from './constants'

async function login (user: string, role: string, page: Page, sessionFilePath: string, storageStateFilePath: string, baseURL: string | undefined) {
  const loginPath = process.env.AUTH_REDIRECT ?? 'http://fakeauth-test/login?clientId=dosgato-admin-test&returnUrl=http%3A%2F%2Fdosgato-proxy-test%2F%2eadmin'
  await page.goto(loginPath)
  await page.waitForSelector('div.login-page')
  await page.getByPlaceholder('username').fill(user)
  await page.getByRole('button', { name: 'login' }).click()
  await expect(page).toHaveURL(new RegExp(`^${baseURL??''}\/.admin/`))
  const adminpage = page.locator('div.topbar')
  await adminpage.waitFor({timeout: 30000})
  await expect(page).toHaveTitle('DEV DG Editing')
  await expect(page.getByRole('link', { name: 'Pages' }).first()).toBeVisible()

  // Get session storage and store in file
  const sessionStorage = await page.evaluate(() => JSON.stringify(sessionStorage))
  fs.writeFileSync(sessionFilePath, JSON.stringify(sessionStorage), 'utf-8')

  // const token = JSON.parse(sessionStorage).token
  // await page.goto(`${process.env.RENDER_BASE}/.token?token=${token}`)
  await page.context().storageState({ path: storageStateFilePath })
}

// used fixtures to get context setup for sessionStorage, need to figure out if 'setup' could resolve multi-workers running.
setup.beforeAll(async () => {
  await serverStartupCheck()
})

setup.describe('Authentications', () => {
  setup('log in as an admin', async ({browser, baseURL}) => {
    await login ('system', 'admin', await browser.newPage(), adminSession, adminStorageState , baseURL)
  })
  setup('log in as an editor', async ({browser, baseURL}) => {
    await login ('su01', 'editor', await browser.newPage(), editorSession, editorStorageState , baseURL)
  })
})