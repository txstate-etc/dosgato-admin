import { test as base, type Page } from '@playwright/test'

export async function loginAs (page: Page, netid: string) {
  await page.goto('http://fakeauth/login?clientId=dosgato-admin&returnUrl=http%3A%2F%2Fproxy%2F.admin&requestedUrl=http%3A%2F%2Fproxy%2F.admin%2Fpages')
  const username = page.locator('input[name="username"]')
  await username.waitFor()
  await username.pressSequentially(netid)
  const submit = page.getByRole('button', { name: 'login' })
  await submit.click()
  await page.waitForURL(/^http:\/\/proxy\/\.admin\/(pages|dashboard)$/)
}

type MyFixtures = {
  adminPage: Page
  editorPage: Page
  ownerPage: Page
  managerPage: Page
  dbEditorPage: Page
}

export const test = base.extend<{}, MyFixtures>({
  adminPage: [async ({ browser }, use) =>{
    const context = await browser.newContext()
    const adminPage = await context.newPage()
    await loginAs(adminPage, 'su01')
    await use(adminPage)
    await context.close()
  }, { scope: 'worker' }],
  editorPage: [async ({ browser }, use) =>{
    const context = await browser.newContext()
    const editorPage = await context.newPage()
    await loginAs(editorPage, 'ed01')
    await use(editorPage)
    await context.close()
  }, { scope: 'worker' }],
  ownerPage: [async ({ browser }, use) =>{
    const context = await browser.newContext()
    const ownerPage = await context.newPage()
    await loginAs(ownerPage, 'db_owner')
    await use(ownerPage)
    await context.close()
  }, { scope: 'worker' }],
  managerPage: [async ({ browser }, use) =>{
    const context = await browser.newContext()
    const managerPage = await context.newPage()
    await loginAs(managerPage, 'db_manager1')
    await use(managerPage)
    await context.close()
  }, { scope: 'worker' }],
  dbEditorPage: [async ({ browser }, use) =>{
    const context = await browser.newContext()
    const dbEditorPage = await context.newPage()
    await loginAs(dbEditorPage, 'db_editor1')
    await use(dbEditorPage)
    await context.close()
  }, { scope: 'worker' }]
})

export const expect = test.expect
