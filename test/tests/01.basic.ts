import { locateEditFrame } from '../common'
import { test, expect } from '../fixtures'

test.describe('basic', () => {
  test('should be logged in', async ({ adminPage, editorPage }) => {
    await adminPage.goto('/.admin/pages')
    await expect(adminPage).toHaveTitle('DEV DG Editing')
    await expect(adminPage.locator('button.login-status')).toContainText('Michael Scott')
    await editorPage.goto('/.admin/pages')
    await expect(editorPage).toHaveTitle('DEV DG Editing')
    await expect(editorPage.locator('button.login-status')).toContainText('Draco Malfoy')
  })
  test('should be able to browse admin pages', async ({ isMobile, adminPage }) => {
    await adminPage.goto('/.admin/pages')
    if (isMobile) {
      expect(await adminPage.getByText('Basketry Home').isHidden()).toBeTruthy()
      await adminPage.getByText('site1', { exact: true }).click()
    } else { await adminPage.getByText('Basketry Home', { exact: true }).click() }
    await adminPage.getByText('about', { exact: true }).click()
    await expect(adminPage.getByRole('treeitem').getByText('people', { exact: true })).toBeVisible()
  })
  test('should be able to render a page', async ({ adminPage }) => {
    await adminPage.goto('/.edit/site1')
    await expect(adminPage.getByRole('button', { name: 'Add Main Content' })).toBeVisible()
  })
  test('should be able to edit a page', async ({ adminPage }) => {
    await adminPage.goto('/.admin/pages')
    await adminPage.getByRole('treeitem', { name: /\bsite1\b/ }).click()
    await adminPage.getByRole('button', { name: 'Edit' }).click()
    const editFrame = locateEditFrame(adminPage)
    await editFrame.getByRole('button', { name: 'Add main Content' }).click()
    await adminPage.getByRole('button', { name: 'Column Layout' }).click()
    await adminPage.getByLabel('Title *').fill('columntitle')
    await adminPage.getByRole('button', { name: 'Save' }).click()
    await editFrame.getByRole('button', { name: 'Add Column Layout Content' }).first().click()
    await adminPage.getByRole('button', { name: 'Panel Component' }).click()
    await adminPage.getByLabel('Title').fill('paneltitle')
    await adminPage.getByRole('button', { name: 'Save' }).click()
    await editFrame.getByRole('button', { name: /Delete Panel Component/ }).first().click()
    await adminPage.getByRole('alertdialog').getByRole('button', { name: 'Delete', exact: true }).click()
    await editFrame.getByRole('button', { name: /Delete Column Layout/ }).first().click()
    await adminPage.getByRole('alertdialog').getByRole('button', { name: 'Delete', exact: true }).click()
  })
})
