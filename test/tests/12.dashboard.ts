import { test, expect } from '../fixtures'
import { Page } from '@playwright/test'

interface ButtonsShown {
  pagesTopNav: boolean
  goToPagetree: boolean
  updateSiteManagement: boolean
  requestDecom: boolean
  addUser: boolean
  auditTeam: boolean
  exportTeamCSV: boolean
  auditRoles: boolean
  exportRolesCSV: boolean
  requestSandbox: boolean
  requestDeactivatePagetree: boolean
  individualGoToPageTree: boolean
}

async function testButtonVisibility (page: Page, userButtons: ButtonsShown) {
  await expect(page.getByRole('link', { name: 'Pages' }))[userButtons.pagesTopNav ? 'toBeVisible' : 'toBeHidden']()
  await expect(page.getByRole('button', { name: 'Gato Preview' })).toBeHidden() // this test site is not live
  await expect(page.getByRole('button', { name: 'Go To Page Tree' }))[userButtons.goToPagetree ? 'toBeVisible' : 'toBeHidden']()
  await expect(page.getByRole('button', { name: 'Update Website Management' }))[userButtons.updateSiteManagement ? 'toBeVisible' : 'toBeHidden']()
  await expect(page.getByRole('button', { name: 'Request Site Decommission' }))[userButtons.requestDecom ? 'toBeVisible' : 'toBeHidden']()
  // await expect(page.getByRole('button', { name: 'Add User' }))[userButtons.addUser ? 'toBeVisible' : 'toBeHidden']()
  // await expect(page.getByRole('button', { name: 'Audit Team' }))[userButtons.auditTeam ? 'toBeVisible' : 'toBeHidden']()
  // await expect(page.getByRole('button', { name: 'Export Team CSV' }))[userButtons.exportTeamCSV ? 'toBeVisible' : 'toBeHidden']()
  // await expect(page.getByRole('button', { name: 'Export Roles CSV' }))[userButtons.exportRolesCSV ? 'toBeVisible' : 'toBeHidden']()
  // await expect(page.getByRole('button', { name: 'Request New Sandbox' }))[userButtons.requestSandbox ? 'toBeVisible' : 'toBeHidden']()
  // await expect(page.getByRole('button', { name: 'Request Page Tree Deactivation' }))[userButtons.requestDeactivatePagetree ? 'toBeVisible' : 'toBeHidden']()
  await expect(page.getByRole('table').getByRole('columnheader', { name: 'Go To Page Tree' }))[userButtons.individualGoToPageTree ? 'toBeVisible' : 'toBeHidden']()
}

test.describe('dashboard', () => {
  test('should access dashboard as an owner', async ({ ownerPage }) => {
    await ownerPage.goto('/.admin/dashboard')
    await expect(ownerPage.getByText('My Sites', { exact: true })).toBeVisible()
    await expect(ownerPage.locator('.sites .site-list-item')).toHaveCount(1)
    const dashboardCard = ownerPage.locator('.sites .site-list-item').first()
    await expect(dashboardCard.getByText('dashboard-test', { exact: true })).toBeVisible()
    await expect(dashboardCard.getByText('Owner', { exact: true })).toBeVisible()
  })
  test('should open dashboard detail page as an owner', async ({ ownerPage }) => {
    await ownerPage.goto('/.admin/dashboard')
    await expect(ownerPage.locator('a.site-card').filter({ hasText: 'dashboard-test' })).toBeVisible()
    await ownerPage.locator('a.site-card').filter({ hasText: 'dashboard-test' }).click()
    const tabItem = ownerPage.getByRole('listitem').filter({ hasText: 'dashboard-test' })
    await expect(tabItem.getByRole('link', { name: 'dashboard-test' })).toBeVisible()
  })
  test('owner should see correct buttons on dashboard detail page', async ({ ownerPage }) => {
    await ownerPage.goto('/.admin/dashboard')
    await ownerPage.locator('a.site-card').filter({ hasText: 'dashboard-test' }).click()
    const buttonVisiblity: ButtonsShown = {
      pagesTopNav: false,
      goToPagetree: false,
      updateSiteManagement: true,
      requestDecom: true,
      addUser: true,
      auditTeam: true,
      exportTeamCSV: true,
      auditRoles: true,
      exportRolesCSV: true,
      requestSandbox: true,
      requestDeactivatePagetree: true,
      individualGoToPageTree: false
    }
    await testButtonVisibility(ownerPage, buttonVisiblity)
  })
  test('should access dashboard as a manager (no edit access)', async ({ managerPage }) => {
    await managerPage.goto('/.admin/dashboard')
    await expect(managerPage.getByText('My Sites', { exact: true })).toBeVisible()
    await expect(managerPage.locator('.sites .site-list-item')).toHaveCount(1)
    const dashboardCard = managerPage.locator('.sites .site-list-item').first()
    await expect(dashboardCard.getByText('dashboard-test', { exact: true })).toBeVisible()
    await expect(dashboardCard.getByText('Manager', { exact: true })).toBeVisible()
  })
  test('manager should see correct buttons on dashboard detail page', async ({ managerPage }) => {
    await managerPage.goto('/.admin/dashboard')
    await managerPage.locator('a.site-card').filter({ hasText: 'dashboard-test' }).click()
    const buttonVisiblity: ButtonsShown = {
      pagesTopNav: false,
      goToPagetree: false,
      updateSiteManagement: true,
      requestDecom: true,
      addUser: true,
      auditTeam: true,
      exportTeamCSV: true,
      auditRoles: true,
      exportRolesCSV: true,
      requestSandbox: true,
      requestDeactivatePagetree: true,
      individualGoToPageTree: false
    }
    await testButtonVisibility(managerPage, buttonVisiblity)
  })
  test('should access dashboard as an editor', async ({ dbEditorPage }) => {
    await dbEditorPage.goto('/.admin/dashboard')
    await expect(dbEditorPage.getByText('My Sites', { exact: true })).toBeVisible()
    await expect(dbEditorPage.locator('.sites .site-list-item')).toHaveCount(1)
    const dashboardCard = dbEditorPage.locator('.sites .site-list-item').first()
    await expect(dashboardCard.getByText('dashboard-test', { exact: true })).toBeVisible()
    await expect(dashboardCard.getByText('Editor', { exact: true })).toBeVisible()
  })
  test('editor should see correct buttons on dashboard detail page', async ({ dbEditorPage }) => {
    await dbEditorPage.goto('/.admin/dashboard')
    await dbEditorPage.locator('a.site-card').filter({ hasText: 'dashboard-test' }).click()
    const buttonVisiblity: ButtonsShown = {
      pagesTopNav: true,
      goToPagetree: true,
      updateSiteManagement: true,
      requestDecom: false,
      addUser: false,
      auditTeam: false,
      exportTeamCSV: true,
      auditRoles: false,
      exportRolesCSV: false,
      requestSandbox: true,
      requestDeactivatePagetree: true,
      individualGoToPageTree: true
    }
    await testButtonVisibility(dbEditorPage, buttonVisiblity) 
  })
})
