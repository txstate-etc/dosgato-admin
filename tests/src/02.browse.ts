import { test, expect } from '../fixtures'

test('browse', async ({ adminPage }) => {
  const page = adminPage.page
  await page.goto('/.admin/pages')
  await page.getByText('Basketry Home', { exact: true }).click()
  await page.getByText('about', { exact: true }).click()
  await expect(page.getByRole('tree').getByText('people', { exact: true })).toBeVisible()
})
