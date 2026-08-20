import { locateEditFrame } from '../common'
import { test, expect } from '../fixtures'

test.beforeEach(async ({ adminPage }) => {
  await adminPage.goto('/.admin/pages')
  await adminPage.getByRole('treeitem', { name: /\bsite6\b/ }).click()
  await adminPage.getByRole('button', { name: 'Edit' }).click()
  await locateEditFrame(adminPage).getByRole('button', { name: 'Add pagetemplate2 Content' }).click()
  await adminPage.getByText('Standard', { exact: true }).click()
  await adminPage.getByRole('button', { name: 'Link', exact: true }).click()
  await adminPage.getByLabel('Text').fill('data chooser test link')
  await adminPage.getByRole('button', { name: 'Select Link Target' }).click()
  await adminPage.getByRole('treeitem', { name: /\bsite6\b/ }).click()
  await adminPage.getByRole('button', { name: 'Choose' }).click()
})

test.describe('data chooser', () => {
  test('should be able to pick a global data entry and resolve it again on re-edit', async ({ adminPage }) => {
    // the Building field is the first of the two data chooser fields in the dialog
    await adminPage.getByRole('button', { name: 'Select Data' }).first().click()
    // buildings only exist as global data, so there is a single source and no tabs
    await adminPage.getByRole('treeitem', { name: 'cottonwood-hall' }).click()
    await expect(adminPage.getByRole('tab', { name: 'Global Data' })).toHaveCount(0)
    await adminPage.getByRole('button', { name: 'Choose' }).click()
    // the chosen entry shows in the field with Replace/Remove actions
    await expect(adminPage.getByText('cottonwood-hall', { exact: true })).toBeVisible()
    await expect(adminPage.getByRole('button', { name: 'Replace' })).toBeVisible()
    await adminPage.getByRole('button', { name: 'Save' }).click()
    await expect(locateEditFrame(adminPage).getByText('data chooser test link').last()).toBeVisible()
    // re-open the component: the saved DataLink should resolve back to the chosen entry
    await locateEditFrame(adminPage).getByRole('button', { name: 'Edit Link' }).first().click()
    await expect(adminPage.getByText('cottonwood-hall', { exact: true })).toBeVisible()
    await expect(adminPage.getByRole('button', { name: 'Remove' })).toBeVisible()
    await adminPage.getByRole('button', { name: 'Cancel' }).click()
  })

  test('should preview a data entry\'s payload while choosing', async ({ adminPage }) => {
    await adminPage.getByRole('button', { name: 'Select Data' }).first().click()
    // selecting an item fetches its payload and renders it in the preview pane
    await adminPage.getByRole('treeitem', { name: 'cottonwood-hall' }).click()
    await expect(adminPage.getByText('Cottonwood Hall', { exact: true })).toBeVisible()
    await expect(adminPage.getByText('floors:', { exact: true })).toBeVisible()
    await expect(adminPage.getByText('3', { exact: true })).toBeVisible()
    // internal bookkeeping fields are redacted from the preview
    await expect(adminPage.getByText('templateKey:', { exact: true })).toHaveCount(0)
    await expect(adminPage.getByText('savedAtVersion:', { exact: true })).toHaveCount(0)
    // the chooser dialog sits on top of the component dialog, so two Cancel buttons are open
    await adminPage.getByRole('button', { name: 'Cancel' }).last().click()
    await adminPage.getByRole('button', { name: 'Cancel' }).click()
  })

  test('should be able to browse sources and folders and pick from a folder', async ({ adminPage }) => {
    // the Color field is the second data chooser field in the dialog
    await adminPage.getByRole('button', { name: 'Select Data' }).nth(1).click()
    // color data exists globally and in sites, so both source tabs appear
    await expect(adminPage.getByRole('tab', { name: 'Global Data' })).toBeVisible()
    await expect(adminPage.getByRole('tab', { name: 'Sites' })).toBeVisible()
    // sites appear as containers under the sites source and expand to their folders
    await adminPage.getByRole('tab', { name: 'Sites' }).click()
    await adminPage.getByRole('treeitem', { name: /\bsite2\b/ }).click()
    await adminPage.getByRole('treeitem', { name: 'site2datafolder' }).click()
    await expect(adminPage.getByRole('treeitem', { name: 'red-content' })).toBeVisible()
    // pick an entry inside a global data folder
    await adminPage.getByRole('tab', { name: 'Global Data' }).click()
    await adminPage.getByRole('treeitem', { name: 'globalcolordata' }).click()
    await adminPage.getByRole('treeitem', { name: 'sandstone-content' }).click()
    await adminPage.getByRole('button', { name: 'Choose' }).click()
    await expect(adminPage.getByText('sandstone-content', { exact: true })).toBeVisible()
    await expect(adminPage.getByRole('button', { name: 'Replace' })).toBeVisible()
    await adminPage.getByRole('button', { name: 'Cancel' }).click()
  })
})
