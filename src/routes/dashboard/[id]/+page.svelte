<script lang="ts">
  import { dateStamp, DetailPageContent, DetailPanel, DetailPanelSection, downloadPageList, environmentConfig, getSiteIcon, SortableTable, toast, titleCaseAccess } from '$lib'
  import type { DashboardSiteDetailDisplay, DashboardSiteTeamMemberWithRole } from '$lib'
  import { Button, FieldSelect, FormDialog, Icon } from '@dosgato/dialog'
  import eye from '@iconify-icons/ph/eye-bold'
  import clipboard from '@iconify-icons/ph/clipboard-fill'
  import tree from '@iconify-icons/ph/tree-structure-bold'
  import exportIcon from '@iconify-icons/ph/export-bold'
  import plusIcon from '@iconify-icons/ph/plus-circle-fill'
  import teamIcon from '@iconify-icons/ph/users-three-fill'
  import editUserIcon from '@iconify-icons/ph/user-gear-fill'
  import trashIcon from '@iconify-icons/ph/trash-simple-fill'
  import infoIcon from '@iconify-icons/ph/info-fill'
  import { base } from '$app/paths'
  import { goto } from '$app/navigation'
  import { ModalContextStore } from '$lib'
  import UserDetailDialog from './UserDetailDialog.svelte'


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
    goto(`${base}/pages?selectedPage=${pageId}`)
  }

  async function onDownloadPageList (state) {
    if (!state.pagetree) {
      return { success: false, data: {}, messages: [] }
    }
    modalContext.reset()
    const pagetree = data.site.pagetrees.find(p => p.id === state.pagetree)
    downloadPageList(state.pagetree, pagetree!.name, data.site.name)
    return { success: true, data: state, messages: [] }
  }

  let userDetailId: string | null = null
  let userDetail: DashboardSiteTeamMemberWithRole | null = null
  async function viewUserDetail(userId: string) {
    userDetailId = userId
    userDetail = site.teamMembersWithRolesById[userId]
    modalContext.setModal('userdetail', userId)
  }

  function dismissUserDetail() {
    userDetailId = null
    userDetail = null
    modalContext.onModalEscape()
  }

  function getPagetreeStatus(item) {
    let type = item.type
    if (type === 'PRIMARY') {
      type = site.launched ? 'LIVE' : 'SANDBOX'
    }
    return type
  }
</script>

<DetailPageContent>
  <div class="site-stats">
    <div class="top" class:launched={site.launchState === 'LAUNCHED'} class:prelaunch={site.launchState === 'PRELAUNCH'} class:decommissioned={site.launchState === 'DECOMMISSIONED'}>
      <div class="basic-info">
        <Icon {icon} width="1.75em" />
        <div class="title-block">
          <h1 class="site-title">{site.name}</h1>
          <div class="url">
            <div class="label">Assigned URL:</div>
            <div class="value">{site.url?.prefix ?? 'None'}</div>
          </div>
          <div class="site-actions">
            <Button type="button" on:click={() => { window.open(base + '/preview?url=' + encodeURIComponent(`${environmentConfig.renderBase}/.preview/latest${site.rootPagePath}.html`), '_blank') }}><Icon icon={eye} /> Preview in New Window</Button>
            {#if site.launched}<Button type="button" on:click={onCopyURL}><Icon icon={clipboard} /> Copy Live URL</Button>{/if}
            <Button type="button" on:click={(e) => { e.preventDefault(); revealInPageTree(site.rootPageId) }}><Icon icon={tree} /> Reveal in Page Tree</Button>
          </div>
        </div>
      </div>
      <div>
        <div class="launch-state">{site.launchState === 'LAUNCHED' ? 'LIVE' : site.launchState === 'PRELAUNCH' ? 'SANDBOX' : 'INACTIVE'}</div>
      </div>
    </div>
    <div class="bottom">
      <div class="stats">
        <dl>
          <div class="full-width">
            <dt>Site Owner:</dt>
            <dd>{site.owner?.name ?? 'None'}</dd>
          </div>
          <div>
            <dt>Created:</dt>
            <dd>{site.createdAt}</dd>
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
   <DetailPanel header="Utilities" headerColor="#E5D1BD">
    <DetailPanelSection>
      <Button type="button" on:click={() => { modalContext.setModal('downloadcsv') }}><Icon icon={exportIcon} /> Download Page List</Button>
    </DetailPanelSection>
  </DetailPanel>
  <DetailPanel header="Team Members" headerColor="#E5D1BD">
    <!-- Last Audit Timestamp-->
     <!-- <div class="team-actions">
        <Button icon={plusIcon}>Add User</Button>
        <Button icon={teamIcon}>Audit Team</Button>
        <Button icon={exportIcon}>Export CSV</Button>
     </div> -->
    <DetailPanelSection>
      {#if site.team.length}
      <SortableTable items={site.team} headers={[
          { id: 'access', label: 'Access Level', get: 'access', sortable: true },
          { id: 'name', label: 'Name', get: 'name', sortable: true },
          { id: 'username', label: 'User ID', get: 'id' },
          { id: 'lastlogin', label: 'Last Login', render: (item) => item.lastlogin ? dateStamp(item.lastlogin) : '', sortable: true },
          { id: 'details', label: 'Details', actions: [{ icon: infoIcon, label: 'Details', onClick: (user) => viewUserDetail(user.id) }] }
        ]} cardedOnMobile={true} mobileHeader={(item) => item.name}/>
      {:else}
        <p>No team members have been added to this site.</p>
      {/if}
    </DetailPanelSection>
  </DetailPanel>
  <DetailPanel header="Role Management" headerColor="#E5D1BD">
    <DetailPanelSection>
      {#if site.auditRoles.length}
      <SortableTable items={site.auditRoles} headers={[
          { id: 'role', label: 'Role', get: 'name', sortable: true, sortFunction: (item) => item.name },
          { id: 'description', label: 'Description', get: 'description' },
          { id: 'access', label: 'Access Level', render: (item) => item.access ? titleCaseAccess[item.access] : '' },
          { id: 'users', label: 'Users', render: (item) => item.users.length, sortable: true, sortFunction: (item) => item.users.length }
        ]} cardedOnMobile={true} mobileHeader={(item) => item.name}/>
      {:else}
        <p>No roles have been associated with this site.</p>
      {/if}
    </DetailPanelSection>
  </DetailPanel>
  <DetailPanel header="Related Pagetrees" headerColor="#E5D1BD">
    <DetailPanelSection>
      <p>Access to additional page trees is granted to all site Editors. Including all archives, sandboxes, and the live site (if published) there {site.pagetrees.length === 1 ? 'is 1 page tree' : `are ${site.pagetrees.length} page trees`} for this website. To remove a Page Tree, submit a Decommission Request.</p>
      <!-- link to information about page trees -->
       <SortableTable items={site.pagetrees} headers={[
          { id: 'status', label: 'Status', render: (item) => { const type = getPagetreeStatus(item); const icon = getSiteIcon(site.launchState, item.type); console.log(icon); return `<div class="pagetree-status ${type.toLowerCase()}">${type}</div>`} },
          { id: 'name', label: 'Page Tree', get: 'name' },
          { id: 'pagecount', label: 'Pages', render: (item) => item.pages.length },
          { id: 'lastedited', label: 'Last Edited', render: (item) => site.pagetreeLastModifiedById[item.id] ? dateStamp(site.pagetreeLastModifiedById[item.id].toISOString()) : '' },
          { id: 'openinpages', label: 'Go to Page Tree', actions: [{ icon: tree, label: 'Open in Pages', onClick: (item) => { revealInPageTree(item.rootPage.id) } }] }
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
    display: flex;
    gap: 1em;
    padding: 1em;
  }
  .site-stats .top .launch-state {
    background-color: #fff;
    padding: calc(8 / 12 * 1em) 1em;
    border-radius: 4px;
    font-size: 0.75em;
    font-weight: 600;
  }
  .site-stats .top.launched {
    background-color: #BFF3FD;
  }
  .site-stats .top.launched .launch-state {
    color: #006699;
  }
  .site-stats .top.prelaunch {
    background-color: #F9DCDE;
  }
  .site-stats .top.prelaunch .launch-state {
    color: #E3284A;
  }
  .site-stats .top.decommissioned {
    background-color: #EBEBEB;
  }
  .site-stats .top.decommissioned .launch-state {
    color: #808080;
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
    color: #595959;
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
    display: flex;
    gap: 0.5em;
  }
  .site-stats .bottom .stats dl div.full-width {
    flex: 1 1 100%;
  }
  .site-stats .bottom .stats dl div dt {
    font-weight: 600;
  }
  .site-stats .bottom .stats dl div dd {
    margin: 0;
  }
  .bottom .secondary-actions {
    display: flex;
    gap: 1em;
    align-items: flex-start;
  }
  /* .team-actions {
    display: flex;
    gap: 0.5em;
    padding: 2em 0 1em 1.5em;
  } */
  :global(.pagetree-status) {
    padding: 6px 8px;
    border-radius: 8px;
    width: 100px;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 0.75em;
    font-weight: 600;
  }
  :global(.pagetree-status.live) {
    background-color: #BFF3FD;
    color: #000;
  }
  :global(.pagetree-status.archive) {
    background-color: #767676;
    color: #fff;
  }
  :global(.pagetree-status.sandbox) {
    background-color: #E32849;
    color: #fff;
  }
</style>