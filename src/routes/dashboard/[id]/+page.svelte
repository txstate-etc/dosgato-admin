<script lang="ts">
  import { dateStamp, DetailPageContent, DetailPanel, DetailPanelSection, downloadPageList, environmentConfig, getSiteIcon, SortableTable, toast, titleCaseAccess, uiLog } from '$lib'
  import type { DashboardSiteDetailDisplay, DashboardSiteTeamMemberWithRole } from '$lib'
  import { Button, FieldSelect, FormDialog, Icon } from '@dosgato/dialog'
  import eye from '@iconify-icons/ph/eye-bold'
  import clipboard from '@iconify-icons/ph/clipboard-fill'
  import list from '@iconify-icons/ph/list-bullets-bold'
  import treeStructure from '@iconify-icons/ph/tree-structure'
  import exportIcon from '@iconify-icons/ph/export-bold'
  import editUserIcon from '@iconify-icons/ph/user-gear-fill'
  import trashIcon from '@iconify-icons/ph/trash-simple-fill'
  import infoIcon from '@iconify-icons/ph/info-fill'
  import linkOutIcon from '@iconify-icons/ph/arrow-square-out-bold'
  import { base } from '$app/paths'
  import { goto } from '$app/navigation'
  import UserDetailDialog from './UserDetailDialog.svelte'
  import DashboardPagetreeTable from './DashboardPagetreeTable.svelte'
  import { uiConfig } from '../../../local'


  export let data: { site: DashboardSiteDetailDisplay }
  $: site = data.site

  $: icon = getSiteIcon(site.launchState, 'PRIMARY')

  type Modals = 'downloadcsv' | 'userdetail'
  let modal: Modals | undefined

  function onCopyURL (e: MouseEvent) {
    if (!site.url?.prefix) return
    navigator.clipboard.writeText(site.url.prefix).then(() => {
      toast('Copied Live URL to clipboard.', 'success')
    }).catch(console.error)
  }

  function revealInPageTree (pageId?: string) {
    if (!pageId) return
    void goto(`${base}/pages?selectedPage=${pageId}`)
  }

  async function onDownloadPageList (state) {
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

  let userDetailId: string | null = null
  let userDetail: DashboardSiteTeamMemberWithRole | null = null
  async function viewUserDetail (userId: string) {
    userDetailId = userId
    userDetail = site.teamMembersWithRolesById[userId]
    openModal('userdetail')
  }

  function dismissUserDetail () {
    userDetailId = null
    userDetail = null
    uiLog.log({ eventType: 'DashboardDetailPage-modal-' + modal, action: 'Cancel', target: site.name })
    modal = undefined
  }
</script>

<DetailPageContent>
  <div class="site-stats">
    <div class="top" class:launched={site.launchState === 'LAUNCHED'} class:prelaunch={site.launchState === 'PRELAUNCH'} class:decommissioned={site.launchState === 'DECOMMISSIONED'}>
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
              <Button type="button" icon={eye} on:click={() => { window.open(base + '/preview?url=' + encodeURIComponent(`${environmentConfig.renderBase}/.preview/latest${site.rootPagePath}.html`), '_blank') }}>Gato Preview</Button>
            {/if}
            {#if site.launched}<Button type="button" icon={clipboard} on:click={onCopyURL}>Copy Live URL</Button>{/if}
            {#if site.rootPageId}
              <Button type="button" icon={treeStructure} on:click={(e) => { e.preventDefault(); revealInPageTree(site.rootPageId) }}>Go to Page Tree</Button>
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
            <dd>{site.launchState === 'LAUNCHED' ? 'Active' : site.launchState === 'PRELAUNCH' ? 'Prelaunch' : 'Inactive'}</dd>
          </div>
          <div>
            <dt>Total Pages:</dt>
            <dd>{site.totalPages}</dd>
          </div>
        </dl>
      </div>
      <div class="secondary-actions">
        {#if uiConfig?.dashboardActions?.updateWebsiteManagementUrl}<Button secondary icon={editUserIcon} on:click={() => window.open(uiConfig.dashboardActions?.updateWebsiteManagementUrl, '_blank')}>Update Website Management</Button>{/if}
        {#if site.permissions.audit && uiConfig?.dashboardActions?.requestSiteDecommissionUrl}<Button secondary icon={trashIcon} on:click={() => window.open(uiConfig.dashboardActions?.requestSiteDecommissionUrl, '_blank')}>Request Site Decommission</Button>{/if}
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
  <DetailPanel header="Team Members" headerColor="#F5F1EE">
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
        <a class="dashboard-link with-icon" href="{uiConfig.dashboardActions.defineAccessLevelUrl}" target="_blank">
          <span>What are access levels?</span>
          <Icon icon={linkOutIcon} width="1.2em" />
        </a>
      {/if}
     <!-- <div class="team-actions">
        <Button icon={plusIcon}>Add User</Button>
        <Button icon={teamIcon}>Audit Team</Button>
        <Button icon={exportIcon}>Export CSV</Button>
     </div> -->
      {#if site.team.length}
      <SortableTable items={site.team} headers={[
        { id: 'access', label: 'Access Level', get: 'access', sortable: true, mobileRole: 'subtitle' },
        { id: 'name', label: 'Name', get: 'name', sortable: true, mobileRole: 'title' },
        { id: 'username', label: 'User ID', get: 'id' },
        { id: 'lastlogin', label: 'Last Login', render: (item) => item.lastlogin ? dateStamp(item.lastlogin) : '', sortable: true },
        { id: 'details', label: 'Details', actions: [{ icon: infoIcon, class: 'user-detail', label: 'Details', onClick: async (user) => await viewUserDetail(user.id) }] }
      ]} cardedOnMobile={true} />
      {:else}
        <p>No team members have been added to this site.</p>
      {/if}
    </DetailPanelSection>
  </DetailPanel>
  <DetailPanel header="Role Management" headerColor="#F5F1EE">
    <DetailPanelSection>
      <p>All team members in your site should have at least one role assigned. To add or remove roles, or update existing role permissions, contact {#if uiConfig?.dashboardActions?.contactSupportUrl}<a class="dashboard-link" href="{uiConfig.dashboardActions.contactSupportUrl}">Support</a>{:else}Support{/if}.</p>
      {#if uiConfig?.dashboardActions?.defineRolesUrl}
        <a class="dashboard-link with-icon" href="{uiConfig.dashboardActions.defineRolesUrl}" target="_blank">
          <span>What are roles?</span>
          <Icon icon={linkOutIcon} width="1.2em" />
        </a>
      {/if}
      {#if site.auditRoles.length}
      <SortableTable items={site.auditRoles} headers={[
        { id: 'role', label: 'Role Title', get: 'name', sortable: true, sortFunction: (item) => item.name, mobileRole: 'title' },
        { id: 'access', label: 'Access Level', render: (item) => item.access ? titleCaseAccess[item.access] : '', mobileRole: 'subtitle' },
        { id: 'description', label: 'Description', get: 'description' },
        { id: 'users', label: 'Assignees', render: (item) => item.users.length, sortable: true, sortFunction: (item) => item.users.length }
      ]} cardedOnMobile={true} />
      {:else}
        <p>No roles have been associated with this site.</p>
      {/if}
    </DetailPanelSection>
  </DetailPanel>
  <DetailPanel header="Related Page Trees" headerColor="#F5F1EE">
    <DetailPanelSection>
      <div class="pagetree-details">
        <div class="detail">
          <div class="label">Total Page Trees:</div>
          <div class="value">{site.pagetrees.length}</div>
        </div>
      </div>
      {#if uiConfig?.dashboardActions?.definePagetreeUrl}
        <a class="dashboard-link with-icon" href="{uiConfig.dashboardActions.definePagetreeUrl}" target="_blank">
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
{/if}

<style>
  :global(.panel) {
    margin-bottom: 2em;
  }
  .site-stats {
    display: flex;
    flex-direction: column;
    border: 2px solid #808080;
    border-radius: 4px;
    margin-bottom: 2em;
  }
  .site-stats .top {
    gap: 1em;
    padding: 1em;
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
    padding: 0.3em 0.5em;
    border: 0;
    border-radius: 0.25em;
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
</style>
