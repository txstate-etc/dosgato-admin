import { test, expect } from '../fixtures'

test('edit', async ({ adminPage }) => {
  const page = adminPage.page
  await page.goto('/.admin/pages')
  await page.waitForURL(/pages/)
  console.log(await page.context().cookies(), 'COOKIES')
  await page.getByRole('treeitem').nth(0).locator('svg').nth(1).click()
  // await page.locator('#h1b3 > .checkbox').click()
  await page.getByRole('button', { name: 'Edit' }).click()
  await page.frameLocator('iframe[title="page preview for editing"]').getByRole('button', { name: 'Add main Content' }).click()
  await page.getByRole('button', { name: 'Column Layout' }).click()
  await page.getByLabel('Title *').click()
  await page.getByLabel('Title *').fill('columntitle')
  await page.getByRole('button', { name: 'Save' }).click()
  await page.frameLocator('iframe[title="page preview for editing"]').getByRole('button', { name: 'Add Column Layout Content' }).click()
  await page.getByLabel('Title').click()
  await page.getByLabel('Title').fill('paneltitle')
  await page.getByRole('button', { name: 'Save' }).click()
  await page.frameLocator('iframe[title="page preview for editing"]').getByRole('button', { name: 'Delete Panel Component' }).nth(1).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Delete', exact: true }).click()
  await page.frameLocator('iframe[title="page preview for editing"]').getByRole('button', { name: 'Delete Column Layout' }).click()
  await page.getByRole('alertdialog').getByRole('button', { name: 'Delete', exact: true }).click()
})
