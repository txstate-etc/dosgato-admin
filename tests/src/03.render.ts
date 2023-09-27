import { test, expect } from '../fixtures'

test('redner', async ({ adminPage }) => {
  const page = adminPage.page
  await page.goto('/')
  console.log(await page.context().cookies(), 'COOKIES in render')
  await page.goto(`/.edit/bs-site`)
  await expect(page.getByRole('button', { name: 'Add Main Content' })).toBeVisible()
})
