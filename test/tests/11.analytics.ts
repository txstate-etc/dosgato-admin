import type { Page } from '@playwright/test'
import { expandSite, loadAdminAccessPage, loadAdminPages, locateEditFrame } from '../common'
import { test, expect } from '../fixtures'

interface UserEvent {
  eventType: string
  action: string
  screen: string
  target?: string
  additionalProperties?: Record<string, string | undefined>
}

const API_BASE = process.env.API_BASE ?? 'http://proxy/.api'

/** page.request shares cookies with the browser but the admin app keeps its JWT in
 * sessionStorage, so we read it out of the page and send it as a Bearer header —
 * the API requires authentication on every route, including GET /userEvents. */
async function getUserEvents (page: Page): Promise<UserEvent[]> {
  const token = await page.evaluate(() => sessionStorage.getItem('token'))
  const resp = await page.request.get(`${API_BASE}/userEvents`, { headers: { Authorization: `Bearer ${token}` } })
  expect(resp.status(), 'expected an authenticated 200 from GET /userEvents').toBe(200)
  return await resp.json()
}

/** The analytics plugin queues events server-side and only flushes every 5 seconds,
 * so we poll until the event we're looking for shows up. */
async function findUserEvent (page: Page, description: string, predicate: (e: UserEvent) => boolean): Promise<UserEvent> {
  let found: UserEvent | undefined
  await expect(async () => {
    const events = await getUserEvents(page)
    found = events.find(predicate)
    expect(found, description).toBeDefined()
  }).toPass({ timeout: 15000 })
  return found!
}

test.describe('analytics', () => {
  test.beforeEach(async () => {
    test.setTimeout(60000)
  })

  test('navigating to pages screen logs a navigation event', async ({ adminPage }) => {
    await loadAdminPages(adminPage)
    const navToPages = await findUserEvent(adminPage, 'expected a navigation event targeting /pages', e => e.eventType === 'navigation' && (e.target?.includes('/pages') ?? false))
    expect(navToPages.action).toBeTruthy()
    expect(navToPages.screen).toBeTruthy()
  })

  test('clicking Edit on a page logs an ActionPanel event and navigation', async ({ adminPage }) => {
    await loadAdminPages(adminPage)
    await expandSite(adminPage, 'site1')
    await adminPage.getByRole('group').getByText('about', { exact: true }).click()
    await adminPage.getByRole('button', { name: 'Edit' }).click()
    await adminPage.waitForURL(/\/pages\//)

    const actionPanelEvent = await findUserEvent(adminPage, 'expected an ActionPanel Edit event on /pages', e => e.eventType === 'ActionPanel' && e.action === 'Edit' && e.screen === '/pages')
    expect(actionPanelEvent.target).toBeTruthy()

    await findUserEvent(adminPage, 'expected a navigation event to a page editor URL', e => e.eventType === 'navigation' && (e.target?.includes('/pages/') ?? false))
  })

  test('all logged events have required UserEvent fields', async ({ adminPage }) => {
    await loadAdminPages(adminPage)
    await expandSite(adminPage, 'site1')

    let events: UserEvent[] = []
    await expect(async () => {
      events = await getUserEvents(adminPage)
      expect(events.length).toBeGreaterThan(0)
    }).toPass({ timeout: 15000 })
    for (const event of events) {
      expect(event.eventType, `event missing eventType: ${JSON.stringify(event)}`).toBeTruthy()
      expect(event.action, `event missing action: ${JSON.stringify(event)}`).toBeTruthy()
      expect(event.screen, `event missing screen: ${JSON.stringify(event)}`).toBeTruthy()
    }
  })

  test('disabling and re-enabling a user logs Open and Success on the modal', async ({ adminPage, browserName }) => {
    await loadAdminAccessPage(adminPage, 'users')
    const login = `autotest1-${browserName}`
    await adminPage.getByRole('treeitem').getByText(login).click()

    // Disable the user
    await adminPage.getByRole('button', { name: 'Disable' }).click()
    await adminPage.getByRole('alertdialog').getByRole('button', { name: 'Disable User' }).click()
    await expect(adminPage.getByRole('button', { name: 'Enable' })).toBeVisible()

    // Re-enable the user
    await adminPage.getByRole('button', { name: 'Enable' }).click()
    await adminPage.getByRole('alertdialog').getByRole('button', { name: 'Enable User' }).click()
    await expect(adminPage.getByRole('button', { name: 'Disable' })).toBeVisible()

    const disableOpen = await findUserEvent(adminPage, 'expected an Open event for the disable modal', e => e.eventType === 'UserListPage-modal-disable' && e.action === 'Open')
    expect(disableOpen.screen).toBe('/auth/users')

    await findUserEvent(adminPage, 'expected a Success event for the disable modal', e => e.eventType === 'UserListPage-modal-disable' && e.action === 'Success' && e.target === login)
    await findUserEvent(adminPage, 'expected an Open event for the enable modal', e => e.eventType === 'UserListPage-modal-enable' && e.action === 'Open')
    await findUserEvent(adminPage, 'expected a Success event for the enable modal', e => e.eventType === 'UserListPage-modal-enable' && e.action === 'Success' && e.target === login)
  })

  test('adding a component to a page logs Add Component and addComponent Success', async ({ adminPage }) => {
    await adminPage.goto('/.admin/pages')
    await adminPage.getByRole('treeitem', { name: /\bsite1\b/ }).click()
    await adminPage.getByRole('button', { name: 'Edit' }).click()
    const editFrame = locateEditFrame(adminPage)

    // Add a component
    await editFrame.getByRole('button', { name: 'Add main Content' }).click()
    await adminPage.getByRole('button', { name: 'Column Layout' }).click()
    await adminPage.getByLabel('Title *').fill('analytics-test')
    await adminPage.getByRole('button', { name: 'Save' }).click()

    const addShown = await findUserEvent(adminPage, 'expected an Add Component event from PageEditor', e => e.eventType === 'PageEditor' && e.action === 'Add Component')
    expect(addShown.screen).toContain('/pages/')
    expect(addShown.target).toBeTruthy()

    const addSuccess = await findUserEvent(adminPage, 'expected a Success event for addComponent modal', e => e.eventType === 'PageEditor-modal-addComponent' && e.action === 'Success')
    expect(addSuccess.target).toBeTruthy()
    expect(addSuccess.additionalProperties?.templateKey).toBeTruthy()

    // Clean up
    await editFrame.getByRole('button', { name: /Delete Column Layout/ }).first().click()
    await adminPage.getByRole('alertdialog').getByRole('button', { name: 'Delete', exact: true }).click()
  })
})
