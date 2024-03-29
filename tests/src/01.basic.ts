import { loadAdminPages, locateEditFrame } from '../common'
import { test, expect } from '../fixtures'

let page

test.beforeEach(async ({ adminPage }) => {
  page = adminPage.page
  await loadAdminPages(page)
})

test.describe('basic', () => {
  test('should be logged in', async ({ adminPage, editorPage }) => {
    await expect(adminPage.page).toHaveTitle('DEV DG Editing')
    await expect(adminPage.greeting).toContainText('System User')
    await editorPage.page.goto('/.admin/pages')
    await expect(editorPage.page).toHaveTitle('DEV DG Editing')
    await expect(editorPage.greeting).toContainText('Michael Scott')
  })
  test('should be able to browse admin pages', async ({isMobile }) => {
    if (isMobile) {
      expect(await page.getByText('Basketry Home').isHidden()).toBeTruthy()
      await page.getByText('site1', { exact: true }).click()
    } else { await page.getByText('Basketry Home', { exact: true }).click() }
    await page.getByText('about', { exact: true }).click()
    await expect(page.getByRole('treeitem').getByText('people', { exact: true })).toBeVisible()
  })
  test('should be able to render a page', async () => {
    await page.goto('/.edit/bs-site')
    await expect(page.getByRole('button', { name: 'Add Main Content' })).toBeVisible()
  })
  test('should be able to edit a page', async () => {
    await page.waitForURL(/pages/)
    await page.getByRole('treeitem').nth(0).locator('svg').nth(1).click()
    // await page.locator('#h1b3 > .checkbox').click()
    await page.getByRole('button', { name: 'Edit' }).click()
    await locateEditFrame(page).getByRole('button', { name: 'Add main Content' }).click()
    await page.getByRole('button', { name: 'Column Layout' }).click()
    await page.getByLabel('Title *').fill('columntitle')
    await page.getByRole('button', { name: 'Save' }).click()
    await locateEditFrame(page).getByRole('button', { name: 'Add Column Layout Content' }).first().click()
    await page.getByLabel('Title').fill('paneltitle')
    await page.getByRole('button', { name: 'Save' }).click()
    await locateEditFrame(page).getByRole('button', { name: 'Delete Panel Component' }).nth(1).click()
    await page.getByRole('alertdialog').getByRole('button', { name: 'Delete', exact: true }).click()
    await locateEditFrame(page).getByRole('button', { name: 'Delete Column Layout' }).first().click()
    await page.getByRole('alertdialog').getByRole('button', { name: 'Delete', exact: true }).click()
  })
})
