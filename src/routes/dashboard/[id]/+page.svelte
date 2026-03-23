<script lang="ts">
  import { dateStamp, DetailPageContent, DetailPanel, DetailPanelSection, downloadPageList, environmentConfig, getSiteIcon, SortableTable, toast, titleCaseAccess, ModalContextStore } from '$lib'
  import type { DashboardSiteDetailDisplay, DashboardSiteTeamMemberWithRole } from '$lib'
  import { Button, FieldSelect, FormDialog, Icon } from '@dosgato/dialog'
  import eye from '@iconify-icons/ph/eye-bold'
  import clipboard from '@iconify-icons/ph/clipboard-fill'
  import list from '@iconify-icons/ph/list-bullets-bold'
  import tree from '@iconify-icons/ph/tree-structure-bold'
  import exportIcon from '@iconify-icons/ph/export-bold'
  import editUserIcon from '@iconify-icons/ph/user-gear-fill'
  import trashIcon from '@iconify-icons/ph/trash-simple-fill'
  import infoIcon from '@iconify-icons/ph/info-fill'
  import { base } from '$app/paths'
  import { goto } from '$app/navigation'
  import UserDetailDialog from './UserDetailDialog.svelte'
  import StatusBadge from './StatusBadge.svelte'


  export let data: { site: DashboardSiteDetailDisplay }
  $: site = data.site

  $: icon = getSiteIcon(site.launchState, 'PRIMARY')

  type Modals = 'downloadcsv' | 'userdetail'
  const modalContext = new ModalContextStore<Modals>()

  function onCopyURL (e: MouseEvent) {
    if (!site.url?.prefix) return
    navigator.clipboard.writeText(site.url.prefix).then(() => {
      toast('Copied Live URL to clipboard.', 'success')
    }).catch(console.error)
  }

  function revealInPageTree (pageId: string) {
    void goto(`${base}/pages?selectedPage=${pageId}`)
  }

  async function onDownloadPageList (state) {
    if (!state.pagetree) {
      return { success: false, data: {}, messages: [] }
    }
    modalContext.reset()
    const pagetree = data.site.pagetrees.find(p => p.id === state.pagetree)
    await downloadPageList(state.pagetree, pagetree!.name, data.site.name)
    return { success: true, data: state, messages: [] }
  }

  let userDetailId: string | null = null
  let userDetail: DashboardSiteTeamMemberWithRole | null = null
  async function viewUserDetail (userId: string) {
    userDetailId = userId
    userDetail = site.teamMembersWithRolesById[userId]
    modalContext.setModal('userdetail', userId)
  }

  function dismissUserDetail () {
    userDetailId = null
    userDetail = null
    modalContext.onModalEscape()
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
            <Button type="button" on:click={() => { window.open(base + '/preview?url=' + encodeURIComponent(`${environmentConfig.renderBase}/.preview/latest${site.rootPagePath}.html`), '_blank') }}><Icon icon={eye} />Gato Preview</Button>
            {#if site.launched}<Button type="button" on:click={onCopyURL}><Icon icon={clipboard} /> Copy Live URL</Button>{/if}
            <Button type="button" on:click={(e) => { e.preventDefault(); revealInPageTree(site.rootPageId) }}><Icon icon={tree}/> Reveal in Page Tree</Button>
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
          <div>
            <dt>Theme:</dt>
            <dd>{site.pagetrees[0]?.rootPage?.template?.templateTheme ?? 'None Assigned'}</dd>
          </div>
          <div>
            <dt>Live Pages:</dt>
            <dd>{site.publishedPages}</dd>
          </div>
          <div>
            <dt>Total Pages:</dt>
            <dd>{site.totalPages}</dd>
          </div>
        </dl>
      </div>
      <div class="secondary-actions">
        <Button secondary icon={editUserIcon}>Update Website Management</Button>
        {#if site.permissions.audit}<Button secondary icon={trashIcon}>Request Site Decommission</Button>{/if}
      </div>
    </div>
  </div>
  <!-- Audit Warning Panel -->
   <!--
   <DetailPanel header="Utilities" headerColor="#F5F1EE">
    <DetailPanelSection>
      <Button type="button" on:click={() => { modalContext.setModal('downloadcsv') }}><Icon icon={exportIcon} /> Download Page List</Button>
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
     <!-- <div class="team-actions">
        <Button icon={plusIcon}>Add User</Button>
        <Button icon={teamIcon}>Audit Team</Button>
        <Button icon={exportIcon}>Export CSV</Button>
     </div> -->
      {#if site.team.length}
      <SortableTable items={site.team} headers={[
        { id: 'access', label: 'Access Level', get: 'access', sortable: true },
        { id: 'name', label: 'Name', get: 'name', sortable: true },
        { id: 'username', label: 'User ID', get: 'id' },
        { id: 'lastlogin', label: 'Last Login', render: (item) => item.lastlogin ? dateStamp(item.lastlogin) : '', sortable: true },
        { id: 'details', label: 'Details', actions: [{ icon: infoIcon, class: 'user-detail', label: 'Details', onClick: async (user) => await viewUserDetail(user.id) }] }
      ]} cardedOnMobile={true} mobileHeader={(item) => item.name}/>
      {:else}
        <p>No team members have been added to this site.</p>
      {/if}
    </DetailPanelSection>
  </DetailPanel>
  <DetailPanel header="Role Management" headerColor="#F5F1EE">
    <DetailPanelSection>
      {#if site.auditRoles.length}
      <SortableTable items={site.auditRoles} headers={[
        { id: 'role', label: 'Role Title', get: 'name', sortable: true, sortFunction: (item) => item.name },
        { id: 'access', label: 'Access Level', render: (item) => item.access ? titleCaseAccess[item.access] : '' },
        { id: 'description', label: 'Description', get: 'description' },
        { id: 'users', label: 'Assignees', render: (item) => item.users.length, sortable: true, sortFunction: (item) => item.users.length }
      ]} cardedOnMobile={true} mobileHeader={(item) => item.name}/>
      {:else}
        <p>No roles have been associated with this site.</p>
      {/if}
    </DetailPanelSection>
  </DetailPanel>
  <DetailPanel header="Related Pagetrees" headerColor="#F5F1EE">
    <DetailPanelSection>
      <p>Access to additional page trees is granted to all site Editors. Including all archives, sandboxes, and the live site (if published) there {site.pagetrees.length === 1 ? 'is 1 page tree' : `are ${site.pagetrees.length} page trees`} for this website. To remove a Page Tree, submit a Decommission Request.</p>
      <!-- link to information about page trees -->
       <SortableTable items={site.pagetrees.map(p => ({ ...p, launchState: site.launchState }))} headers={[
         { id: 'status', label: 'Status', component: StatusBadge },
         { id: 'name', label: 'Name', get: 'name' },
         { id: 'pagecount', label: 'Pages', render: (item) => item.pages.length },
         { id: 'theme', label: 'Theme', get: 'rootPage.template.templateTheme' },
         { id: 'lastedited', label: 'Last Edited', render: (item) => site.pagetreeLastModifiedById[item.id] ? dateStamp(site.pagetreeLastModifiedById[item.id].toISOString()) : '' },
         { id: 'openinpages', label: 'Go to Page Tree', actions: [{ icon: list, class: 'open-pagetree', label: 'Open in Pages', onClick: (item) => { revealInPageTree(item.rootPage.id) } }] }
       ]} cardedOnMobile={true} mobileHeader={(item) => item.name}/>
    </DetailPanelSection>
  </DetailPanel>
</DetailPageContent>
{#if $modalContext.modal === 'downloadcsv'}
  <FormDialog
      name='downloadcsv'
      title='Download Page List'
      on:escape={modalContext.onModalEscape}
      submit={onDownloadPageList}>
      <FieldSelect path='pagetree' label='Pagetree' choices={data.site.pagetrees.map(p => ({ label: p.name, value: p.id }))} required/>
    </FormDialog>
{:else if $modalContext.modal === 'userdetail'}
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
  :global(button.user-detail .button-icon svg path) {
    fill: #006699;
  }
  .team-details {
    display: flex;
    gap: 2em;
    padding-block: 1em;
  }
  .team-details .detail {
    display: flex;
    gap: 0.5em;
  }
  .team-details .label {
    font-weight: 600;
  }
  /* .team-actions {
    display: flex;
    gap: 0.5em;
    padding: 2em 0 1em 1.5em;
  } */

  :global(button.open-pagetree .button-icon svg path) {
    fill: #006699;
  }

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
