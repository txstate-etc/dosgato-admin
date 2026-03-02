import { loadAdminData } from '../common'
import { test, expect } from '../fixtures'
import type { Page } from '@playwright/test'

const NEW_TAG_GROUP = {
  name: 'pagetags',
  tagnames: ['one', 'two', 'three']
}

async function addTagGroup(page: Page, name: string) {
  await page.getByLabel('Page Tag Set Display Name *').fill(name)
  for (const [index, tagname] of NEW_TAG_GROUP.tagnames.entries()) {
    await page.getByLabel('Tag Name').nth(index).fill(tagname)
    if (index < NEW_TAG_GROUP.tagnames.length - 1) {
      await page.getByRole('button', { name: 'Add', exact: true }).click()
    }
  }
}

test.beforeEach(async ({ adminPage, browserName, isMobile }) => {
  NEW_TAG_GROUP.name = `pagetags-${browserName}${isMobile ? '-mobile' : ''}`
  await loadAdminData(adminPage)
  await adminPage.getByRole('link', { name: 'Tags' }).click()
  await adminPage.getByRole('treeitem', { name: 'Global Data' }).click()
})

test.describe('page tags', () => {
  test('should be able to add a new tag group', async ({ adminPage }) => {
    await adminPage.getByRole('button', { name: 'Add Data' }).first().click()
    await addTagGroup(adminPage, NEW_TAG_GROUP.name)
    await adminPage.getByRole('button', { name: 'Save' }).click()
    await expect(adminPage.getByRole('treeitem').getByText(NEW_TAG_GROUP.name)).toBeVisible()
  })

  test('should be able to edit a tag group', async ({ adminPage }) => {
    await adminPage.getByRole('treeitem', { name: NEW_TAG_GROUP.name }).click()
    await adminPage.getByRole('button', { name: 'Edit', exact: true }).click()
    await expect(adminPage.getByRole('alertdialog')).toBeVisible()
    await expect(adminPage.getByLabel('Page Tag Set Display Name *')).toHaveValue(NEW_TAG_GROUP.name)
    await adminPage.getByRole('button', { name: 'Add', exact: true }).click()
    await adminPage.getByLabel('Tag Name').last().fill('four')
    await adminPage.getByRole('button', { name: 'Save' }).click()
    await adminPage.getByRole('button', { name: 'Edit', exact: true }).click()
    await expect(adminPage.getByRole('alertdialog')).toBeVisible()
    const lastTagInput = adminPage.getByLabel('Tag Name').last();
    await expect(lastTagInput).toHaveValue('four');
    await adminPage.getByRole('button', { name: 'Cancel' }).click()
  })

  test('should get a warning message when deleting a tag from a tag group', async ({ adminPage }) => {
    await adminPage.getByRole('treeitem', { name: NEW_TAG_GROUP.name }).click()
    await adminPage.getByRole('button', { name: 'Edit', exact: true }).click()
    adminPage.once('dialog', (dialog: { accept: () => Promise<void> }) => dialog.accept())
    await adminPage.getByLabel('remove from list').nth(1).click()
    // await adminPage.screenshot({ path: '../test-results/screenshot1.png' })
    await expect(adminPage.getByText('A tag in this set has been marked for deletion: upon saving, all instances of this tag will be removed')).toBeVisible()
    await adminPage.getByRole('button', { name: 'Cancel' }).click()
  })

  // TODO: Add tests for tagging pages with this tag group
})