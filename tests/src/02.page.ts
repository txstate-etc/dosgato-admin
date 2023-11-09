import type { Page } from '@playwright/test'
import { expandSite, loadAdminPages } from '../common'
import { test, expect } from '../fixtures'

const TEST_SITE = {
  name: 'site1',
  title: 'Basketry Home'
}

const NEW_PAGE = {
  name: 'template1test',
  title: 'Test pagetemplate1'
}

test.beforeEach(async ({ adminPage }) => {
  await loadAdminPages(adminPage.page)
  await expandSite(adminPage.page, TEST_SITE.name)
})

test.describe('page actions', () => {
  test('should be able to add a page', async ({ adminPage, isMobile }) => {
    const page = adminPage.page
    await addPage(page, NEW_PAGE.name, NEW_PAGE.title, 'keyp1')
    await expect(page.getByRole('group').getByText(NEW_PAGE.name)).toBeVisible()
    if(isMobile)
      await expect(page.locator('div.title.tree-cell').getByText(NEW_PAGE.title)).toHaveCount(0)
    else
      await expect(page.locator('div.title.tree-cell').getByText(NEW_PAGE.title)).toBeVisible()
  })
  test('should not be able to add a page with same URL Slug on same location ', async ({adminPage}) => {
    const page = adminPage.page
    await page.getByRole('button', { name: 'Add Page' }).click()
    await page.getByLabel('URL Slug *').click()
    await page.getByLabel('URL Slug *').fill(NEW_PAGE.name)
    await page.getByLabel('Page Template *').selectOption('keyp1')
    const saveLink = page.getByRole('button', { name: 'Save' })
    await saveLink.click()
    await expect(page.getByLabel('Error')).toBeVisible()
    await expect(page.locator('div.error').filter({ hasText: `Page name: ${NEW_PAGE.name} already exists in this location.` })).toHaveCount(1)
    await page.getByRole('button', { name: 'Cancel' }).click()
  })
  test('should be able to soft delete a page', async ({ adminPage, isMobile }) => {
    const page = adminPage.page
    await page.getByRole('group').getByText(NEW_PAGE.name).click()
    await page.getByRole('button', { name: 'Delete Page' }).click()
    await page.getByRole('button', { name: 'Delete', exact: true }).click()
    await expect(page.locator('div.right-panel header').getByText(NEW_PAGE.name)).toBeVisible()
    await page.locator('div.right-panel section header').click()
    await expect(page.getByRole('button', { name: 'Restore Page' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Finalize Deletion' })).toBeVisible()
    if(isMobile) {
      await expect(page.getByRole('treeitem', { name: NEW_PAGE.name }))
      .toHaveCount(1)
      await expect(page.getByRole('treeitem', { name: NEW_PAGE.name })
      .locator('div.title.tree-cell', { hasText: NEW_PAGE.title }))
      .toHaveCount(0)
    }
    else await expect(page.getByRole('treeitem', { name: NEW_PAGE.name })
                 .locator('div.title.tree-cell', { hasText: NEW_PAGE.title }))
                 .toHaveCount(1)
    await expect(page.getByRole('treeitem', { name: NEW_PAGE.name }).locator('div.deleted.status.tree-cell')).toBeVisible()
  })
  test('should be able to hard delete a page', async ({ adminPage }) => {
    const page = adminPage.page
    await page.getByRole('group').getByText(NEW_PAGE.name).click();
    await expect(page.locator('header')).toHaveText(NEW_PAGE.name)
    await page.getByRole('button', { name: 'Finalize Deletion' }).click();
    await expect(page.getByText('Publish Deletion')).toBeVisible();
    await page.getByRole('button', { name: 'Delete' }).click();
    await expect (page.getByRole('group').getByText(NEW_PAGE.name)).toHaveCount(0)
  })
  test('should be able to add a page with same URL Slug on diff location ', async ({adminPage, isMobile}) => {
    const page = adminPage.page
    await expect(page.getByRole('treeitem', {name: TEST_SITE.name})).toHaveCount(1)
    await expect(page.getByRole('group').getByText(TEST_SITE.name)).toHaveCount(0)
    if(!isMobile)
      await expect(page.locator('div.title.tree-cell').getByText(TEST_SITE.title)).toHaveCount(1)
    await addPage(page, TEST_SITE.name, TEST_SITE.title, 'keyp1')
    await expect(page.getByRole('treeitem', {name: TEST_SITE.name})).toHaveCount(2)
    await expect(page.getByRole('group').getByText(TEST_SITE.name)).toHaveCount(1)
    if(!isMobile)
      await expect(page.locator('div.title.tree-cell').getByText(TEST_SITE.title)).toHaveCount(2)
    await removePage(page, TEST_SITE.name)
    await expect(page.getByRole('treeitem', {name: TEST_SITE.name})).toHaveCount(1)
    await expect(page.getByRole('group').getByText(TEST_SITE.name)).toHaveCount(0)
    if(!isMobile)
      await expect(page.locator('div.title.tree-cell').getByText(TEST_SITE.title)).toHaveCount(1)
  })
})

async function addPage(page: Page, name: string, title: string, templateKey: string){
  await page.getByRole('button', { name: 'Add Page' }).click()
  await page.getByLabel('URL Slug *').click()
  await page.getByLabel('URL Slug *').fill(name)
  await page.getByLabel('Page Template *').selectOption(templateKey)
  await page.getByRole('button', { name: 'Save' }).click()
  await page.getByRole('textbox', { name: 'Title' }).click()
  await page.getByRole('textbox', { name: 'Title' }).fill(title)
  await page.getByRole('button', { name: 'Save' }).click()
}

async function removePage(page: Page, name: string){
  await page.getByRole('group').getByText(name).click()
  await page.getByRole('button', { name: 'Delete Page' }).click()
  await page.getByRole('button', { name: 'Delete', exact: true }).click()
  await page.getByRole('button', { name: 'Finalize Deletion' }).click();
  await page.getByRole('button', { name: 'Delete' }).click();
}