import { locateEditFrame } from '../common'
import { test, expect } from '../fixtures'

const TEST_SITE = {
  name: 'site1',
  title: 'Basketry Home'
}

test.beforeEach(async ({ adminPage }) => {
  await adminPage.page.goto('/.admin/pages/1')
  await locateEditFrame(adminPage.page).getByRole('button', { name: 'Add main Content' }).click();
})

test.describe('pagetemplate1 contents', () => {
  test('should be able to add a quote', async ({ adminPage, isMobile }) => {
    const page = adminPage.page
    await page.getByText('Standard', { exact: true }).click();
    await page.getByRole('button', { name: 'Quote' }).click();
    await page.getByLabel('Author').fill('author1');
    await page.getByLabel('Quote').fill('Get healthy life and be happy!');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(locateEditFrame(page).getByText('Get healthy life and be happy!- author1')).toBeVisible()
  })
  test('should be able to add rich text', async ({ adminPage, isMobile }) => {
    const page = adminPage.page
    await page.getByText('Standard', { exact: true }).click();
    await page.getByRole('button', { name: 'Rich Text' }).click();
    await page.getByLabel('Title').fill('Rich Text Title');
    await page.getByLabel('Rich Text').fill('Where is the rich text tool bars?');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(locateEditFrame(page).getByRole('heading', { name: 'Rich Text Title' })).toBeVisible();
    await expect(locateEditFrame(page).getByText('Where is the rich text tool bars?')).toBeVisible();
  })
  test('should be able to add horizontal rule', async ({ adminPage, isMobile }) => {
    const page = adminPage.page
    await page.getByText('Standard', { exact: true }).click();
    await page.getByRole('button', { name: 'Horizontal Rule' }).click();
    await expect(locateEditFrame(page).locator('hr')).toHaveClass('dg-horizonalrule');
  })
  test('should be able to add text & image', async ({ adminPage, isMobile }) => {
    const page = adminPage.page
    await page.getByText('Standard', { exact: true }).click();
    await page.getByRole('button', { name: 'Text & Image' }).click();
    await page.getByLabel('Title').fill('Text and Image Title');
    await page.getByLabel('Rich Text').fill('Where is rich text tool bars');
    await page.getByRole('button', { name: 'Select Image' }).click();
    await page.getByRole('treeitem', { name: 'site1 up down to navigate , right arrow to show children' }).locator('svg').nth(1).click();
    await page.getByText('bobcat').click();
    await page.getByRole('button', { name: 'Choose' }).click();
    await page.getByRole('button', { name: 'Select Page' }).click();
    await page.getByText('bs-site').click();
    await page.getByRole('button', { name: 'Choose' }).click();
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(locateEditFrame(page).getByRole('heading', { name: 'Text and Image Title' })).toBeVisible();
    await expect(locateEditFrame(page).getByText('Where is rich text tool bars')).toBeVisible();
    await expect(locateEditFrame(page).getByRole('img')).toBeVisible();
  })
})