import { test, expect } from '../fixtures'

test('confirm logged in', async ({ adminPage }) => {
  await adminPage.page.goto('/')
  await expect(adminPage.page).toHaveTitle('DEV DG Editing')
})
