import type { Page } from "@playwright/test"

export async function loadAdminPages(page: Page){
  await page.goto('/.admin/pages')
}

export async function loadAdminSites(page: Page) {
  await page.goto('/.admin/sites')
}

export async function expandSite(page: Page, siteName: string){
  await page.getByRole('tree').getByText(siteName).click()
}

export function locateEditFrame(page: Page) {
  return page.frameLocator('iframe[title="page preview for editing"]')
}

export async function addSite(page: Page, name: string, title: string, templateKey: string){
  await page.getByRole('button', { name: 'Add Site' }).click()
  await page.getByLabel('Name').click()
  await page.getByLabel('Name').fill(name)
  await page.getByLabel('Root Page Template *').selectOption(templateKey)
  await page.getByRole('button', { name: 'Save' }).click()
  await page.getByRole('textbox', { name: 'Title' }).click()
  await page.getByRole('textbox', { name: 'Title' }).fill(title)
  await page.getByRole('button', { name: 'Save' }).click()
}