import type { Page } from "@playwright/test"

export async function loadAdminPages(page: Page){
  await page.goto('/.admin/pages')
}

export async function expandSite(page: Page, siteName: string){
  await page.getByRole('tree').getByText(siteName).click()
}

export function locateEditFrame(page: Page) {
  return page.frameLocator('iframe[title="page preview for editing"]')
}