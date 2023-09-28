import { test, expect } from '../fixtures'

test('render', async ({ adminPage }) => {
  const page = adminPage.page
  await page.goto('/.edit/bs-site')
  await expect(page.getByRole('button', { name: 'Add Main Content' })).toBeVisible()
})
