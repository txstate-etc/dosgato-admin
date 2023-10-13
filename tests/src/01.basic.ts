import { test, expect } from '../fixtures'

test.describe('basic', () => {
  test('confirm logged in', async ({ adminPage, editorPage }) => {
    await adminPage.page.goto('/.admin/pages')
    await expect(adminPage.page).toHaveTitle('DEV DG Editing')
    await expect(adminPage.greeting).toContainText('System User')
    await editorPage.page.goto('/.admin/pages')
    await expect(editorPage.page).toHaveTitle('DEV DG Editing')
    await expect(editorPage.greeting).toContainText('Michael Scott')
  })
  test('browse', async ({ adminPage }) => {
    const page = adminPage.page
    await page.goto('/.admin/pages')
    await page.getByText('Basketry Home', { exact: true }).click()
    await page.getByText('about', { exact: true }).click()
    await expect(page.getByRole('tree').getByText('people', { exact: true })).toBeVisible()
  })
  test('render', async ({ adminPage }) => {
    const page = adminPage.page
    await page.goto('/.edit/bs-site')
    await expect(page.getByRole('button', { name: 'Add Main Content' })).toBeVisible()
  })
  test('edit', async ({ adminPage }) => {
    const page = adminPage.page
    await page.goto('/.admin/pages')
    await page.waitForURL(/pages/)
    await page.getByRole('treeitem').nth(0).locator('svg').nth(1).click()
    // await page.locator('#h1b3 > .checkbox').click()
    await page.getByRole('button', { name: 'Edit' }).click()
    await page.frameLocator('iframe[title="page preview for editing"]').getByRole('button', { name: 'Add main Content' }).click()
    await page.getByRole('button', { name: 'Column Layout' }).click()
    await page.getByLabel('Title *').click()
    await page.getByLabel('Title *').fill('columntitle')
    await page.getByRole('button', { name: 'Save' }).click()
    await page.frameLocator('iframe[title="page preview for editing"]').getByRole('button', { name: 'Add Column Layout Content' }).click()
    await page.getByLabel('Title').click()
    await page.getByLabel('Title').fill('paneltitle')
    await page.getByRole('button', { name: 'Save' }).click()
    await page.frameLocator('iframe[title="page preview for editing"]').getByRole('button', { name: 'Delete Panel Component' }).nth(1).click()
    await page.getByRole('alertdialog').getByRole('button', { name: 'Delete', exact: true }).click()
    await page.frameLocator('iframe[title="page preview for editing"]').getByRole('button', { name: 'Delete Column Layout' }).click()
    await page.getByRole('alertdialog').getByRole('button', { name: 'Delete', exact: true }).click()
  })
})