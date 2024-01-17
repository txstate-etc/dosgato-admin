import { addRole, loadAdminAccessPage } from '../common'
import { test, expect } from '../fixtures'

let page

const NEW_ROLE = {
  name: 'autotestrole1',
}

test.beforeEach(async ({ adminPage, browserName, isMobile }) => {
  page = adminPage.page
  NEW_ROLE.name = `autotestrole1-${browserName}${isMobile ? '-mobile' : ''}`
  await loadAdminAccessPage(page, 'roles')
})

test.describe('role list', async () => {
  test('should be able to add a new role', async () => {
    await addRole(page, NEW_ROLE.name)
    await expect(page.getByRole('treeitem').getByText(NEW_ROLE.name)).toBeVisible()
  })
  test('should not be able to add a new role with a duplicate name', async () => {
    await page.getByRole('button', { name: 'Add Role' }).click()
    await page.getByLabel('Name').click()
    await page.getByLabel('Name').fill(NEW_ROLE.name)
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.getByRole('alertdialog')).toHaveCount(1)
    await expect(page.getByText(`Role ${NEW_ROLE.name} already exists`)).toHaveCount(1)
    await page.getByRole('button', { name: 'Cancel' }).click()
    await expect(page.getByRole('alertdialog')).toHaveCount(0)
  })
  test('should be able to delete a group', async () => {
    await addRole(page, `${NEW_ROLE.name}-deleteme`)
    await expect(page.getByRole('treeitem').getByText(`${NEW_ROLE.name}-deleteme`)).toBeVisible()
    await page.getByRole('treeitem').getByText(`${NEW_ROLE.name}-deleteme`).click()
    await page.getByRole('button', { name: 'Delete' }).click()
    await expect(page.getByRole('alertdialog')).toBeVisible()
    await page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click()
    await expect(page.getByRole('treeitem').getByText(`${NEW_ROLE.name}-deleteme`)).toHaveCount(0)
  })
  test('should be able to open a role detail page', async () => {
    await page.getByRole('treeitem').getByText(NEW_ROLE.name, { exact: true }).dblclick()
    await expect(page.getByRole('heading', { name: 'Basic Information' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Editor Permissions' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Administrator Permissions' })).toBeVisible()
    await expect(page.locator('dd').getByText(NEW_ROLE.name)).toHaveCount(1)
  })
})