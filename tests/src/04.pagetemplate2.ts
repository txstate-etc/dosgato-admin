import { locateEditFrame } from '../common'
import { test, expect } from '../fixtures'

const TEST_SITE = {
  name: 'site2',
  title: 'Site 2 Home'
}

test.beforeEach(async ({ adminPage }) => {
  await adminPage.page.goto('/.admin/pages/13')
  await locateEditFrame(adminPage.page).getByRole('button', { name: 'Add pagetemplate2 Content' }).click()
})

test.describe('pagetemplate2 contents', () => {
  test.describe('standard', () => {
    test.beforeEach(async ({ adminPage }) => {
      await adminPage.page.getByText('Standard', { exact: true }).click()
    })
    test('should be able to add a link', async ({ adminPage }) => {
      const page = adminPage.page
      await page.getByRole('button', { name: 'Link' }).click()
      await page.getByLabel('Text *').fill('Link Text')
      await page.locator('form div').filter({ hasText: 'Link * Select Link Target' }).getByRole('textbox').click()
      await page.getByRole('button', { name: 'Select Link Target' }).click()
      await page.getByText('bs-site').click()
      await page.getByRole('button', { name: 'Choose' }).click()
      await page.getByRole('button', { name: 'Save' }).click()
      await expect(locateEditFrame(page).getByRole('link', { name: 'Link Text' }).last()).toBeVisible()
      await expect(locateEditFrame(page).getByRole('link', { name: 'Link Text' }).last()).toHaveClass('dg-link')
      await expect(locateEditFrame(page).getByRole('link', { name: 'Link Text' }).last()).toHaveAttribute('href', '/.preview/latest/bs-site.html')
    })
    test('should be able to add a quote', async ({ adminPage }) => {
      const page = adminPage.page
      await page.getByRole('button', { name: 'Quote' }).click()
      await page.getByLabel('Author').fill('author2')
      await page.getByLabel('Quote').fill('Life is beautiful!')
      await page.getByRole('button', { name: 'Save' }).click()
      await expect(locateEditFrame(page).getByText('Life is beautiful!- author2').last()).toBeVisible()
    })
    test('should be able to add rich text', async ({ adminPage }) => {
      const page = adminPage.page
      await page.getByRole('button', { name: 'Rich Text' }).click()
      await page.getByLabel('Title').fill('Rich Text Title')
      await page.getByLabel('Rich Text').fill('Where is the rich text tool bars?')
      await page.getByRole('button', { name: 'Save' }).click()
      await expect(locateEditFrame(page).getByRole('heading', { name: 'Rich Text Title' }).last()).toBeVisible()
      await expect(locateEditFrame(page).getByText('Where is the rich text tool bars?').last()).toBeVisible()
    })
    test('should be able to add horizontal rule', async ({ adminPage }) => {
      const page = adminPage.page
      await page.getByRole('button', { name: 'Horizontal Rule' }).click()
      await expect(locateEditFrame(page).locator('hr').last()).toHaveClass('dg-horizonalrule')
    })
  })
  test.describe('containers', () => {

  })
})