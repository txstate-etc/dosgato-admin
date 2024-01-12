import { addGroup, loadAdminAccessPage } from '../common'
import { test, expect } from '../fixtures'

let page

const NEW_GROUP = {
  name: 'autotestgroup1',
}

test.beforeEach(async ({ adminPage, browserName }) => {
  page = adminPage.page
  NEW_GROUP.name = `autotestgroup1-${browserName}`
  await loadAdminAccessPage(page, 'groups')
})

test.describe('group list', async () => {
  test('should be able to add a new group', async () => {
    await addGroup(page, NEW_GROUP.name)
    await expect(page.getByRole('treeitem').getByText(NEW_GROUP.name)).toBeVisible()
  })
  test('should not be able to add a new group with a duplicate name', async () => {
    await page.getByRole('button', { name: 'Add Group' }).click()
    await page.getByLabel('Group Name').click()
    await page.getByLabel('Group Name').fill(NEW_GROUP.name)
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.getByRole('alertdialog')).toHaveCount(1)
    await expect(page.getByText(`Group ${NEW_GROUP.name} already exists.`)).toHaveCount(1)
    await page.getByRole('button', { name: 'Cancel' }).click()
    await expect(page.getByRole('alertdialog')).toHaveCount(0)
  })
  test('should be able to delete a group', async () => {
    await addGroup(page, `${NEW_GROUP.name}-deleteme`)
    await expect(page.getByRole('treeitem').getByText(`${NEW_GROUP.name}-deleteme`)).toBeVisible()
    await page.getByRole('treeitem').getByText(`${NEW_GROUP.name}-deleteme`).click()
    await page.getByRole('button', { name: 'Delete' }).click()
    await expect(page.getByRole('alertdialog')).toBeVisible()
    await page.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click()
    await expect(page.getByRole('treeitem').getByText(`${NEW_GROUP.name}-deleteme`)).toHaveCount(0)
  })
  test('should be able to add a subgroup', async () => {
    await page.getByRole('treeitem').getByText(NEW_GROUP.name).click()
    await addGroup(page, `${NEW_GROUP.name}-subgroup`)
    await page.getByRole('treeitem').getByText(NEW_GROUP.name).click()
    await expect(page.getByRole('treeitem').getByText(`${NEW_GROUP.name}-subgroup`)).toBeVisible()
  })
  test('should be able to open a group detail page', async () => {
    await page.getByRole('treeitem').getByText(NEW_GROUP.name).dblclick()
    await expect(page.getByRole('heading', { name: 'Basic Information' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Roles' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Members' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Sites' })).toBeHidden()
    await expect(page.getByRole('link', { name: `${NEW_GROUP.name}-subgroup` })).toHaveCount(1)
  })
})

test.describe('group detail', async () => {
  test('should be able to edit the group name', async () => {
    await page.getByRole('treeitem').getByText(NEW_GROUP.name, { exact: true }).dblclick()
    await page.getByRole('button', { name: 'Edit group name' }).click()
    await expect(page.getByRole('alertdialog')).toBeVisible()
    await page.getByRole('alertdialog').getByLabel('Group Name').click()
    await page.getByRole('alertdialog').getByLabel('Group Name').fill(`${NEW_GROUP.name}-edited`)
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.getByRole('alertdialog')).toHaveCount(0)
    await expect(page.locator('.panel .body dd', { name: `${NEW_GROUP.name}-edited`})).toHaveCount(1)
    await page.getByRole('button', { name: 'Edit group name' }).click()
    await page.getByRole('alertdialog').getByLabel('Group Name').click()
    await page.getByRole('alertdialog').getByLabel('Group Name').fill(NEW_GROUP.name)
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.getByText(`${NEW_GROUP.name}-edited`)).toHaveCount(0)
    await expect(page.locator('.panel .body dd', { name: NEW_GROUP.name })).toHaveCount(1)
  })
})