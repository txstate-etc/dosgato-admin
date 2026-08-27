<script lang="ts">
  import { accessLevelChoices, api, confirmationStore, dateStamp, DetailPageContent, DetailPanel, DetailPanelSection, downloadPageList, ensureRequiredNotNull, environmentConfig, getSiteIcon, globalStore, highestAccessLevel, LaunchState, messageForDialog, NO_ACCESS, noAccessChoice, SortableTable, toast, titleCaseAccess, uiLog } from '$lib'
  import type { AccessLevelSelection, AddSiteTeamMemberUser, DashboardSiteDetailDisplay, DashboardSiteTeamMemberWithRole, MutationResponse, RoleAccessLevel, SiteAuditRole } from '$lib'
  import { htmlEncode, isBlank, isNull } from 'txstate-utils'
  import { Button, FieldRadio, FieldSelect, FieldText, FormDialog, Icon, InlineMessages } from '@dosgato/dialog'
  import { MessageType, type Feedback } from '@txstate-mws/svelte-forms'
  import eye from '@iconify-icons/ph/eye-bold'
  import clipboard from '@iconify-icons/ph/clipboard-fill'
  import treeStructure from '@iconify-icons/ph/tree-structure'
  import editUserIcon from '@iconify-icons/ph/user-gear-fill'
  import trashIcon from '@iconify-icons/ph/trash-simple-fill'
  import infoIcon from '@iconify-icons/ph/info-fill'
  import editOneIcon from '@iconify-icons/ph/note-pencil-bold'
  import linkOutIcon from '@iconify-icons/ph/arrow-square-out-bold'
  import plusIcon from '@iconify-icons/ph/plus-bold'
  import { resolve } from '$app/paths'
  import { goto, invalidateAll } from '$app/navigation'
  import UserDetailDialog from './UserDetailDialog.svelte'
  import DashboardPagetreeTable from './DashboardPagetreeTable.svelte'
  import { uiConfig } from '../../../local'
  import FieldRoleTable from './FieldRoleTable.svelte'

  export let data: { site: DashboardSiteDetailDisplay }
  $: site = data.site

  $: icon = getSiteIcon(site.launchState, 'PRIMARY')

  // a site with no audit roles has opted out of dashboard-managed team access
  $: canManageTeam = site.permissions.audit && site.auditRoles.length > 0

  // most sites have no contributor roles, and without one there is nothing to assign, so we don't
  // offer the access level at all rather than asking for a role selection that cannot be made
  $: contributorRoles = site.auditRoles.filter(r => r.access === 'CONTRIBUTOR')
  $: availableAccessChoices = contributorRoles.length ? accessLevelChoices : accessLevelChoices.filter(c => c.value !== 'CONTRIBUTOR')

  type Modals = 'downloadcsv' | 'userdetail' | 'adduser' | 'edituser'
  let modal: Modals | undefined

  function onCopyURL (e: MouseEvent) {
    if (!site.url?.prefix) return
    navigator.clipboard.writeText(site.url.prefix).then(() => {
      toast('Copied Live URL to clipboard.', 'success')
    }).catch(console.error)
  }

  function revealInPageTree (pageId?: string) {
    if (!pageId) return
    void goto(resolve(`/pages?selectedPage=${pageId}`))
  }

  async function onDownloadPageList (state: { pagetree?: string }) {
    if (!state.pagetree) {
      return { success: false, data: {}, messages: [] }
    }
    modal = undefined
    const pagetree = data.site.pagetrees.find(p => p.id === state.pagetree)
    await downloadPageList(state.pagetree, pagetree!.name, data.site.name)
    return { success: true, data: state, messages: [] }
  }

  function openModal (m: Modals) {
    uiLog.log({ eventType: 'DashboardDetailPage-modal-' + m, action: 'Open', target: site.name })
    modal = m
  }

  let userDetail: DashboardSiteTeamMemberWithRole | null = null
  async function viewUserDetail (userId: string) {
    userDetail = site.teamMembersWithRolesById[userId]
    openModal('userdetail')
  }

  function dismissUserDetail () {
    userDetail = null
    uiLog.log({ eventType: 'DashboardDetailPage-modal-' + modal, action: 'Cancel', target: site.name })
    modal = undefined
  }

  interface AddUserInput {
    userId: string
    access: RoleAccessLevel
    roleIds: string[]
  }

  // the mutation looks the requested login up and hands back the user it found, so the dialog
  // can show the administrator who they are about to add
  let foundUser: AddSiteTeamMemberUser | undefined

  async function onAddUser (state: AddUserInput) {
    const confirmed = await confirmationStore.confirm({
      id: 'DashboardDetailPage-modal-adduser-confirm',
      title: 'Confirmation',
      html: true,
      yesText: 'Confirm and Add',
      body: `<p>Add <strong>${htmlEncode(foundUser?.name ?? 'user')}</strong> to <strong>${htmlEncode(site.name)}</strong> team with <strong>${htmlEncode(titleCaseAccess[state.access])}</strong> access?</p>`
    })
    if (!confirmed) {
      return { success: false, messages: [] }
    }
    const resp = await api.addSiteTeamMember(site.id, state.userId, state.access, state.roleIds)
    foundUser = resp.user
    uiLog.log({ eventType: 'DashboardDetailPage-modal-adduser', action: resp.success ? 'Success' : 'Failed', target: site.name, additionalProperties: { userId: state.userId, access: state.access } })
    return { success: resp.success, messages: messageForDialog(resp.messages, ''), data: state }
  }

  async function validateAddUser (state: AddUserInput) {
    const localMessages: Feedback[] = ensureRequiredNotNull(state, ['access'])
    if (isBlank(state.userId)) localMessages.push({ type: MessageType.ERROR, message: 'This field is required.', path: 'userId' })
    if (state.access === 'CONTRIBUTOR' && !state.roleIds?.length) {
      localMessages.push({ type: MessageType.ERROR, message: 'This field is required.', path: 'roleIds' })
    }
    if (isBlank(state.userId) || isNull(state.access)) {
      foundUser = undefined
      return localMessages
    }
    const resp = await api.addSiteTeamMember(site.id, state.userId, state.access, state.roleIds, true)
    foundUser = resp.user
    return [...localMessages, ...messageForDialog(resp.messages, '').filter(m => !localMessages.some(l => l.path === m.path))]
  }

  function onCompleteAddUser () {
    toast(`${foundUser?.name ?? 'User'} has been added.`, 'success')
    modal = undefined
    foundUser = undefined
    void invalidateAll()
  }

  let userToEdit: DashboardSiteTeamMemberWithRole | null = null

  // a manager may be on the team without holding any of the site's audit roles, and we must not
  // pre-select an access level they never had - especially one the site may not even offer
  $: editingUserHasNoAccess = !!userToEdit && !highestAccessLevel(userToEdit.accessLevels)
  $: editAccessChoices = editingUserHasNoAccess ? [...availableAccessChoices, noAccessChoice] : availableAccessChoices

  function buildEditUserPreload (user: DashboardSiteTeamMemberWithRole | null) {
    const access: AccessLevelSelection = highestAccessLevel(user?.accessLevels) ?? NO_ACCESS
    return { access, roleIds: user?.roles?.filter(r => r.access === 'CONTRIBUTOR').map(r => r.id) ?? [] }
  }
  $: editUserPreload = buildEditUserPreload(userToEdit)

  function openEditUserModal (userId: string) {
    userToEdit = site.teamMembersWithRolesById[userId] ?? null
    if (userToEdit) {
      removeMessages = []
      openModal('edituser')
    }
  }

  async function validateEditTeamMemberAccess (state: { access?: AccessLevelSelection, roleIds?: string[] }) {
    const localMessages: Feedback[] = ensureRequiredNotNull(state, ['access'])
    if (state.access === 'CONTRIBUTOR' && !state.roleIds?.length) {
      localMessages.push({ type: MessageType.ERROR, message: 'This field is required.', path: 'roleIds' })
    }
    // 'no access' is what the user already has, so there is nothing for the API to validate
    if (isNull(state.access) || state.access === NO_ACCESS) return localMessages
    const resp = await api.editSiteTeamMember(site.id, userToEdit?.id ?? '', state.access, state.roleIds ?? [], true)
    return [...localMessages, ...messageForDialog(resp.messages, '').filter(m => !localMessages.some(l => l.path === m.path))]
  }

  async function onEditTeamMemberAccess (state: { access: AccessLevelSelection, roleIds?: string[] }) {
    // API has no such access level
    if (state.access === NO_ACCESS) return { success: true, messages: [], data: state }
    const confirmed = await confirmationStore.confirm({
      id: 'DashboardDetailPage-modal-edituser-confirm',
      title: 'Confirmation',
      html: true,
      yesText: 'Confirm and Save',
      body: `<p>Update <strong>${htmlEncode(userToEdit?.name ?? 'user')}</strong> access to <strong>${htmlEncode(titleCaseAccess[state.access])}</strong>?</p>`
    })
    if (!confirmed) {
      return { success: false, messages: [] }
    }
    const resp = await api.editSiteTeamMember(site.id, userToEdit?.id ?? '', state.access, state.roleIds ?? [])
    uiLog.log({ eventType: 'DashboardDetailPage-modal-edituser', action: resp.success ? 'Success' : 'Failed', target: site.name, additionalProperties: { userId: userToEdit?.id ?? '', access: state.access } })
    return { success: resp.success, messages: messageForDialog(resp.messages, ''), data: state }
  }

  // errors from the remove attempt, displayed in the edit user dialog next to the remove button
  let removeMessages: Feedback[] = []

  function buildWarning (message: string) {
    return `
      <p class="edit-team-warning">
        <!-- warning triangle icon -->
        <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="1.5em" height="1.5em" viewBox="0 0 256 256">
          <path d="M0 0h256v256H0z" fill="none" />
          <path fill="currentColor" d="M236.8 188.09L149.35 36.22a24.76 24.76 0 0 0-42.7 0L19.2 188.09a23.51 23.51 0 0 0 0 23.72A24.35 24.35 0 0 0 40.55 224h174.9a24.35 24.35 0 0 0 21.33-12.19a23.51 23.51 0 0 0 .02-23.72m-13.87 15.71a8.5 8.5 0 0 1-7.48 4.2H40.55a8.5 8.5 0 0 1-7.48-4.2a7.59 7.59 0 0 1 0-7.72l87.45-151.87a8.75 8.75 0 0 1 15 0l87.45 151.87a7.59 7.59 0 0 1-.04 7.72M120 144v-40a8 8 0 0 1 16 0v40a8 8 0 0 1-16 0m20 36a12 12 0 1 1-12-12a12 12 0 0 1 12 12" />
        </svg>
        ${message}
      </p>
    `
  }

  async function onRemoveTeamMember (userId: string) {
    if (!userId) return
    removeMessages = []
    const removingSelf = userId === $globalStore.me.id
    const userName = site.teamMembersWithRolesById[userId]?.name ?? 'this user'
    let validation: MutationResponse
    try {
      validation = await api.removeSiteTeamMember(site.id, userId, true)
    } catch (e: any) {
      console.error(e)
      return
    }
    const messages = messageForDialog(validation.messages, '')
    if (messages.some(m => m.type === 'error')) {
      removeMessages = messages
      return
    }
    const warnings = messages.filter(m => m.type === 'warning')
    let confirmationBody = removingSelf
      ? `<p>Remove <strong>yourself</strong> from the <strong>${htmlEncode(site.name)}</strong> team?</p>`
      : `<p>Remove <strong>${htmlEncode(userName)}</strong> from the <strong>${htmlEncode(site.name)}</strong> team?</p>`
    confirmationBody += '<p class="still-a-user">This action does not remove the user from the CMS.</p>'
    const losingAllAccess = removingSelf && !(site.owner?.id === $globalStore.me.id)
    if (losingAllAccess) confirmationBody += buildWarning('You will no longer have any access to this site.')
    const confirmed = await confirmationStore.confirm({
      id: 'DashboardDetailPage-modal-removeuser-confirm',
      title: 'Confirmation',
      html: true,
      yesText: 'Remove',
      body: confirmationBody + warnings.map(w => buildWarning(htmlEncode(w.message))).join('')
    })
    if (!confirmed) return
    let resp: MutationResponse
    try {
      resp = await api.removeSiteTeamMember(site.id, userId)
    } catch (e: any) {
      console.error(e)
      uiLog.log({ eventType: 'DashboardDetailPage-modal-removeuser', action: 'Failed', target: site.name, additionalProperties: { userId } })
      return
    }
    uiLog.log({ eventType: 'DashboardDetailPage-modal-removeuser', action: resp.success ? 'Success' : 'Failed', target: site.name, additionalProperties: { userId } })
    if (!resp.success) {
      // the administrator already read and accepted the warnings, so only errors go back in the dialog
      removeMessages = messageForDialog(resp.messages, '').filter(m => m.type === 'error')
      return
    }
    // the confirmation closes itself, and the edit user dialog goes away with it
    // an owner keeps their ownership, so they were downgraded rather than removed from the team
    toast(removingSelf && site.owner?.id === $globalStore.me.id
      ? 'Your access level has been updated.'
      : `${removingSelf ? 'You have' : `${userName} has`} been removed from the ${site.name} team.`, 'success')
    modal = undefined
    userToEdit = null
    if (losingAllAccess) {
      await goto(resolve('/dashboard'), { invalidateAll: true })
      return
    }
    void invalidateAll()
  }

  function onCompleteEditTeamMemberAccess () {
    modal = undefined
    userToEdit = null
    void invalidateAll()
  }

</script>

<DetailPageContent>
  <div class="site-stats">
    <div class="top" class:launched={site.launchState === LaunchState.LAUNCHED} class:prelaunch={site.launchState === LaunchState.PRELAUNCH} class:decommissioned={site.launchState === LaunchState.DECOMMISSIONED}>
      <div class="basic-info">
        <Icon {icon} width="1.75em" class="state-icon"/>
        <div class="title-block">
          <h1 class="site-title">{site.name}</h1>
          <div class="url">
            <div class="label">Assigned URL:</div>
            <div class="value">{site.url?.prefix ?? 'None'}</div>
          </div>
          <div class="site-actions">
            {#if site.rootPageId}
              <Button type="button" icon={eye} on:click={() => { window.open(resolve(`/preview?url=${encodeURIComponent(`${environmentConfig.renderBase}/.preview/latest${site.rootPagePath}.html`)}`), '_blank') }}>Gato Preview</Button>
            {/if}
            {#if site.launched}<Button type="button" icon={clipboard} on:click={onCopyURL}>Copy Live URL</Button>{/if}
            {#if site.rootPageId}
              <Button type="button" icon={treeStructure} on:click={e => { e.preventDefault(); revealInPageTree(site.rootPageId) }}>Go to Page Tree</Button>
            {/if}
          </div>
        </div>
      </div>
    </div>
    <div class="bottom">
      <div class="stats">
        <dl>
          <div>
            <dt>Site Owner:</dt>
            <dd>{site.owner?.name ?? 'None'}</dd>
          </div>
          <div class="created">
            <dt>Created:</dt>
            <dd>{site.createdAt}</dd>
          </div>
          <div class="status">
            <dt>Site Status:</dt>
            <dd>{site.launchState === LaunchState.LAUNCHED ? 'Active' : site.launchState === LaunchState.PRELAUNCH ? 'Prelaunch' : 'Inactive'}</dd>
          </div>
          <div>
            <dt>Total Pages:</dt>
            <dd>{site.totalPages}</dd>
          </div>
        </dl>
      </div>
      <div class="secondary-actions">
        {#if uiConfig?.dashboardActions?.updateWebsiteManagementUrl}<Button secondary icon={editUserIcon} on:click={() => window.open(uiConfig.dashboardActions?.updateWebsiteManagementUrl, '_blank')}>Update Website Management</Button>{/if}
        {#if site.launchState !== LaunchState.DECOMMISSIONED && site.permissions.audit && uiConfig?.dashboardActions?.requestSiteDecommissionUrl}<Button secondary icon={trashIcon} on:click={() => window.open(uiConfig.dashboardActions?.requestSiteDecommissionUrl, '_blank')}>Request Site Decommission</Button>{/if}
      </div>
    </div>
  </div>
  <!-- Audit Warning Panel -->
   <!--
   <DetailPanel header="Utilities" headerColor="#F5F1EE">
    <DetailPanelSection>
      <Button type="button" icon={exportIcon} on:click={() => openModal('downloadcsv')}>Download Page List</Button>
    </DetailPanelSection>
  </DetailPanel>
-->
  <DetailPanel header="Team Members" headerColor="#F5F1EE" collapsible>
    <DetailPanelSection>
      <div class="team-details">
        <!-- <div class="detail">
          <div class="label">Last Team Audit:</div>
          <div class="value">TBD</div>
        </div> -->
        <div class="detail">
          <div class="label">Total Team Members:</div>
          <div class="value">{site.team.length}</div>
        </div>
      </div>
      {#if uiConfig?.dashboardActions?.defineAccessLevelUrl}
        <a class="dashboard-link with-icon" href={uiConfig.dashboardActions.defineAccessLevelUrl} rel="external" target="_blank">
          <span>What are access levels?</span>
          <Icon icon={linkOutIcon} width="1.2em" />
        </a>
      {/if}
     <div class="team-actions">
        {#if canManageTeam}<Button type="button" icon={plusIcon} on:click={() => openModal('adduser')}>Add User</Button>{/if}
        <!-- <Button icon={teamIcon}>Audit Team</Button>
        <Button icon={exportIcon}>Export CSV</Button> -->
     </div>
      {#if site.team.length}
      <SortableTable items={site.team} headers={[
        { id: 'access', label: 'Access Level', get: 'accessDisplay', sortable: true, sortFunction: item => item.accessDisplay, mobileRole: 'subtitle' },
        { id: 'name', label: 'Name', get: 'name', sortable: true, mobileRole: 'title' },
        { id: 'username', label: 'User ID', get: 'id' },
        { id: 'lastlogin', label: 'Last Login', render: item => item.lastlogin ? dateStamp(item.lastlogin) : '', sortable: true },
        canManageTeam ? { id: 'edituser', label: 'Edit', actions: [{ icon: editOneIcon, class: 'user-detail', label: 'Edit', onClick: async user => openEditUserModal(user.id) }] } : undefined,
        { id: 'details', label: 'Details', actions: [{ icon: infoIcon, class: 'user-detail', label: 'Details', onClick: async user => await viewUserDetail(user.id) }] }
      ]} cardedOnMobile={true} />
      {:else}
        <p>No team members have been added to this site.</p>
      {/if}
    </DetailPanelSection>
  </DetailPanel>
  <DetailPanel header="Role Management" headerColor="#F5F1EE" collapsible>
    <DetailPanelSection>
      <p>All team members in your site should have at least one role assigned. To add or remove roles, or update existing role permissions, contact {#if uiConfig?.dashboardActions?.contactSupportUrl}<a class="dashboard-link" rel="external" href="{uiConfig.dashboardActions.contactSupportUrl}">Support</a>{:else}Support{/if}.</p>
      {#if uiConfig?.dashboardActions?.defineRolesUrl}
        <a class="dashboard-link with-icon" rel="external" href="{uiConfig.dashboardActions.defineRolesUrl}" target="_blank">
          <span>What are roles?</span>
          <Icon icon={linkOutIcon} width="1.2em" />
        </a>
      {/if}
      {#if site.auditRoles.length}
      <SortableTable items={site.auditRoles} headers={[
        { id: 'role', label: 'Role Title', get: 'name', sortable: true, sortFunction: item => item.name, mobileRole: 'title' },
        { id: 'access', label: 'Access Level', render: (item: SiteAuditRole) => titleCaseAccess[item.access], mobileRole: 'subtitle' },
        { id: 'description', label: 'Description', get: 'description' },
        { id: 'users', label: 'Assignees', render: item => item.users.length, sortable: true, sortFunction: item => item.users.length }
      ]} cardedOnMobile={true} />
      {:else}
        <p>No roles have been associated with this site.</p>
      {/if}
    </DetailPanelSection>
  </DetailPanel>
  <DetailPanel header="Related Page Trees" headerColor="#F5F1EE" collapsible>
    <DetailPanelSection>
      <div class="pagetree-details">
        <div class="detail">
          <div class="label">Total Page Trees:</div>
          <div class="value">{site.pagetrees.length}</div>
        </div>
      </div>
      {#if uiConfig?.dashboardActions?.definePagetreeUrl}
        <a class="dashboard-link with-icon" rel="external" href="{uiConfig.dashboardActions.definePagetreeUrl}" target="_blank">
          <span>What is a page tree?</span>
          <Icon icon={linkOutIcon} width="1.2em" />
        </a>
      {/if}
      <!-- link to information about page trees -->
       <DashboardPagetreeTable
         pagetrees={site.pagetrees}
         launchState={site.launchState}
         pagetreeLastModifiedById={site.pagetreeLastModifiedById}
         {revealInPageTree}
       />
    </DetailPanelSection>
  </DetailPanel>
</DetailPageContent>
{#if modal === 'downloadcsv'}
  <FormDialog
      name='downloadcsv'
      title='Download Page List'
      on:escape={() => { uiLog.log({ eventType: 'DashboardDetailPage-modal-' + modal, action: 'Cancel', target: site.name }); modal = undefined }}
      submit={onDownloadPageList}>
      <FieldSelect path='pagetree' label='Pagetree' choices={data.site.pagetrees.map(p => ({ label: p.name, value: p.id }))} required/>
    </FormDialog>
{:else if modal === 'userdetail'}
    <UserDetailDialog siteName={site.name} userDetail={userDetail} on:dismiss={dismissUserDetail}/>
{:else if modal === 'adduser'}
    <FormDialog
      name='adduser'
      title='Add User'
      on:escape={() => { uiLog.log({ eventType: 'DashboardDetailPage-modal-' + modal, action: 'Cancel', target: site.name }); modal = undefined; foundUser = undefined }}
      on:saved={onCompleteAddUser}
      submit={onAddUser}
      validate={validateAddUser}
      let:data>
      <!-- readonly instead of a Field so screen readers announce the site but it stays out of the dialog data -->
      <div class="readonly-field">
        <label for="adduser-site">Site</label>
        <span id="site-description" class="sr-only">This field is read-only</span>
        <input id="adduser-site" type="text" readonly value={site.name} aria-describedby="site-description"/>
      </div>
      <FieldText path='userId' label='Search User IDs' required helptext="To be added as an editor or contributor, the desired user must have completed the required training." />
      {#if foundUser && !foundUser.disabled}
        <section class="found-user">
          <header>User Details</header>
          <dl>
            <div>
              <dt>Name</dt>
              <dd>{foundUser.name}</dd>
            </div>
            <div>
              <dt>ID</dt>
              <dd>{foundUser.id}</dd>
            </div>
            <div>
              <dt>Training Status</dt>
              <dd>{foundUser.trainings.length > 0 ? 'Trained' : 'Incomplete' }</dd>
            </div>
          </dl>
        </section>
      {/if}
      <FieldRadio path='access' label='Assign Access Level' choices={availableAccessChoices} required defaultValue='READONLY' />
      <FieldRoleTable path='roleIds' label='Available Roles' conditional={ (data as AddUserInput)?.access === 'CONTRIBUTOR'} required helptext='Tailor what page trees, actions and content this team member has access to.' auditRoles = {contributorRoles} />
    </FormDialog>
{:else if modal === 'edituser'}
    <FormDialog
      name='edituser'
      title={`Edit User: ${userToEdit ? userToEdit.name : ''}`}
      on:escape={() => { uiLog.log({ eventType: 'DashboardDetailPage-modal-' + modal, action: 'Cancel', target: site.name }); modal = undefined }}
      preload={editUserPreload}
      validate={validateEditTeamMemberAccess}
      submit={onEditTeamMemberAccess}
      on:saved={onCompleteEditTeamMemberAccess}
      let:data>
      <section class="found-user edit">
        <header>User Details</header>
        <dl>
          <div>
            <dt>Name</dt>
            <dd>{userToEdit?.name ?? ''}</dd>
          </div>
          <div>
            <dt>ID</dt>
            <dd>{userToEdit?.id ?? ''}</dd>
          </div>
          <div>
            <dt>Training Status</dt>
            <dd>{userToEdit?.trainings?.length ? 'Trained' : 'Incomplete' }</dd>
          </div>
        </dl>
      </section>
      <!-- readonly instead of a Field so screen readers announce the site but it stays out of the dialog data -->
      <div class="readonly-field">
        <label for="adduser-site">Site</label>
        <span id="site-description" class="sr-only">This field is read-only</span>
        <input id="adduser-site" type="text" readonly value={site.name} aria-describedby="site-description"/>
      </div>
      <FieldRadio path='access' label='Access Level' choices={editAccessChoices} required />
      <FieldRoleTable path='roleIds' label='Available Roles' conditional={ (data as AddUserInput)?.access === 'CONTRIBUTOR'} required helptext='Tailor what page trees, actions and content this team member has access to.' auditRoles = {contributorRoles} />
      <div class="remove">
        <Button type="button" icon={trashIcon} on:click={async () => await onRemoveTeamMember(userToEdit?.id ?? '')}>Remove User from Site</Button>
        <InlineMessages messages={removeMessages} />
      </div>
    </FormDialog>
{/if}

<style>
  :global(.panel) {
    margin-bottom: 2em;
  }
  .site-stats {
    display: flex;
    flex-direction: column;
    border: 1px solid #808080;
    border-radius: 8px;
    margin-bottom: 2em;
  }
  .site-stats .top {
    gap: 1em;
    padding: 1em;
    border-top-right-radius: 8px;
    border-top-left-radius: 8px;
  }
  .site-stats .top.launched {
    background-color: var(--dashboard-live-bg);
  }
  .site-stats .top.launched .basic-info :global(.state-icon) {
    color: var(--dashboard-live-accent);
  }
  .site-stats .top.prelaunch {
    background-color: var(--dashboard-sandbox-bg);
  }
  .site-stats .top.prelaunch .basic-info :global(svg.state-icon path) {
    fill: var(--dashboard-sandbox-accent);
  }
  .site-stats .top.decommissioned {
    background-color: var(--dashboard-archive-bg);
  }
  .site-stats .top.decommissioned .basic-info :global(.state-icon) {
    color: var(--dashboard-archive-accent);
  }
  .site-stats .top .basic-info {
    display: flex;
    flex: 1;
    gap: 1em;
  }
  .site-stats .top .basic-info .title-block {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .site-stats .top .basic-info .site-title {
    margin: 0;
    font-size: 1.3em;
    font-weight: 400;
  }
  .site-stats .top .basic-info .url {
    display: flex;
    gap: 0.5em;
    font-size: 0.9em;
  }
  .site-stats .top .basic-info .url .label {
    font-weight: 600;
  }
  .site-stats .top .basic-info .site-actions {
    padding-top: 0.5em;
    display: flex;
    flex-wrap: wrap;
    gap: 1em;
  }
  .site-stats .bottom {
    padding: 1em;
    display: flex;
    gap: 1em;
  }
  .site-stats .bottom .stats {
    flex: 1;
  }
  .site-stats .bottom .stats dl {
    display: flex;
    flex-wrap: wrap;
    row-gap: 1em;
    column-gap: 2em;
    margin: 0;
  }
  .site-stats .bottom .stats dl div {
    flex: 0 0 calc(33.333% - 2em);
    display: flex;
    gap: 0.5em;
  }
  .site-stats .bottom .stats dl div dt {
    font-weight: 600;
    white-space: nowrap;
  }
  .site-stats .bottom .stats dl div dd {
    margin: 0;
    white-space: nowrap;
  }
  .bottom .secondary-actions {
    display: flex;
    gap: 1em;
    align-items: flex-start;
  }
  .dashboard-link {
    color: var(--dg-link-color, #006699);
  }
  .dashboard-link.with-icon {
    display: inline-flex;
    gap: 0.25em;
    align-items: center;
    font-weight: 700;
    margin-bottom: 1.1em;
  }
  :global(button.user-detail) {
    padding: 0.1em 0.5em;
    border: 0;
    border-radius: 0.25em;
  }
  :global(button.user-detail .button-icon) {
    display: flex;
  }
  :global(button.user-detail:hover) {
    background-color: var(--dg-button-bg, #501214);
  }
  :global(button.user-detail .button-icon svg path) {
    fill: #006699;
  }
  :global(button.user-detail:hover .button-icon svg path) {
    fill: #ffffff;
  }
  .team-details, .pagetree-details {
    display: flex;
    gap: 2em;
    padding-block: 1em;
  }
  .team-details .detail, .pagetree-details .detail {
    display: flex;
    gap: 0.5em;
  }
  .team-details .label, .pagetree-details .label {
    font-weight: 600;
  }
  /* .team-actions {
    display: flex;
    gap: 0.5em;
    padding: 2em 0 1em 1.5em;
  } */

  @media screen and (max-width: 50em) {
    .site-stats .top .basic-info {
      flex-direction: column;
    }
    .site-stats .bottom {
      flex-direction: column;
    }
    .site-stats .bottom .stats dl {
      row-gap: 0.5em;
    }
    .site-stats .bottom .stats dl .created {
      flex-basis: 100%;
    }
    .site-stats .bottom .secondary-actions {
      flex-direction: column;
      gap: 0.5em;
    }
  }
  .readonly-field label {
    display: block;
    font-weight: 500;
    margin-top: 1em;
    margin-bottom: 0.3rem;
  }
  .readonly-field input {
    width: 100%;
    border-width: 0;
    border-bottom: 1px solid #CCCED1;
    padding: 0.5em;
    background-color: #F4F4F4;
  }
  /* Add User dialog */
  section.found-user {
    border: 1px dashed #767676;
    padding: 1em;
  }
  section.found-user.edit {
    margin-top: 2em;
  }
  section header {
    font-weight: 500;
    font-size: 1rem;
    margin-bottom: 1em;
  }
  section dl {
    display: flex;
    gap: 2em;
    margin: 0;
  }
  section dl div {
    display: flex;
    flex-direction: column;
    gap: 0.2em;
  }
  section dl dt {
    font-weight: 500;
    font-size: 0.75rem;
    text-transform: uppercase;
  }
  section dl dd {
    margin-left: 0;
  }
  .remove {
    margin-bottom: 1em;
  }
  :global(.still-a-user) {
    font-size: 0.9em;
    color: #767676;
  }
  :global(.edit-team-warning) {
    background-color: #F3D690;
    padding: 0.5em;
    display: flex;
    gap: 1em;
    align-items: center;
    font-size: 0.9rem;
  }
</style>
