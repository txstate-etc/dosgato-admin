import { test, expect } from '../fixtures'

test('another', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('treeitem', { name: 'wittliff Wittliff Home Wittliff Home unpublished Jul 3 2023 11:30am system up down to navigate , right arrow to show children' }).locator('svg').nth(1).click()
  await page.getByRole('button', { name: 'Edit undefined' }).click()
})
