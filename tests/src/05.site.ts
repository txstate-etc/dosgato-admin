import type { Page } from '@playwright/test'
import { addSite, loadAdminSites } from '../common'
import { test, expect } from '../fixtures'

let page

const NEW_SITE = {
  name: 'autotestsite',
  title: 'Automatic Test Root Page'
}

test.beforeEach(async ({ adminPage }) => {
  page = adminPage.page
  await loadAdminSites(page)
})

test.describe('site list', async() => {
  test('should be able to add a site', async ({ isMobile }) => {
    await addSite(page, NEW_SITE.name, NEW_SITE.title, 'keyp1')
    await expect(page.getByRole('treeitem').getByText(NEW_SITE.name)).toBeVisible()
  })
  test('should be able to open a site detail page', async () => {
    await page.getByRole('treeitem').getByText(NEW_SITE.name).dblclick()
    await expect(page.locator('div.subnav li a').getByText(NEW_SITE.name)).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Site Information' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Site Stages' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Audit' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'User Access' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Authorized Templates' })).toBeVisible()
  })
  test('should be able to delete a site', async () => {
    await page.getByRole('treeitem').getByText(NEW_SITE.name).click()
    await page.getByRole('button', { name: 'Delete' }).click()
    await page.getByRole('alertdialog').getByRole('button', { name: 'Delete Site' }).click()
    await expect(page.getByRole('treeitem').getByText(NEW_SITE.name)).toHaveCount(0)
  })
})