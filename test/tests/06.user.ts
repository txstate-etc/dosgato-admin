import { addUser, loadAdminAccessPage } from '../common'
import { test, expect } from '../fixtures'

const NEW_USER = {
  login: 'autotest1',
  firstname: 'Otto',
  lastname: 'Testuser',
  email: 'autotestuser1@example.com'
}

test.beforeEach(async ({ adminPage, browserName }) => {
  NEW_USER.login = `autotest1-${browserName}`
  await loadAdminAccessPage(adminPage, 'users')
})

test.describe('user list', () => {
  test('should be able to add a new user', async ({ adminPage }) => {
    await addUser(adminPage, false, NEW_USER.login, NEW_USER.lastname, NEW_USER.email, NEW_USER.firstname)
    await expect(adminPage.getByRole('treeitem').getByText(NEW_USER.login)).toBeVisible()
  })
  test('should be able to open a user detail page', async ({ adminPage }) => {
    await adminPage.getByRole('treeitem').getByText(NEW_USER.login).dblclick()
    await expect(adminPage.getByRole('heading', { name: 'Basic Information' })).toBeVisible()
    await expect(adminPage.getByRole('heading', { name: 'Sites' })).toBeVisible()
    await expect(adminPage.getByRole('heading', { name: 'Roles' })).toBeVisible()
    await expect(adminPage.getByRole('heading', { name: 'Data' })).toBeVisible()
  })
  test('should be able to deactivate a user', async ({ adminPage }) => {
    await adminPage.getByRole('treeitem').getByText(NEW_USER.login).click()
    await adminPage.getByRole('button', { name: 'Disable' }).click()
    await adminPage.getByRole('alertdialog').getByRole('button', { name: 'Disable User' }).click()
    await expect(adminPage.getByRole('button', { name: 'Enable' })).toBeVisible()
    await expect(adminPage.getByRole('button', { name: 'Disable' })).toBeHidden()
  })
  test('should be able to activate a deactivated user', async ({ adminPage }) => {
    await adminPage.getByRole('treeitem').getByText(NEW_USER.login).click()
    await adminPage.getByRole('button', { name: 'Enable' }).click()
    await adminPage.getByRole('alertdialog').getByRole('button', { name: 'Enable User' }).click()
    await expect(adminPage.getByRole('button', { name: 'Disable' })).toBeVisible()
    await expect(adminPage.getByRole('button', { name: 'Enable' })).toBeHidden()
  })
})

test.describe('user detail', () => {
  test('should be able to edit basic user information', async ({ browserName, adminPage }) => {
    await adminPage.getByRole('treeitem').getByText(NEW_USER.login).dblclick()
    await adminPage.getByRole('button', { name: 'Edit Basic Information' }).click()
    await expect(adminPage.getByRole('alertdialog')).toBeVisible()
    await adminPage.getByLabel('First Name').click()
    await adminPage.getByLabel('First Name').fill(`${NEW_USER.firstname}-${browserName}`)
    await adminPage.getByLabel('Last Name').click()
    await adminPage.getByLabel('Last Name').fill(`${NEW_USER.lastname}-${browserName}`)
    await adminPage.getByLabel('Email').click()
    await adminPage.getByLabel('Email').fill(`${browserName}-email@example.com`)
    await adminPage.getByRole('button', { name: 'Save' }).click()
    await expect(adminPage.getByRole('alertdialog')).toHaveCount(0)
    await expect(adminPage.getByText(`${NEW_USER.firstname}-${browserName}`)).toHaveCount(1)
    await expect(adminPage.getByText(`${NEW_USER.lastname}-${browserName}`)).toHaveCount(1)
    await expect(adminPage.getByText(`${browserName}-email@example.com`)).toHaveCount(1)
    await adminPage.getByRole('button', { name: 'Edit Basic Information' }).click()
    await adminPage.getByLabel('First Name').click()
    await adminPage.getByLabel('First Name').fill(NEW_USER.firstname)
    await adminPage.getByLabel('Last Name').click()
    await adminPage.getByLabel('Last Name').fill(NEW_USER.lastname)
    await adminPage.getByLabel('Email').click()
    await adminPage.getByLabel('Email').fill(NEW_USER.email)
    await adminPage.getByRole('button', { name: 'Save' }).click()
    await expect(adminPage.getByText(`${NEW_USER.firstname}-${browserName}`)).toHaveCount(0)
    await expect(adminPage.getByText(`${NEW_USER.lastname}-${browserName}`)).toHaveCount(0)
    await expect(adminPage.getByText(`${browserName}-email@example.com`)).toHaveCount(0)
  })

  test('should be able to add a user to a group', async ({ adminPage }) => {
    await adminPage.getByRole('treeitem').getByText(NEW_USER.login).dblclick()
    await adminPage.getByRole('button', { name: 'Group Memberships' }).click()
    await expect(adminPage.getByText(`User ${NEW_USER.login} is not a member of any groups.`)).toHaveCount(1)
    await adminPage.getByRole('button', { name: `Add ${NEW_USER.firstname} ${NEW_USER.lastname} to groups` }).click()
    await expect(adminPage.getByRole('alertdialog')).toBeVisible()
    await adminPage.getByLabel('Add Groups').click()
    await expect(adminPage.getByText('group3')).toHaveCount(1)
    await adminPage.getByText('group3').click()
    await adminPage.getByRole('button', { name: 'Save' }).click()
    await expect(adminPage.getByText(`User ${NEW_USER.login} is not a member of any groups.`)).toHaveCount(0)
    await expect(adminPage.getByRole('link', { name: 'group3' })).toHaveCount(1)
  })

  test('should be able to remove a user from a group', async ({ adminPage }) => {
    await adminPage.getByRole('treeitem').getByText(NEW_USER.login).dblclick()
    await adminPage.getByRole('button', { name: 'Group Memberships' }).click()
    await adminPage.getByRole('button', { name: 'Remove user from group' }).click()
    await expect(adminPage.getByText(`Remove user ${NEW_USER.login} from group group3?`)).toHaveCount(1)
    await adminPage.getByRole('button', { name: 'Remove', exact: true }).click()
    await expect(adminPage.getByRole('link', { name: 'group3' })).toHaveCount(0)
  })

  test('should be able to assign a role to a user', async ({ adminPage }) => {
    await adminPage.getByRole('treeitem').getByText(NEW_USER.login).dblclick()
    await expect(adminPage.getByText(`User ${NEW_USER.login} has no roles assigned`)).toHaveCount(1)
    await adminPage.getByRole('button', { name: 'Assign roles to' }).click()
    await expect(adminPage.getByRole('alertdialog')).toBeVisible()
    await expect(adminPage.getByRole('alertdialog').getByText('Edit roles')).toHaveCount(1)
    await expect(adminPage.getByRole('alertdialog').getByText('currently has 0 roles.')).toHaveCount(1)
    await adminPage.getByLabel('Add More Roles').click()
    await adminPage.getByRole('alertdialog').getByRole('option', { name: 'editor', exact: true }).click()
    await adminPage.getByRole('button', { name: 'Save' }).click()
    await expect(adminPage.getByRole('alertdialog').getByText('currently has 0 roles.')).toHaveCount(0)
    await expect(adminPage.getByRole('link', { name: 'editor' })).toHaveCount(1)
  })

  test('should be able to remove a role from a user', async ({ adminPage }) => {
    await adminPage.getByRole('treeitem').getByText(NEW_USER.login).dblclick()
    await expect(adminPage.getByRole('link', { name: 'editor' })).toHaveCount(1)
    await adminPage.getByRole('button', { name: 'Remove role from user' }).click()
    await expect(adminPage.getByRole('alertdialog')).toBeVisible()
    await expect(adminPage.getByRole('alertdialog').getByText('Remove Role', { exact: true })).toHaveCount(1)
    await adminPage.getByRole('button', { name: 'Remove', exact: true }).click()
    await expect(adminPage.getByRole('link', { name: 'editor' })).toHaveCount(0)
  })
})
