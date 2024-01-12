import { addUser, loadAdminAccessPage } from '../common'
import { test, expect } from '../fixtures'

let page

const NEW_USER= {
  login: 'autotest1',
  firstname: 'Otto',
  lastname: 'Testuser',
  email: 'autotestuser1@example.com'
}

test.beforeEach(async ({ adminPage, browserName }) => {
  page = adminPage.page
  NEW_USER.login = `autotest1-${browserName}`
  await loadAdminAccessPage(page, 'users')
})

test.describe('user list', async () => {
  test('should be able to add a new user', async ({ isMobile }) => {
    await addUser(page, false, NEW_USER.login, NEW_USER.lastname, NEW_USER.email, NEW_USER.firstname)
    await expect(page.getByRole('treeitem').getByText(NEW_USER.login)).toBeVisible()
  })
  test('should be able to open a user detail page', async () => {
    await page.getByRole('treeitem').getByText(NEW_USER.login).dblclick()
    await expect(page.getByRole('heading', { name: 'Basic Information' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Sites' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Roles' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Data' })).toBeVisible()
  })
  test('should be able to deactivate a user', async () => {
    await page.getByRole('treeitem').getByText(NEW_USER.login).click()
    await page.getByRole('button', { name: 'Disable' }).click()
    await page.getByRole('alertdialog').getByRole('button', { name: 'Disable User' }).click()
    await expect(page.getByRole('button', { name: 'Enable' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Disable' })).toBeHidden()
  })
  test('should be able to activate a deactivated user', async () => {
    await page.getByRole('treeitem').getByText(NEW_USER.login).click()
    await page.getByRole('button', { name: 'Enable' }).click()
    await page.getByRole('alertdialog').getByRole('button', { name: 'Enable User' }).click()
    await expect(page.getByRole('button', { name: 'Disable' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Enable' })).toBeHidden()
  })
})

test.describe('user detail', async () => {
  test('should be able to edit basic user information', async ({ browserName }) => {
    await page.getByRole('treeitem').getByText(NEW_USER.login).dblclick()
    await page.getByRole('button', { name: 'Edit Basic Information' }).click()
    await expect(page.getByRole('alertdialog')).toBeVisible()
    await page.getByLabel('First Name').click()
    await page.getByLabel('First Name').fill(`${NEW_USER.firstname}-${browserName}`)
    await page.getByLabel('Last Name').click()
    await page.getByLabel('Last Name').fill(`${NEW_USER.lastname}-${browserName}`)
    await page.getByLabel('Email').click()
    await page.getByLabel('Email').fill(`${browserName}-email@example.com`)
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.getByRole('alertdialog')).toHaveCount(0)
    await expect(page.getByText(`${NEW_USER.firstname}-${browserName}`)).toHaveCount(1)
    await expect(page.getByText(`${NEW_USER.lastname}-${browserName}`)).toHaveCount(1)
    await expect(page.getByText(`${browserName}-email@example.com`)).toHaveCount(1)
    await page.getByRole('button', { name: 'Edit Basic Information' }).click()
    await page.getByLabel('First Name').click()
    await page.getByLabel('First Name').fill(NEW_USER.firstname)
    await page.getByLabel('Last Name').click()
    await page.getByLabel('Last Name').fill(NEW_USER.lastname)
    await page.getByLabel('Email').click()
    await page.getByLabel('Email').fill(NEW_USER.email)
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.getByText(`${NEW_USER.firstname}-${browserName}`)).toHaveCount(0)
    await expect(page.getByText(`${NEW_USER.lastname}-${browserName}`)).toHaveCount(0)
    await expect(page.getByText(`${browserName}-email@example.com`)).toHaveCount(0)
  })

  test('should be able to add a user to a group', async () => {
    await page.getByRole('treeitem').getByText(NEW_USER.login).dblclick()
    await page.getByRole('button', { name: 'Group Memberships' }).click()
    await expect(page.getByText(`User ${NEW_USER.login} is not a member of any groups.`)).toHaveCount(1)
    await page.getByRole('button', { name: `Add ${NEW_USER.firstname} ${NEW_USER.lastname} to groups` }).click()
    await expect(page.getByRole('alertdialog')).toBeVisible()
    await page.getByLabel('Add Groups').click()
    await expect(page.getByText('group3')).toHaveCount(1)
    await page.getByText('group3').click()
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.getByText(`User ${NEW_USER.login} is not a member of any groups.`)).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'group3' })).toHaveCount(1)
  })

  test('should be able to remove a user from a group', async () => {
    await page.getByRole('treeitem').getByText(NEW_USER.login).dblclick()
    await page.getByRole('button', { name: 'Group Memberships' }).click()
    await page.getByRole('button', { name: 'Remove user from group' }).click()
    await expect(page.getByText(`Remove user ${NEW_USER.login} from group group3?`)).toHaveCount(1)
    await page.getByRole('button', { name: 'Remove', exact: true }).click()
    await expect(page.getByRole('link', { name: 'group3' })).toHaveCount(0)
  })

  test('should be able to assign a role to a user', async () => {
    await page.getByRole('treeitem').getByText(NEW_USER.login).dblclick()
    await expect(page.getByText(`User ${NEW_USER.login} has no roles assigned`)).toHaveCount(1)
    await page.getByRole('button', { name: 'Assign roles to' }).click()
    await expect(page.getByRole('alertdialog')).toBeVisible()
    await expect(page.getByRole('alertdialog').getByText('Edit roles')).toHaveCount(1)
    await expect(page.getByRole('alertdialog').getByText('currently has 0 roles.')).toHaveCount(1)
    await page.getByLabel('Add More Roles').click()
    await page.getByRole('alertdialog').getByRole('option', { name: 'editor', exact: true }).click()
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.getByRole('alertdialog').getByText('currently has 0 roles.')).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'editor' })).toHaveCount(1)
  })

  test('should be able to remove a role from a user', async () => {
    await page.getByRole('treeitem').getByText(NEW_USER.login).dblclick()
    await expect(page.getByRole('link', { name: 'editor' })).toHaveCount(1)
    await page.getByRole('button', { name: 'Remove role from user' }).click()
    await expect(page.getByRole('alertdialog')).toBeVisible()
    await expect(page.getByRole('alertdialog').getByText('Remove Role', { exact: true })).toHaveCount(1)
    await page.getByRole('button', { name: 'Remove', exact: true }).click()
    await expect(page.getByRole('link', { name: 'editor' })).toHaveCount(0)
  })
})