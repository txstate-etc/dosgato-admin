import { addUser, loadAdminAccessPage } from '../common'
import { test, expect } from '../fixtures'

const NEW_USER = {
  login: 'autotest-system1',
  lastname: 'systemusertest1',
  email: 'autotestsystemuser1@example.com'
}

test.beforeEach(async ({ adminPage, browserName }) => {
  NEW_USER.login = `autotest-system1-${browserName}`
  await loadAdminAccessPage(adminPage, 'system')
})

test.describe('system user list', () => {
  test('should be able to add a new system user', async ({ adminPage }) => {
    await addUser(adminPage, true, NEW_USER.login, NEW_USER.lastname, NEW_USER.email)
    await expect(adminPage.getByRole('treeitem').getByText(NEW_USER.login)).toBeVisible()
  })
  test('should be able to open a system user detail page', async ({ adminPage }) => {
    await adminPage.getByRole('treeitem').getByText(NEW_USER.login).dblclick()
    await expect(adminPage.getByRole('heading', { name: 'Basic Information' })).toBeVisible()
    await expect(adminPage.getByRole('heading', { name: 'Sites' })).toBeVisible()
    await expect(adminPage.getByRole('heading', { name: 'Roles' })).toBeVisible()
    await expect(adminPage.getByRole('heading', { name: 'Data' })).toBeVisible()
  })
  test('should be able to deactivate a system user', async ({ adminPage }) => {
    await adminPage.getByRole('treeitem').getByText(NEW_USER.login).click()
    await adminPage.getByRole('button', { name: 'Disable' }).click()
    await adminPage.getByRole('alertdialog').getByRole('button', { name: 'Disable User' }).click()
    await expect(adminPage.getByRole('button', { name: 'Enable' })).toBeVisible()
    await expect(adminPage.getByRole('button', { name: 'Disable' })).toBeHidden()
  })
  test('should be able to activate a deactivated system user', async ({ adminPage }) => {
    await adminPage.getByRole('treeitem').getByText(NEW_USER.login).click()
    await adminPage.getByRole('button', { name: 'Enable' }).click()
    await adminPage.getByRole('alertdialog').getByRole('button', { name: 'Enable User' }).click()
    await expect(adminPage.getByRole('button', { name: 'Disable' })).toBeVisible()
    await expect(adminPage.getByRole('button', { name: 'Enable' })).toBeHidden()
  })
})

test.describe('system user detail', () => {
  test('should be able to edit basic system user information', async ({ browserName, adminPage }) => {
    await adminPage.getByRole('treeitem').getByText(NEW_USER.login).dblclick()
    await adminPage.getByRole('button', { name: 'Edit Basic Information' }).click()
    await expect(adminPage.getByRole('alertdialog')).toBeVisible()
    await adminPage.getByLabel('Name').click()
    await adminPage.getByLabel('Name').fill(`${NEW_USER.lastname}-${browserName}`)
    await adminPage.getByLabel('Email').click()
    await adminPage.getByLabel('Email').fill(`${browserName}-email@example.com`)
    await adminPage.getByRole('button', { name: 'Save' }).click()
    await expect(adminPage.getByRole('alertdialog')).toHaveCount(0)
    await expect(adminPage.getByText(`${NEW_USER.lastname}-${browserName}`)).toHaveCount(1)
    await expect(adminPage.getByText(`${browserName}-email@example.com`)).toHaveCount(1)
    await adminPage.getByRole('button', { name: 'Edit Basic Information' }).click()
    await adminPage.getByLabel('Name').click()
    await adminPage.getByLabel('Name').fill(NEW_USER.lastname)
    await adminPage.getByLabel('Email').click()
    await adminPage.getByLabel('Email').fill(NEW_USER.email)
    await adminPage.getByRole('button', { name: 'Save' }).click()
    await expect(adminPage.getByText(`${NEW_USER.lastname}-${browserName}`)).toHaveCount(0)
    await expect(adminPage.getByText(`${browserName}-email@example.com`)).toHaveCount(0)
  })
  // On this page, you can also add/remove role and add/remove group. That functionality
  // is identical for system and non-system users and is already being tested.
})
