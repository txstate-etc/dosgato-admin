import { expect, type Locator, type Page } from '@playwright/test'

/** Dialogs wrestle over focus for a few frames after they open or replace one another
 * (FocusLock restores focus one rAF after unmount), and fill() types via insertText into
 * whatever has focus when it lands — silently losing the value if focus was stolen.
 * Fill, verify the value stuck, and retry until it does. Use this for fields in a dialog
 * that just opened, especially the template chooser -> form dialog swap. */
export async function fillVerified (locator: Locator, value: string) {
  await expect(async () => {
    await locator.fill(value)
    await expect(locator).toHaveValue(value)
  }).toPass()
}

export async function loadAdminPages (page: Page) {
  await page.goto('/.admin/pages')
}

export async function loadAdminSites (page: Page) {
  await page.goto('/.admin/sites')
}

export async function loadAdminAccessPage (page: Page, tab: 'users' | 'system' | 'groups' | 'roles') {
  await page.goto(`/.admin/auth/${tab}`)
}

export async function loadAdminData (page: Page) {
  await page.goto('/.admin/data')
}

export async function expandSite (page: Page, siteName: string) {
  await page.getByRole('tree').getByText(siteName).click()
}

export function locateEditFrame (page: Page) {
  return page.frameLocator('iframe[title="page preview for editing"]')
}

export async function addSite (page: Page, name: string, title: string, templateKey: string) {
  await page.getByRole('button', { name: 'Add Site' }).click()
  await page.getByLabel('Name').click()
  await page.getByLabel('Name').fill(name)
  await page.getByLabel('Root Page Template *').selectOption(templateKey)
  await page.getByRole('button', { name: 'Save' }).click()
  await page.getByRole('textbox', { name: 'Title' }).click()
  await page.getByRole('textbox', { name: 'Title' }).fill(title)
  await page.getByRole('button', { name: 'Save' }).click()
}

export async function addUser (page: Page, system: boolean, login: string, lastname: string, email: string, firstname?: string) {
  await page.getByRole('button', { name: 'Create' }).click()
  await page.getByLabel('Login').click()
  await page.getByLabel('Login').fill(login)
  if (system) {
    await page.getByLabel('Name').click()
    await page.getByLabel('Name').fill(lastname)
  } else {
    if (firstname) {
      await page.getByLabel('First Name').click()
      await page.getByLabel('First Name').fill(firstname)
    }
    await page.getByLabel('Last Name').click()
    await page.getByLabel('Last Name').fill(lastname)
  }
  await page.getByLabel('E-mail').click()
  await page.getByLabel('E-mail').fill(email)
  await page.getByRole('button', { name: 'Save' }).click()
}

export async function addGroup (page: Page, name: string) {
  await page.getByRole('button', { name: 'Add Group' }).click()
  await page.getByLabel('Group Name').click()
  await page.getByLabel('Group Name').fill(name)
  await page.getByRole('button', { name: 'Save' }).click()
}

export async function addRole (page: Page, name: string) {
  await page.getByRole('button', { name: 'Add Role' }).click()
  await page.getByLabel('Name').click()
  await page.getByLabel('Name').fill(name)
  await page.getByRole('button', { name: 'Save' }).click()
}
