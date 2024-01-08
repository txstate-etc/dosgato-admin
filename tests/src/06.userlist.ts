import { addUser, loadAdminAccessPage } from '../common'
import { test, expect } from '../fixtures'
import { randomid } from 'txstate-utils'

let page

const NEW_USER= {
  login: `autotest-${randomid(5)}`,
  firstname: 'Otto',
  lastname: 'Testuser',
  email: 'autotestuser1@example.com'
}

test.beforeEach(async ({ adminPage }) => {
  page = adminPage.page
  await loadAdminAccessPage(page, 'users')
})

test.describe('user list', async() => {
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
    await expect(page.getByRole('button', {name: 'Enable' })).toBeVisible()
    await expect(page.getByRole('button', {name: 'Disable' })).toBeHidden()
  })
})