import { test, expect } from '../fixtures'

test('browse', async ({ page }) => {
  await page.goto('/')
  await page.getByText('Basketry Home', { exact: true }).click()
  await page.getByText('about', { exact: true }).click()
  await expect(page.getByRole('tree').getByText('people', { exact: true })).toBeVisible()
})
