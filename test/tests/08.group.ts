import { addGroup, loadAdminAccessPage } from '../common'
import { test, expect } from '../fixtures'

const NEW_GROUP = {
  name: 'autotestgroup1'
}

test.beforeEach(async ({ adminPage, browserName, isMobile }) => {
  NEW_GROUP.name = `autotestgroup1-${browserName}${isMobile ? '-mobile' : ''}`
  await loadAdminAccessPage(adminPage, 'groups')
})

test.describe('group list', () => {
  test('should be able to add a new group', async ({ adminPage }) => {
    await addGroup(adminPage, NEW_GROUP.name)
    await expect(adminPage.getByRole('treeitem').getByText(NEW_GROUP.name)).toBeVisible()
  })
  test('should not be able to add a new group with a duplicate name', async ({ adminPage }) => {
    await adminPage.getByRole('button', { name: 'Add Group' }).click()
    await adminPage.getByLabel('Group Name').click()
    await adminPage.getByLabel('Group Name').fill(NEW_GROUP.name)
    await adminPage.getByRole('button', { name: 'Save' }).click()
    await expect(adminPage.getByRole('alertdialog')).toHaveCount(1)
    await expect(adminPage.getByText(`Group ${NEW_GROUP.name} already exists.`)).toHaveCount(1)
    await adminPage.getByRole('button', { name: 'Cancel' }).click()
    await expect(adminPage.getByRole('alertdialog')).toHaveCount(0)
  })
  test('should be able to delete a group', async ({ adminPage }) => {
    await addGroup(adminPage, `${NEW_GROUP.name}-deleteme`)
    await expect(adminPage.getByRole('treeitem').getByText(`${NEW_GROUP.name}-deleteme`)).toBeVisible()
    await adminPage.getByRole('treeitem').getByText(`${NEW_GROUP.name}-deleteme`).click()
    await adminPage.getByRole('button', { name: 'Delete' }).click()
    await expect(adminPage.getByRole('alertdialog')).toBeVisible()
    await adminPage.getByRole('alertdialog').getByRole('button', { name: 'Delete' }).click()
    await expect(adminPage.getByRole('treeitem').getByText(`${NEW_GROUP.name}-deleteme`)).toHaveCount(0)
  })
  test('should be able to add a subgroup', async ({ adminPage }) => {
    await adminPage.getByRole('treeitem').getByText(NEW_GROUP.name, { exact: true }).click()
    await addGroup(adminPage, `${NEW_GROUP.name}-subgroup`)
    await adminPage.getByRole('treeitem').getByText(NEW_GROUP.name, { exact: true }).click()
    await expect(adminPage.getByRole('treeitem').getByText(`${NEW_GROUP.name}-subgroup`, { exact: true })).toBeVisible()
  })
  test('should be able to open a group detail page', async ({ adminPage }) => {
    await adminPage.getByRole('treeitem').getByText(NEW_GROUP.name, { exact: true }).dblclick()
    await expect(adminPage.getByRole('heading', { name: 'Basic Information' })).toBeVisible()
    await expect(adminPage.getByRole('heading', { name: 'Roles' })).toBeVisible()
    await expect(adminPage.getByRole('heading', { name: 'Members' })).toBeVisible()
    await expect(adminPage.getByRole('heading', { name: 'Sites' })).toBeHidden()
    await expect(adminPage.getByRole('link', { name: `${NEW_GROUP.name}-subgroup`, exact: true })).toHaveCount(1)
  })
})

test.describe('group detail', () => {
  test('should be able to edit the group name', async ({ adminPage }) => {
    await adminPage.getByRole('treeitem').getByText(NEW_GROUP.name, { exact: true }).dblclick()
    await adminPage.getByRole('button', { name: 'Edit group name' }).click()
    await expect(adminPage.getByRole('alertdialog')).toBeVisible()
    await adminPage.getByRole('alertdialog').getByLabel('Group Name').click()
    await adminPage.getByRole('alertdialog').getByLabel('Group Name').fill(`${NEW_GROUP.name}-edited`)
    await adminPage.getByRole('button', { name: 'Save' }).click()
    await expect(adminPage.getByRole('alertdialog')).toHaveCount(0)
    await expect(adminPage.locator('.panel .body dd', { hasText: `${NEW_GROUP.name}-edited` })).toHaveCount(1)
    await adminPage.getByRole('button', { name: 'Edit group name' }).click()
    await adminPage.getByRole('alertdialog').getByLabel('Group Name').click()
    await adminPage.getByRole('alertdialog').getByLabel('Group Name').fill(NEW_GROUP.name)
    await adminPage.getByRole('button', { name: 'Save' }).click()
    await expect(adminPage.getByText(`${NEW_GROUP.name}-edited`)).toHaveCount(0)
    await expect(adminPage.locator('.panel .body dd', { hasText: NEW_GROUP.name })).toHaveCount(1)
  })

  test('should be able to add a member to a group', async ({ adminPage }) => {
    await adminPage.getByRole('treeitem').getByText(NEW_GROUP.name, { exact: true }).dblclick()
    await expect(adminPage.getByText('This group has no directly assigned members.')).toHaveCount(1)
    await adminPage.getByRole('button', { name: `Add members to ${NEW_GROUP.name}` }).click()
    await expect(adminPage.getByRole('alertdialog')).toBeVisible()
    await adminPage.getByRole('alertdialog').getByLabel('Add Members').click()
    await expect(adminPage.getByText('Forrest Gump (ed02)')).toHaveCount(1)
    await adminPage.getByText('Forrest Gump (ed02)').click()
    await adminPage.getByRole('button', { name: 'Save' }).click()
    await expect(adminPage.getByText('This group has no directly assigned members.')).toHaveCount(0)
    await expect(adminPage.getByRole('link', { name: 'Forrest Gump (ed02)' })).toHaveCount(1)
  })
  test('should be able to remove a member from a group', async ({ adminPage }) => {
    await adminPage.getByRole('treeitem').getByText(NEW_GROUP.name, { exact: true }).dblclick()
    await adminPage.locator('tr', { has: adminPage.locator('text="Forrest Gump (ed02)"') }).getByRole('button', { name: 'Delete' }).click()
    await expect(adminPage.getByRole('alertdialog')).toBeVisible()
    await adminPage.getByRole('button', { name: 'Remove' }).click()
    await expect(adminPage.getByRole('alertdialog')).toBeHidden()
    await expect(adminPage.getByText('This group has no directly assigned members.')).toHaveCount(1)
  })
  test('should be able to add a role to a group', async ({ adminPage }) => {
    await adminPage.getByRole('treeitem').getByText(NEW_GROUP.name, { exact: true }).dblclick()
    await expect(adminPage.getByText('This group has no assigned roles.')).toHaveCount(1)
    await adminPage.getByRole('button', { name: `Add role to ${NEW_GROUP.name}` }).click()
    await expect(adminPage.getByRole('alertdialog')).toBeVisible()
    await adminPage.locator('select[name="role"]').selectOption('editor')
    await adminPage.getByRole('button', { name: 'Save' }).click()
    await expect(adminPage.getByText('This group has no assigned roles.')).toHaveCount(0)
    await expect(adminPage.getByRole('link', { name: 'editor' })).toHaveCount(1)
  })
  test('should be able to remove a role from a group', async ({ adminPage }) => {
    await adminPage.getByRole('treeitem').getByText(NEW_GROUP.name, { exact: true }).dblclick()
    await adminPage.locator('tr', { has: adminPage.locator('text="editor"') }).getByRole('button', { name: 'Delete' }).click()
    await expect(adminPage.getByRole('alertdialog')).toBeVisible()
    await adminPage.getByRole('button', { name: 'Remove' }).click()
    await expect(adminPage.getByRole('alertdialog')).toBeHidden()
    await expect(adminPage.getByText('This group has no assigned roles.')).toHaveCount(1)
  })
})
