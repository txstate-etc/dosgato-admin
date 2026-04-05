import type { Page } from '@playwright/test'
import { expandSite, loadAdminAccessPage, loadAdminPages, locateEditFrame } from '../common'
import { test, expect } from '../fixtures'

interface UserEvent {
  eventType: string
  action: string
  screen: string
  target?: string
  section?: string
  additionalProperties?: Record<string, string | undefined>
}

const API_BASE = process.env.API_BASE ?? 'http://proxy/.api'

async function getUserEvents (page: Page): Promise<UserEvent[]> {
  const resp = await page.request.get(`${API_BASE}/userEvents`)
  return await resp.json()
}

test.describe('analytics', () => {
  test('navigating to pages screen logs a navigation event', async ({ adminPage }) => {
    await loadAdminPages(adminPage)
    const events = await getUserEvents(adminPage)
    const navToPages = events.find(e => e.eventType === 'navigation' && e.target?.includes('/pages'))
    expect(navToPages, 'expected a navigation event targeting /pages').toBeDefined()
    expect(navToPages!.action).toBeTruthy()
    expect(navToPages!.screen).toBeTruthy()
  })

  test('clicking Edit on a page logs an ActionPanel event and navigation', async ({ adminPage }) => {
    await loadAdminPages(adminPage)
    await expandSite(adminPage, 'site1')
    await adminPage.getByRole('group').getByText('about', { exact: true }).click()
    await adminPage.getByRole('button', { name: 'Edit' }).click()
    await adminPage.waitForURL(/\/pages\//)

    const events = await getUserEvents(adminPage)

    const actionPanelEvent = events.find(e => e.eventType === 'ActionPanel' && e.action === 'Edit' && e.screen === '/pages')
    expect(actionPanelEvent, 'expected an ActionPanel Edit event on /pages').toBeDefined()
    expect(actionPanelEvent!.target).toBeTruthy()

    const navEvent = events.find(e => e.eventType === 'navigation' && e.target?.includes('/pages/'))
    expect(navEvent, 'expected a navigation event to a page editor URL').toBeDefined()
  })

  test('all logged events have required UserEvent fields', async ({ adminPage }) => {
    await loadAdminPages(adminPage)
    await expandSite(adminPage, 'site1')

    const events = await getUserEvents(adminPage)
    expect(events.length).toBeGreaterThan(0)
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

    const events = await getUserEvents(adminPage)

    const disableOpen = events.find(e => e.eventType === 'UserListPage-modal-disable' && e.action === 'Open')
    expect(disableOpen, 'expected an Open event for the disable modal').toBeDefined()
    expect(disableOpen!.screen).toBe('/auth/users')

    const disableSuccess = events.find(e => e.eventType === 'UserListPage-modal-disable' && e.action === 'Success' && e.target === login)
    expect(disableSuccess, 'expected a Success event for the disable modal').toBeDefined()

    const enableOpen = events.find(e => e.eventType === 'UserListPage-modal-enable' && e.action === 'Open')
    expect(enableOpen, 'expected an Open event for the enable modal').toBeDefined()

    const enableSuccess = events.find(e => e.eventType === 'UserListPage-modal-enable' && e.action === 'Success' && e.target === login)
    expect(enableSuccess, 'expected a Success event for the enable modal').toBeDefined()
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

    const events = await getUserEvents(adminPage)

    const addShown = events.find(e => e.eventType === 'PageEditor' && e.action === 'Add Component')
    expect(addShown, 'expected an Add Component event from PageEditor').toBeDefined()
    expect(addShown!.screen).toContain('/pages/')
    expect(addShown!.target).toBeTruthy()

    const addSuccess = events.find(e => e.eventType === 'PageEditor-modal-addComponent' && e.action === 'Success')
    expect(addSuccess, 'expected a Success event for addComponent modal').toBeDefined()
    expect(addSuccess!.target).toBeTruthy()
    expect(addSuccess!.additionalProperties?.templateKey).toBeTruthy()

    // Clean up
    await editFrame.getByRole('button', { name: /Delete Column Layout/ }).first().click()
    await adminPage.getByRole('alertdialog').getByRole('button', { name: 'Delete', exact: true }).click()
  })
})
