import { test, expect } from '../fixtures'
import { fillVerified } from '../common'
import type { Locator, Page } from '@playwright/test'

interface ButtonsShown {
  pagesTopNav: boolean
  gatoPreview: boolean
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
  await expect(page.getByRole('button', { name: 'Gato Preview' }))[userButtons.gatoPreview ? 'toBeVisible' : 'toBeHidden']()
  await expect(page.getByRole('button', { name: 'Copy Live URL' })).toBeHidden() // hidden because this test site is not live
  await expect(page.getByRole('button', { name: 'Go To Page Tree' }))[userButtons.goToPagetree ? 'toBeVisible' : 'toBeHidden']()
  await expect(page.getByRole('button', { name: 'Update Website Management' }))[userButtons.updateSiteManagement ? 'toBeVisible' : 'toBeHidden']()
  await expect(page.getByRole('button', { name: 'Request Site Decommission' }))[userButtons.requestDecom ? 'toBeVisible' : 'toBeHidden']()
  await expect(page.getByRole('button', { name: 'Add User' }))[userButtons.addUser ? 'toBeVisible' : 'toBeHidden']()
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
      gatoPreview: false,
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
      gatoPreview: false,
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
      gatoPreview: true,
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

/* Team management dialogs */

const ED03 = { login: 'ed03', name: 'Luke Skywalker' }
const ED04 = { login: 'ed04', name: 'Katniss Everdeen' }
const CONTRIBUTOR_ROLES = ['dashboard-test-about-editor', 'dashboard-test-sandbox-contributor']

const USER_LOOKUP_TIMEOUT = 30_000

function teamPanel (page: Page) {
  return page.getByRole('region', { name: 'Team Members' })
}

/** The team table renders a hidden mobile card list alongside itself, so every team locator has
 * to go through the table or it matches twice. */
function teamTable (page: Page) {
  return teamPanel(page).getByRole('table')
}

function teamRow (page: Page, login: string) {
  return teamTable(page).getByRole('row').filter({ hasText: login })
}

/** The panel renders a 'no team members' message instead of the table until the site data is in,
 * so confirm the table is really there before asserting a row is absent - an absent table would
 * satisfy a count of zero on its own. */
async function waitForTeamTable (page: Page) {
  await expect(teamTable(page)).toBeVisible()
}

/** The confirmation dialog is rendered by the layout on top of the still-mounted form dialog,
 * so there are two alertdialogs on screen and neither one has an accessible name. */
function confirmation (page: Page) {
  return page.getByRole('alertdialog').filter({ hasText: 'Confirmation' })
}

/** The 'User Details' block the add and edit dialogs show for the user they looked up. Asserting
 * against the whole block instead of getByText keeps the nested dt/dd pairs out of strict mode. */
function foundUser (dialog: Locator) {
  return dialog.locator('section.found-user')
}

/** Fill in a login and wait for the API to look it up and fill in the user details block */
async function lookUpUser (dialog: Locator, login: string) {
  const field = dialog.getByLabel('Search User IDs')
  await fillVerified(field, login)
  await field.blur()
  await expect(foundUser(dialog)).toBeVisible({ timeout: USER_LOOKUP_TIMEOUT })
}

async function openDashboardSiteDetail (page: Page) {
  await page.goto('/.admin/dashboard')
  await page.locator('a.site-card').filter({ hasText: 'dashboard-test' }).click()
  await waitForTeamTable(page)
}

async function openAddUserDialog (page: Page) {
  await openDashboardSiteDetail(page)
  await page.getByRole('button', { name: 'Add User' }).click()
  const dialog = page.getByRole('alertdialog')
  await expect(dialog.getByLabel('Search User IDs')).toBeVisible()
  return dialog
}

async function openEditUserDialog (page: Page, login: string) {
  await openDashboardSiteDetail(page)
  await teamRow(page, login).getByRole('button', { name: 'Edit' }).click()
  const dialog = page.getByRole('alertdialog')
  await expect(dialog.getByRole('radiogroup', { name: 'Access Level' })).toBeVisible()
  return dialog
}

test.describe('dashboard add user', () => {
  test('add user dialog should open with the site filled in and read-only preselected', async ({ ownerPage }) => {
    const dialog = await openAddUserDialog(ownerPage)
    await expect(dialog.getByLabel('Site')).toHaveValue('dashboard-test')
    await expect(dialog.getByLabel('Site')).toHaveAttribute('readonly', '')
    await expect(dialog.getByRole('radio', { name: 'Read-only' })).toBeChecked()
    // the role table only applies to contributor access, so it starts out hidden
    await expect(dialog.getByRole('radiogroup', { name: 'Assign Access Level' })).toBeVisible()
    await expect(dialog.getByText('Available Roles')).toBeHidden()
  })
  test('add user dialog should look the login up and reveal the role table for contributor access', async ({ ownerPage }) => {
    const dialog = await openAddUserDialog(ownerPage)
    await lookUpUser(dialog, ED03.login)
    await expect(foundUser(dialog)).toContainText(ED03.name)
    await expect(foundUser(dialog)).toContainText(ED03.login)
    await expect(foundUser(dialog)).toContainText('Trained')
    await dialog.getByRole('radio', { name: 'Contributor' }).check()
    await expect(dialog.getByText('Available Roles')).toBeVisible()
    // only the site's contributor roles are assignable here
    for (const role of CONTRIBUTOR_ROLES) {
      await expect(dialog.getByRole('checkbox', { name: `Assign ${role}` })).toBeVisible()
    }
  })
  test('owner should be able to add a user as an editor', async ({ ownerPage }) => {
    const dialog = await openAddUserDialog(ownerPage)
    await lookUpUser(dialog, ED03.login)
    await expect(foundUser(dialog)).toContainText(ED03.name)
    await dialog.getByRole('radio', { name: 'Editor' }).check()
    await dialog.getByRole('button', { name: 'Save' }).click()
    await expect(confirmation(ownerPage)).toContainText(`Add ${ED03.name} to dashboard-test team with Editor access?`)
    await confirmation(ownerPage).getByRole('button', { name: 'Confirm and Add' }).click()
    await expect(ownerPage.getByText(`${ED03.name} has been added.`)).toBeVisible()
    await expect(teamRow(ownerPage, ED03.login)).toContainText('Editor')
  })
  test('manager should be able to add an untrained user with read-only access', async ({ managerPage }) => {
    const dialog = await openAddUserDialog(managerPage)
    await lookUpUser(dialog, ED04.login)
    await expect(foundUser(dialog)).toContainText(ED04.name)
    await expect(foundUser(dialog)).toContainText('Incomplete')
    await expect(dialog.getByRole('radio', { name: 'Read-only' })).toBeChecked()
    await dialog.getByRole('button', { name: 'Save' }).click()
    await confirmation(managerPage).getByRole('button', { name: 'Confirm and Add' }).click()
    await expect(managerPage.getByText(`${ED04.name} has been added.`)).toBeVisible()
    await expect(teamRow(managerPage, ED04.login)).toContainText('Read-only')
  })
})

test.describe('dashboard team member details', () => {
  test('should show a team member in the view dialog', async ({ ownerPage }) => {
    await openDashboardSiteDetail(ownerPage)
    await teamRow(ownerPage, ED04.login).getByRole('button', { name: 'Details' }).click()
    const dialog = ownerPage.getByRole('alertdialog')
    await expect(dialog.getByRole('heading', { name: 'Assigned Role(s)' })).toBeVisible()
    await expect(dialog).toContainText('dashboard-test')
    await expect(dialog).toContainText(ED04.name)
    await expect(dialog).toContainText(ED04.login)
    // ed04 has never logged in, and read-only access comes from exactly one seeded role
    await expect(dialog).toContainText('Never')
    await expect(dialog).toContainText('Read-only')
    await expect(dialog).toContainText('dashboard-test-readonly')
    await dialog.getByRole('button', { name: 'Dismiss' }).click()
    await expect(ownerPage.getByRole('alertdialog')).toHaveCount(0)
  })
  test('editor should not see the edit action but should still see details', async ({ dbEditorPage }) => {
    await openDashboardSiteDetail(dbEditorPage)
    await expect(teamPanel(dbEditorPage).getByRole('columnheader', { name: 'Edit' })).toBeHidden()
    await expect(teamPanel(dbEditorPage).getByRole('columnheader', { name: 'Details' })).toBeVisible()
  })
})

test.describe('dashboard edit user access', () => {
  test('edit user dialog should preload the team member\'s current access', async ({ ownerPage }) => {
    const dialog = await openEditUserDialog(ownerPage, 'db_editor1')
    await expect(dialog).toContainText('Edit User: Daisy Buchanan')
    await expect(dialog.getByLabel('Site')).toHaveValue('dashboard-test')
    await expect(dialog.getByRole('radio', { name: 'Editor' })).toBeChecked()
    // 'No Access' is only offered to a team member who holds no access level at all
    await expect(dialog.getByRole('radio', { name: 'No Access' })).toBeHidden()
    await expect(dialog.getByRole('button', { name: 'Remove User from Site' })).toBeVisible()
  })
  test('edit user dialog should offer no access for a manager who holds no roles', async ({ ownerPage }) => {
    const dialog = await openEditUserDialog(ownerPage, 'db_manager2')
    await expect(dialog).toContainText('Edit User: Frodo Baggins')
    await expect(dialog.getByRole('radio', { name: 'No Access' })).toBeChecked()
  })
  test('owner should be able to change a team member\'s access level', async ({ ownerPage }) => {
    const dialog = await openEditUserDialog(ownerPage, ED03.login)
    await expect(dialog.getByRole('radio', { name: 'Editor' })).toBeChecked()
    await dialog.getByRole('radio', { name: 'Contributor' }).check()
    await dialog.getByRole('checkbox', { name: `Assign ${CONTRIBUTOR_ROLES[0]}` }).check()
    await dialog.getByRole('button', { name: 'Save' }).click()
    await expect(confirmation(ownerPage)).toContainText(`Update ${ED03.name} access to Contributor?`)
    await confirmation(ownerPage).getByRole('button', { name: 'Confirm and Save' }).click()
    await expect(teamRow(ownerPage, ED03.login)).toContainText('Contributor')
    await expect(teamRow(ownerPage, ED03.login)).not.toContainText('Editor')
  })
})

test.describe('dashboard remove user', () => {
  test('manager should be able to remove a team member', async ({ managerPage }) => {
    const dialog = await openEditUserDialog(managerPage, ED04.login)
    await dialog.getByRole('button', { name: 'Remove User from Site' }).click()
    await expect(confirmation(managerPage)).toContainText(`Remove ${ED04.name} from the dashboard-test team?`)
    await expect(confirmation(managerPage)).toContainText('This action does not remove the user from the CMS.')
    // backing out of the confirmation leaves the team alone and keeps the edit dialog open
    await confirmation(managerPage).getByRole('button', { name: 'Cancel' }).click()
    await expect(confirmation(managerPage)).toHaveCount(0)
    await expect(teamRow(managerPage, ED04.login)).toBeVisible()
    await dialog.getByRole('button', { name: 'Remove User from Site' }).click()
    await confirmation(managerPage).getByRole('button', { name: 'Remove' }).click()
    await expect(managerPage.getByText(`${ED04.name} has been removed from the dashboard-test team.`)).toBeVisible()
    // confirm the reloaded table is back before asserting the row is gone, or an absent table
    // would satisfy the count on its own
    await waitForTeamTable(managerPage)
    await expect(teamRow(managerPage, ED04.login)).toHaveCount(0)
  })
  test('owner should be able to add themselves to their own team', async ({ ownerPage }) => {
    const dialog = await openAddUserDialog(ownerPage)
    await lookUpUser(dialog, 'db_owner')
    await expect(foundUser(dialog)).toContainText('Indiana Jones')
    await dialog.getByRole('button', { name: 'Save' }).click()
    await confirmation(ownerPage).getByRole('button', { name: 'Confirm and Add' }).click()
    await expect(ownerPage.getByText('Indiana Jones has been added.')).toBeVisible()
    await expect(teamRow(ownerPage, 'db_owner')).toContainText('Read-only')
  })
  test('owner removing their own access should keep their ownership of the site', async ({ ownerPage }) => {
    const dialog = await openEditUserDialog(ownerPage, 'db_owner')
    await dialog.getByRole('button', { name: 'Remove User from Site' }).click()
    await expect(confirmation(ownerPage)).toContainText('Remove yourself from the dashboard-test team?')
    await expect(confirmation(ownerPage)).toContainText('remains the owner of dashboard-test')
    // an owner keeps their ownership, so they are not losing all access to the site
    await expect(confirmation(ownerPage)).not.toContainText('You will no longer have any access to this site.')
    await confirmation(ownerPage).getByRole('button', { name: 'Remove' }).click()
    await expect(ownerPage.getByText('Your access level has been updated.')).toBeVisible()
    await waitForTeamTable(ownerPage)
    await expect(teamRow(ownerPage, 'db_owner')).toHaveCount(0)
    await expect(ownerPage.locator('.site-stats')).toContainText('Indiana Jones')
  })
  // this one has to go last - it takes db_manager2's authority over the site away
  test('manager removing themselves should send them back to the dashboard', async ({ manager2Page }) => {
    const dialog = await openEditUserDialog(manager2Page, 'db_manager2')
    await dialog.getByRole('button', { name: 'Remove User from Site' }).click()
    await expect(confirmation(manager2Page)).toContainText('Remove yourself from the dashboard-test team?')
    await expect(confirmation(manager2Page)).toContainText('You will no longer have any access to this site.')
    await confirmation(manager2Page).getByRole('button', { name: 'Remove' }).click()
    await manager2Page.waitForURL(/\/\.admin\/dashboard$/)
    await expect(manager2Page.getByText('My Sites', { exact: true })).toBeVisible()
    await expect(manager2Page.locator('a.site-card').filter({ hasText: 'dashboard-test' })).toHaveCount(0)
  })
})
