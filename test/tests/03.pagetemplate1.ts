import { locateEditFrame } from '../common'
import { test, expect } from '../fixtures'

test.beforeEach(async ({ adminPage }) => {
  await adminPage.goto('/.admin/pages/1')
  ;(await locateEditFrame(adminPage)).getByRole('button', { name: 'Add main Content' }).click()
})

test.describe('pagetemplate1 contents', () => {
  test.describe('standard', () => {
    test.beforeEach(async ({ adminPage }) => {
      await adminPage.getByText('Standard', { exact: true }).click()
    })
    test('should be able to add a quote', async ({ adminPage }) => {
      await adminPage.getByRole('button', { name: 'Quote' }).click()
      await adminPage.getByLabel('Author').fill('author1')
      await adminPage.getByLabel('Quote').fill('Get healthy life and be happy!')
      await adminPage.getByRole('button', { name: 'Save' }).click()
      await expect(locateEditFrame(adminPage).getByText('Get healthy life and be happy!- author1').last()).toBeVisible()
    })
    test('should be able to add rich text', async ({ adminPage }) => {
      await adminPage.getByRole('button', { name: 'Rich Text' }).click()
      await adminPage.getByLabel('Title').fill('Rich Text Title')
      await adminPage.getByLabel('Rich Text').fill('Where is the rich text tool bars?')
      await adminPage.getByRole('button', { name: 'Save' }).click()
      await expect(locateEditFrame(adminPage).getByRole('heading', { name: 'Rich Text Title' }).last()).toBeVisible()
      await expect(locateEditFrame(adminPage).getByText('Where is the rich text tool bars?').last()).toBeVisible()
    })
    test('should be able to add horizontal rule', async ({ adminPage }) => {
      await adminPage.getByRole('button', { name: 'Horizontal Rule' }).click()
      await expect(locateEditFrame(adminPage).locator('hr').last()).toHaveClass('dg-horizonalrule')
    })
    test('should be able to add text & image', async ({ adminPage }) => {
      await adminPage.getByRole('button', { name: 'Text & Image' }).click()
      await adminPage.getByLabel('Title').fill('Text and Image Title')
      await adminPage.getByLabel('Rich Text').fill('Where is rich text tool bars')
      await adminPage.getByRole('button', { name: 'Select Image' }).click()
      await adminPage.getByRole('treeitem', { name: 'site1 up down to navigate , right arrow to show children' }).locator('svg').nth(1).click()
      await adminPage.getByText('bobcat').click()
      await adminPage.getByRole('button', { name: 'Choose' }).click()
      await adminPage.getByRole('button', { name: 'Select Page' }).click()
      await adminPage.getByText('bs-site').click()
      await adminPage.getByRole('button', { name: 'Choose' }).click()
      await adminPage.getByRole('button', { name: 'Save' }).click()
      await expect(locateEditFrame(adminPage).getByRole('heading', { name: 'Text and Image Title' }).last()).toBeVisible()
      await expect(locateEditFrame(adminPage).getByText('Where is rich text tool bars').last()).toBeVisible()
      await expect(locateEditFrame(adminPage).getByRole('img').last()).toBeVisible()
    })
  })
  test.describe('containers', () => {

  })
})
