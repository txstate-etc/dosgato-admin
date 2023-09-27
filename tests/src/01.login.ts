import { test, expect } from '../fixtures'

test('confirm logged in', async ({ adminPage, editorPage }) => {
  await adminPage.page.goto('/.admin/pages')
  await expect(adminPage.page).toHaveTitle('DEV DG Editing')
  await expect(adminPage.greeting).toHaveText('System User')
  await editorPage.page.goto('/.admin/pages')
  await expect(editorPage.page).toHaveTitle('DEV DG Editing')
  await expect(editorPage.greeting).toHaveText('Michael Scott')
})
