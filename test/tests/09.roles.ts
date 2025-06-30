import { addRole, loadAdminAccessPage } from '../common'
import { test, expect } from '../fixtures'

const NEW_ROLE = {
  name: 'autotestrole1'
}

test.beforeEach(async ({ adminPage, browserName, isMobile }) => {
  NEW_ROLE.name = `autotestrole1-${browserName}${isMobile ? '-mobile' : ''}`
  await loadAdminAccessPage(adminPage, 'roles')
})

test.describe('role list', () => {
  test('should be able to add a new role', async ({ adminPage }) => {
    await addRole(adminPage, NEW_ROLE.name)
    await expect(adminPage.getByRole('treeitem').getByText(NEW_ROLE.name)).toBeVisible()
  })
  test('should not be able to add a new role with a duplicate name', async ({ adminPage }) => {
    await adminPage.getByRole('button', { name: 'Add Role' }).click()
    await adminPage.getByLabel('Name').click()
    await adminPage.getByLabel('Name').fill(NEW_ROLE.name)
    await adminPage.getByRole('button', { name: 'Save' }).click()
    await expect(adminPage.getByRole('alertdialog')).toHaveCount(1)
    await expect(adminPage.getByText(`Role ${NEW_ROLE.name} already exists`)).toHaveCount(1)
    await adminPage.getByRole('button', { name: 'Cancel' }).click()
    await expect(adminPage.getByRole('alertdialog')).toHaveCount(0)
  })
  test('should be able to delete a group', async ({ adminPage }) => {
    await addRole(adminPage, `${NEW_ROLE.name}-deleteme`)
    await expect(adminPage.getByRole('treeitem').getByText(`${NEW_ROLE.name}-deleteme`)).toBeVisible()
    await adminPage.getByRole('treeitem').getByText(`${NEW_ROLE.name}-deleteme`).click()
    await adminPage.getByRole('button', { name: 'Delete' }).click()
    await expect(adminPage.getByRole('alertdialog')).toBeVisible()
    await adminPage.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click()
    await expect(adminPage.getByRole('treeitem').getByText(`${NEW_ROLE.name}-deleteme`)).toHaveCount(0)
  })
  test('should be able to open a role detail page', async ({ adminPage }) => {
    await adminPage.getByRole('treeitem').getByText(NEW_ROLE.name, { exact: true }).dblclick()
    await expect(adminPage.getByRole('heading', { name: 'Basic Information' })).toBeVisible()
    await expect(adminPage.getByRole('heading', { name: 'Editor Permissions' })).toBeVisible()
    await expect(adminPage.getByRole('heading', { name: 'Administrator Permissions' })).toBeVisible()
    await expect(adminPage.locator('dd').getByText(NEW_ROLE.name)).toHaveCount(1)
  })
})
