import type { Page } from "@playwright/test"

export async function loadPage(page: Page){
  await page.goto('/.admin/pages')
}

export async function expandSite(page: Page, siteName: string){
  await page.getByRole('tree').getByText(siteName).click()
}