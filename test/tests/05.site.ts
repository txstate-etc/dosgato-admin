import { addSite, loadAdminSites } from '../common'
import { test, expect } from '../fixtures'

const NEW_SITE = {
  name: 'autotestsite',
  title: 'Automatic Test Root Page'
}

test.beforeEach(async ({ adminPage }) => {
  await loadAdminSites(adminPage)
})

test.describe('site list', async () => {
  test('should be able to add a site', async ({ adminPage }) => {
    await addSite(adminPage, NEW_SITE.name, NEW_SITE.title, 'keyp1')
    await expect(adminPage.getByRole('treeitem').getByText(NEW_SITE.name)).toBeVisible()
  })
  test('should be able to open a site detail page', async ({ adminPage }) => {
    await adminPage.getByRole('treeitem').getByText(NEW_SITE.name).dblclick()
    await expect(adminPage.locator('div.subnav li a').getByText(NEW_SITE.name)).toBeVisible()
    await expect(adminPage.getByRole('heading', { name: 'Site Information' })).toBeVisible()
    await expect(adminPage.getByRole('heading', { name: 'Site Stages' })).toBeVisible()
    await expect(adminPage.getByRole('heading', { name: 'Audit' })).toBeVisible()
    await expect(adminPage.getByRole('heading', { name: 'User Access' })).toBeVisible()
    await expect(adminPage.getByRole('heading', { name: 'Authorized Templates' })).toBeVisible()
  })
  test('should be able to delete a site', async ({ adminPage }) => {
    await adminPage.getByRole('treeitem').getByText(NEW_SITE.name).click()
    await adminPage.getByRole('button', { name: 'Delete' }).click()
    await adminPage.getByRole('alertdialog').getByRole('button', { name: 'Delete Site' }).click()
    await expect(adminPage.getByRole('treeitem').getByText(NEW_SITE.name)).toHaveCount(0)
  })
})
