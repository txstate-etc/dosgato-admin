import { test as setup, expect } from '@playwright/test'
import * as fs from 'fs'
import waitOn from 'wait-on'
// used fixtures to get context setup for sessionStorage, need to figure out if 'setup' could resolve multi-workers running.
const storageState = 'tests/.auth/storageState.json'
const adminurl = process.env.DOSGATO_ADMIN_BASE
const authurl = process.env.AUTH_REDIRECT
const apiurl = process.env.API_BASE
const renderurl = `${process.env.RENDER_BASE}/.token`

const opts = {
  resources: [
    adminurl,
    authurl,
    apiurl,
    renderurl
  ],
  delay: 1000, // initial delay in ms, default 0
  interval: 100, // poll interval in ms, default 250ms
  simultaneous: 1, // limit to 1 connection per resource at a time
  timeout: 60000, // timeout in ms, default Infinity
  tcpTimeout: 1000, // tcp timeout in ms, default 300ms
  window: 1000, // stabilization time in ms, default 750ms
  log: true,
  proxy: false,
  strictSSL: false,
  followRedirect: true,
  headers: {
    'x-custom': 'headers'
  },
  validateStatus: function (status) {
    return status >= 200 && status < 300 // default if not provided
  }
}

setup('authenticate', async ({ page }) => {
  try {
    await waitOn(opts)
    console.log('==============================================================\nAll resources are available, servers started successfully.\n==============================================================')
  } catch (err) {
    console.log(err, 'Server startup failed. Exiting ......')
    process.exit(1)
  }

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

  // await page.context().addInitScript((storage) => {
  //   const entries = Object.entries(JSON.parse(storage));
  //   for (let i = 0; i < entries.length; i += 1) {
  //     const [key, value]: [key: string, value: any] = entries[i];
  //     window.sessionStorage.setItem(key, value);
  //     console.log(window.sessionStorage.toString(), 'window.sessionStorage');
  //   }
  // }, sessionStorage);

  // for setting cookies right to access render for editing
  // const token = JSON.parse(sessionStorage).token
  // await page.context().addCookies([
  //   { name: 'dg_token', value: token, domain: 'dosgato-render-test', path: '/.edit/', httpOnly: true, secure: false, sameSite: 'Strict' },
  //   { name: 'dg_token', value: token, domain: 'dosgato-render-test', path: '/.preview/', httpOnly: true, secure: false, sameSite: 'Strict' },
  //   { name: 'dg_token', value: token, domain: 'dosgato-render-test', path: '/.compare/', httpOnly: true, secure: false, sameSite: 'Strict' },
  //   { name: 'dg_token', value: token, domain: 'dosgato-render-test', path: '/.asset/', httpOnly: true, secure: false, sameSite: 'Strict' },
  //   { name: 'dg_token', value: token, domain: 'dosgato-render-test', path: '/.page/', httpOnly: true, secure: false, sameSite: 'Strict' }
  // ])

  await page.context().storageState({ path: storageState })
})
