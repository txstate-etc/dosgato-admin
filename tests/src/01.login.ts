import { test, expect } from '../fixtures'

test('confirm logged in', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle('DEV DG Editing')
})
