<script lang="ts" context="module">
  import type { Load } from '@sveltejs/kit'
  import pencilIcon from '@iconify-icons/mdi/pencil'
  import arrowLeft from '@iconify-icons/mdi/arrow-left'
  import plusIcon from '@iconify-icons/mdi/plus'
  import deleteOutline from '@iconify-icons/mdi/delete-outline'
  import archiveOutline from '@iconify-icons/mdi/archive-outline'
  import applicationExport from '@iconify-icons/mdi/application-export'
  import checkIcon from '@iconify-icons/mdi/check'
  import minusIcon from '@iconify-icons/mdi/minus'
  import { Icon, FieldText, FieldSelect, FieldMultiselect } from '@dosgato/dialog'
  import FormDialog from '$lib/components/FormDialog.svelte'
  import { ScreenReaderOnly } from '@txstate-mws/svelte-components'
  import { DateTime } from 'luxon'

  let organizations: Organization[] = []
  let users: UserListUser[] = []

  export const load: Load = async ({ params }) => {
    const site = await store.refresh(params.id)
    if (!store.siteFetched()) {
      return { status: 404 }
    }
    [organizations, users] = await Promise.all([
      api.getOrganizationList(),
      api.getUserList()
    ])
    siteListStore.open({ id: params.id, name: site.name })
    return {}
  }

  async function getSite (id: string) {
    return await api.getSiteById(id)
  }

  const store = new SiteDetailStore(getSite)
</script>

<script lang="ts">
  import { api, SiteDetailStore, siteListStore, DetailPanel, ensureRequiredNotNull, messageForDialog, type Organization, type UserListUser, userListStore } from '$lib'
  import { base } from '$app/paths'
  let modal: 'editbasic'|'editsitemanagement'|'addcomment'|undefined = undefined

  async function searchUsers (search) {
    const query = search.toLowerCase()
    return users.filter(u => {
      return u.name.toLowerCase().includes(query) || u.id.includes(query)
    }).map(u => ({ label: u.name, value: u.id }))
  }

  async function addComment (state) {
    // TODO
    return { success: true, messages: [], data: {} }
  }

  async function validateBasicInfo (state) {
    const localMessages = ensureRequiredNotNull(state, ['name'])
    if (!localMessages.length) {
      const resp = await api.renameSite($store.site.id, state.name, true)
      return messageForDialog(resp.messages, '')
    }
    return localMessages
  }

  async function renameSite (state) {
    const resp = await api.renameSite($store.site.id, state.name, false)
    if (resp.success) {
      store.refresh($store.site.id)
      modal = undefined
    }
    return { success: resp.success, messages: messageForDialog(resp.messages, ''), data: state }
  }

  async function editSiteManagement (state) {
    const resp = await api.updateSiteManagement($store.site.id, state.organization, state.owner, state.managers)
    if (resp.success) {
      store.refresh($store.site.id)
      modal = undefined
    }
    return { success: resp.success, messages: messageForDialog(resp.messages, 'args'), data: state }
  }
</script>

<DetailPanel header='Basic Information' button={$store.site.permissions.rename ? { icon: pencilIcon, hiddenLabel: 'edit basic information', onClick: () => { modal = 'editbasic' } } : undefined}>
  <div class="row">
    <div class="label">Name:</div>
    <div class="value">{$store.site.name}</div>
  </div>
</DetailPanel>

<DetailPanel header='Launch Information' button={$store.site.permissions.launch ? { icon: pencilIcon, hiddenLabel: 'edit launch URL', onClick: () => {} } : undefined}>
  {#if $store.site.url}
  <div class="row">
    <div class="label">URL:</div>
    <div class="value">{$store.site.url.prefix}</div>
  </div>
  {:else}
    <span>This site is not launched.</span>
  {/if}
</DetailPanel>

<DetailPanel header='Page Trees' button={$store.site.permissions.manageState ? { icon: plusIcon, hiddenLabel: 'add page tree', onClick: () => {} } : undefined}>
  <table>
    <tr class='headers'>
      <th>Name</th>
      <th>Stage</th>
      <td><ScreenReaderOnly>No data</ScreenReaderOnly></td>
    </tr>
    {#each $store.site.pagetrees as pagetree (pagetree.id)}
      <tr>
        <td>{pagetree.name}</td>
        <td>{pagetree.type}</td>
        <td class="pagetree-buttons">
          <button title="Edit"><Icon icon={pencilIcon}/><ScreenReaderOnly>rename page tree</ScreenReaderOnly></button>
          {#if pagetree.type === 'SANDBOX'}
            <button title="Promote to Primary"><Icon icon={applicationExport}/><ScreenReaderOnly>promote page tree</ScreenReaderOnly></button>
          {/if}
          {#if pagetree.type === 'SANDBOX'}
            <button title="Archive"><Icon icon={archiveOutline}/><ScreenReaderOnly>archive page tree</ScreenReaderOnly></button>
          {/if}
          {#if pagetree.type !== 'PRIMARY'}
            <button title="Delete"><Icon icon={deleteOutline}/><ScreenReaderOnly>delete page tree</ScreenReaderOnly></button>
          {/if}
        </td>
      </tr>
    {/each}
  </table>
</DetailPanel>

<DetailPanel header='Site Management' button={$store.site.permissions.manageGovernance ? { icon: pencilIcon, hiddenLabel: 'edit site management', onClick: () => { modal = 'editsitemanagement' } } : undefined}>
  <div class="row">
    <div class="label">Organization:</div>
    <div class="value">{$store.site.organization.name}</div>
  </div>
  <div class="row">
    <div class="label">Owner:</div>
    <div class="value">{$store.site.owner.name} ({$store.site.owner.id})</div>
  </div>
  <div class="row">
    <div class="label">Manager(s):</div>
    <div class="value">
      <ul class='manager-list'>
        {#each $store.site.managers as manager (manager.id)}
        <li>{manager.name} ({manager.id})</li>
        {/each}
      </ul>
    </div>
  </div>
</DetailPanel>

<DetailPanel header="Roles">
  <table>
    <tr>
      <th>Name</th>
      <th>Read-Only</th>
      <th>Universal</th>
    </tr>
    {#each $store.siteRoles as role (role.id)}
      <tr>
        <td><a href={`${base}/auth/roles/${role.id}`}>{role.name}</a></td>
        <td><Icon icon={role.readonly ? checkIcon : minusIcon} hiddenLabel={`${role.name} role has ${role.readonly ? 'read-only' : 'write'} access to this site`}/></td>
        <td><Icon icon={minusIcon} hiddenLabel={`${role.name} is a site-specific role`}/></td>
      </tr>
    {/each}
    {#each $store.globalRoles as role (role.id)}
      <tr>
        <td><a href={`${base}/auth/roles/${role.id}`}>{role.name}</a></td>
        <td><Icon icon={role.readonly ? checkIcon : minusIcon} hiddenLabel={`${role.name} role has ${role.readonly ? 'read-only' : 'write'} access to this site`}/></td>
        <td><Icon icon={checkIcon} hiddenLabel={`${role.name} applies to all sites`}/></td>
      </tr>
    {/each}
  </table>
</DetailPanel>

<DetailPanel header="Users">
  <table>
    <tr>
      <th>Name</th>
      <th>Read-Only</th>
      <th>Source Role(s)</th>
    </tr>
    {#each $store.users as user (user.id)}
      <tr>
        <td><a href={`${base}/auth/users/${user.id}`}>{user.name}</a></td>
        <td><Icon icon={user.readonly ? checkIcon : minusIcon} hiddenLabel={`${user.name} has ${user.readonly ? 'read-only' : 'write'} access to this site`}/></td>
        <td>{user.roles}</td>
      </tr>
    {/each}
  </table>
</DetailPanel>

<DetailPanel header="Groups">
  <table>
    <tr>
      <th>Name</th>
      <th>Read-Only</th>
      <th>Source Role(s)</th>
    </tr>
    {#each $store.groups as group (group.id)}
      <tr>
        <td><a href={`${base}/auth/groups/${group.id}`}>{group.name}</a></td>
        <td><Icon icon={group.readonly ? checkIcon : minusIcon} hiddenLabel={`${group.name} has ${group.readonly ? 'read-only' : 'write'} access to this site`}/></td>
        <td>{group.roles}</td>
      </tr>
    {/each}
  </table>
</DetailPanel>

<DetailPanel header="Available Page Templates"  button={{ icon: plusIcon, hiddenLabel: 'add page template', onClick: () => {} }}>
  <ul>
    {#each $store.site.pageTemplates as template (template.key)}
      <li class="flex-row">
        <div>{template.name}</div>
        {#if template.universal}
           <div>Universal</div>
        {:else}
          <button on:click={() => { }}><Icon icon={deleteOutline} width="1.5em"/></button>
        {/if}
      </li>
    {/each}
  </ul>
</DetailPanel>

<DetailPanel header="Available Component Templates" button={{ icon: plusIcon, hiddenLabel: 'add component template', onClick: () => {} }}>
  <ul>
    {#each $store.site.componentTemplates as template (template.key)}
      <li class="flex-row">
        <div>{template.name}</div>
        {#if template.universal}
           <div>Universal</div>
        {:else}
          <button on:click={() => { }}><Icon icon={deleteOutline} width="1.5em"/></button>
        {/if}
      </li>
    {/each}
  </ul>
</DetailPanel>

<DetailPanel header="Audit" button={{ icon: plusIcon, hiddenLabel: 'add comment', onClick: () => { modal = 'addcomment' } }}>
  {#if $store.site.comments.length}
    <ul>
      {#each $store.site.comments.reverse() as comment (comment.id)}
        <li>
          <div>{comment.comment}</div>
          <div>{comment.createdBy.id} - {DateTime.fromISO(comment.createdAt).toFormat('LLL d yyyy h:mma').replace(/(AM|PM)$/, v => v.toLocaleLowerCase())}</div>
        </li>
      {/each}
    </ul>
  {:else}
    No comments found.
  {/if}
</DetailPanel>
{#if modal === 'addcomment'}
  <FormDialog
    submit={addComment}
    name='addcomment'
    title='Add Comment'
    on:dismiss={() => { modal = undefined }}>
    <FieldText path='comment' label='Comment'/>
  </FormDialog>
{:else if modal === 'editbasic'}
  <FormDialog
    submit={renameSite}
    validate={validateBasicInfo}
    name='editbasic'
    title='Rename Site'
    preload={{ name: $store.site.name }}
    on:dismiss={() => { modal = undefined }}>
    <FieldText path='name' label='Name' required/>
  </FormDialog>
{:else if modal === 'editsitemanagement'}
  <FormDialog
    submit={editSiteManagement}
    name='editsitemanagement'
    title="Edit Site Management"
    preload={{ organization: $store.site.organization.id, owner: $store.site.owner.id, managers: $store.site.managers.map(m => m.id) }}
    on:dismiss={() => { modal = undefined }}>
    <FieldSelect path='organization' label='Organization' choices={organizations.map(o => ({ label: o.name, value: o.id }))}/>
    <FieldSelect path='owner' label='Site Owner' choices={users.map(u => ({ label: u.name, value: u.id }))} />
    <FieldMultiselect path='managers' label='Site Managers' getOptions={searchUsers}/>
  </FormDialog>
{/if}
<style>
  .row {
    display: flex;
    padding: 0.5rem 0;
  }
  .label {
    font-weight: bold;
    width: 25%;
  }
  .manager-list {
    padding-left: 0;
    margin: 0;
    list-style: none;
  }
  ul {
    list-style: none;
    padding-left: 0;
  }
  li {
    border-bottom: 1px dashed #aaa;
    padding: 0.6em 0.3em;
  }
  li:first-child {
    padding-top: 0;
  }
  li.flex-row {
    display: flex;
    justify-content: space-between;
  }
  li.flex-row button {
    border: 0;
    padding: 0;
    background-color: transparent;
  }
  table {
    width: 100%;
    border-collapse: collapse;
  }

  table tr td, table tr th {
    text-align: left;
    padding: 0.4em 0;
  }
  table tr.headers {
    border-bottom: 1px solid #ebebeb;
  }
  table tr { border-bottom: 1px dashed #ebebeb }
  table tr:nth-child(even) { background-color: #f6f7f9 }
  .pagetree-buttons {
    text-align: right;
  }
  td button {
    border: 0;
    padding: 0;
    background-color: transparent;
  }
  td button:not(:last-child) {
    margin-right: 0.5em;
  }
</style>