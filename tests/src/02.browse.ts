// import { expect, test } from '@playwright/test'
import { test, expect } from '../fixtures'

test.skip('browse', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('treeitem', { name: 'calico-feature Calico Feature unpublished Jul 5 2023 3:21pm system up down to navigate , right arrow to show children' }).locator('svg').nth(1).click()
  await page.getByText('about', { exact: true }).click()
  await page.getByRole('button', { name: 'Edit undefined' }).click()
  await page.frameLocator('iframe[title="page preview for editing"]').getByRole('link', { name: 'Calico Feature' }).first().click()
  await page.frameLocator('iframe[title="page preview for editing"]').getByRole('link', { name: 'Calico Feature' }).first().click()
})
