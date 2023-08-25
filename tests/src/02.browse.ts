// import { expect, test } from '@playwright/test'
import { test, expect } from '../fixtures'

test('browse', async ({ page }) => {
  await page.goto('/')
  // await page.getByRole('treeitem', { name: 'site1 Basketry Home pagetemplate1 unpublished Aug 24 2023 10:19am su01 up down to navigate , right arrow to show children' }).locator('svg').first().click()
  await page.getByText('Basketry Home', { exact: true }).click()
  await page.getByText('about', { exact: true }).click()
  await expect(page.getByRole('tree').getByText('people', { exact: true })).toBeVisible()
})
