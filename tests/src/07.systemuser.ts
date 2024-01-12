import { addUser, loadAdminAccessPage } from '../common'
import { test, expect } from '../fixtures'

let page

const NEW_USER= {
  login: 'autotest-system1',
  lastname: 'systemusertest1',
  email: 'autotestsystemuser1@example.com'
}

test.beforeEach(async ({ adminPage, browserName }) => {
  page = adminPage.page
  NEW_USER.login = `autotest-system1-${browserName}`
  await loadAdminAccessPage(page, 'system')
})

test.describe('system user list', async () => {
  test('should be able to add a new system user', async ({ isMobile }) => {
    await addUser(page, true, NEW_USER.login, NEW_USER.lastname, NEW_USER.email)
    await expect(page.getByRole('treeitem').getByText(NEW_USER.login)).toBeVisible()
  })
  test('should be able to open a system user detail page', async () => {
    await page.getByRole('treeitem').getByText(NEW_USER.login).dblclick()
    await expect(page.getByRole('heading', { name: 'Basic Information' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Sites' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Roles' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Data' })).toBeVisible()
  })
  test('should be able to deactivate a system user', async () => {
    await page.getByRole('treeitem').getByText(NEW_USER.login).click()
    await page.getByRole('button', { name: 'Disable' }).click()
    await page.getByRole('alertdialog').getByRole('button', { name: 'Disable User' }).click()
    await expect(page.getByRole('button', { name: 'Enable' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Disable' })).toBeHidden()
  })
  test('should be able to activate a deactivated system user', async () => {
    await page.getByRole('treeitem').getByText(NEW_USER.login).click()
    await page.getByRole('button', { name: 'Enable' }).click()
    await page.getByRole('alertdialog').getByRole('button', { name: 'Enable User' }).click()
    await expect(page.getByRole('button', { name: 'Disable' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Enable' })).toBeHidden()
  })
})

test.describe('system user detail', async () => {
  test('should be able to edit basic system user information', async ({ browserName }) => {
    await page.getByRole('treeitem').getByText(NEW_USER.login).dblclick()
    await page.getByRole('button', { name: 'Edit Basic Information' }).click()
    await expect(page.getByRole('alertdialog')).toBeVisible()
    await page.getByLabel('Name').click()
    await page.getByLabel('Name').fill(`${NEW_USER.lastname}-${browserName}`)
    await page.getByLabel('Email').click()
    await page.getByLabel('Email').fill(`${browserName}-email@example.com`)
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.getByRole('alertdialog')).toHaveCount(0)
    await expect(page.getByText(`${NEW_USER.lastname}-${browserName}`)).toHaveCount(1)
    await expect(page.getByText(`${browserName}-email@example.com`)).toHaveCount(1)
    await page.getByRole('button', { name: 'Edit Basic Information' }).click()
    await page.getByLabel('Name').click()
    await page.getByLabel('Name').fill(NEW_USER.lastname)
    await page.getByLabel('Email').click()
    await page.getByLabel('Email').fill(NEW_USER.email)
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.getByText(`${NEW_USER.lastname}-${browserName}`)).toHaveCount(0)
    await expect(page.getByText(`${browserName}-email@example.com`)).toHaveCount(0)
  })
  // On this page, you can also add/remove role and add/remove group. That functionality
  // is identical for system and non-system users and is already being tested.
})
