import { locateEditFrame } from '../common'
import { test, expect } from '../fixtures'

test.beforeEach(async ({ adminPage }) => {
  await adminPage.goto('/.admin/pages/13')
  ;(await locateEditFrame(adminPage)).getByRole('button', { name: 'Add pagetemplate2 Content' }).click()
})

test.describe('pagetemplate2 contents', () => {
  test.describe('standard', () => {
    test.beforeEach(async ({ adminPage }) => {
      await adminPage.getByText('Standard', { exact: true }).click()
    })
    test('should be able to add a link', async ({ adminPage }) => {
      await adminPage.getByRole('button', { name: 'Link' }).click()
      await adminPage.getByLabel('Text *').fill('Link Text')
      await adminPage.locator('form div').filter({ hasText: 'Link * Select Link Target' }).getByRole('textbox').click()
      await adminPage.getByRole('button', { name: 'Select Link Target' }).click()
      await adminPage.getByText('bs-site').click()
      await adminPage.getByRole('button', { name: 'Choose' }).click()
      await adminPage.getByRole('button', { name: 'Save' }).click()
      await expect(locateEditFrame(adminPage).getByRole('link', { name: 'Link Text' }).last()).toBeVisible()
      await expect(locateEditFrame(adminPage).getByRole('link', { name: 'Link Text' }).last()).toHaveClass('dg-link')
      await expect(locateEditFrame(adminPage).getByRole('link', { name: 'Link Text' }).last()).toHaveAttribute('href', '/.preview/latest/bs-site.html')
    })
    test('should be able to add a quote', async ({ adminPage }) => {
      await adminPage.getByRole('button', { name: 'Quote' }).click()
      await adminPage.getByLabel('Author').fill('author2')
      await adminPage.getByLabel('Quote').fill('Life is beautiful!')
      await adminPage.getByRole('button', { name: 'Save' }).click()
      await expect(locateEditFrame(adminPage).getByText('Life is beautiful!- author2').last()).toBeVisible()
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
  })
  test.describe('containers', () => {

  })
})
