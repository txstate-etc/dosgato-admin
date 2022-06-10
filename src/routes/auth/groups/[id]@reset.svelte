<script lang="ts" context="module">
  import type { Load } from '@sveltejs/kit'
  import pencilIcon from '@iconify-icons/mdi/pencil'
  import plusIcon from '@iconify-icons/mdi/plus'
  import linkVariantOffIcon from '@iconify-icons/mdi/link-variant-off'
  import FormDialog from '$lib/components/FormDialog.svelte'
  import Dialog from '$lib/components/Dialog.svelte'
  import deleteOutline from '@iconify-icons/mdi/delete-outline'
  import { FieldText, FieldMultiselect, Icon } from '@dosgato/dialog'

  export const load: Load = async ({ params }) => {
    await store.refresh(params.id)
    if (!store.groupFetched()) return { status: 404 }
    return {}
  }

  async function getGroup (id: string) {
    const group = await api.getGroupById(id)
    return group
  }

  const store = new GroupDetailStore(getGroup)
</script>

<script lang="ts">
  import { base } from '$app/paths'
  import { api, GroupDetailStore, DetailPanel, type UserListUser } from '$lib'
  let modal: 'editbasic'|'addmembers'|'addmanagers'|'maynotaddmanagers'|undefined
  let allUsers: UserListUser[]

  $: directMemberIds = $store.group.directMembers.map(m => m.id)
  $: subgroupIds = $store.group.subgroups.map(g => g.id)
  $: supergroupIds = $store.group.supergroups.map(g => g.id)
  $: siteIds = $store.group.sites.map(s => s.id)
  $: directManagerIds = $store.group.directManagers.map(m => m.id)

  async function onEditBasic (state) {
    // TODO
    modal = undefined
    return { success: true, messages: [], data: [] }
  }

  async function searchUsersForMembers (term: string) {
    // TODO: If there's a "trained" flag, do we want to filter out users that don't have that set? Should they be trained before
    // they can be added to a group?
    return allUsers.filter(u => !u.disabled && !directMemberIds.includes(u.id) && (u.name.indexOf(term) > -1 || u.id.indexOf(term) > -1)).map(u => ({ label: `${u.name} (${u.id})`, value: u.id }))
  }

  async function searchUsersForManagers (term: string) {
    return allUsers.filter(u => !u.disabled && !directManagerIds.includes(u.id) && (u.name.indexOf(term) > -1 || u.id.indexOf(term) > -1)).map(u => ({ label: `${u.name} (${u.id})`, value: u.id }))
  }

  async function openAddUsersDialog () {
    allUsers ??= await api.getUserList()
    modal = 'addmembers'
  }

  async function onAddMembers (state) {
    // TODO
    modal = undefined
    return { success: true, messages: [], data: [] }
  }

  async function onAddManagers (state) {
    // TODO
    modal = undefined
    return { success: true, messages: [], data: [] }
  }

  // Takes the indirect member's direct groups and returns those that are subgroups of the group we are inspecting
  function getMemberDirectGroup (groups) {
    return groups.filter(g => subgroupIds.includes(g.id)).map(g => g.name).join(', ')
  }

  function getSitesManaged (managerSites) {
    const relevantSites = managerSites.filter(s => siteIds.includes(s.id))
    return relevantSites.map(s => `${s.name} Manager`).join(', ')
  }

  async function openAddManagersDialog () {
    if (siteIds.length) {
      modal = 'maynotaddmanagers'
    } else {
      allUsers ??= await api.getUserList()
      modal = 'addmanagers'
    }
  }

  function getPrettySiteList () {
    if ($store.group.sites.length === 1) return $store.group.sites[0].name
    if ($store.group.sites.length === 2) return `${$store.group.sites[0].name} and ${$store.group.sites[1].name}`
    else {
      let list: string = ''
      for (let i = 0; i < $store.group.sites.length; i++) {
        list += $store.group.sites[i].name
        if (i < $store.group.sites.length - 1) list += ', '
        if (i === $store.group.sites.length - 1) list += ', and '
      }
      return list
    }
  }

  function getIndirectRoleGroup (role) {
    // This role is an indirect role. It comes from an ancestor group of the group we are inspecting.
    // Look at the role's direct groups to see which one(s) are in the supergroups list
    return role.groups.filter(g => supergroupIds.includes(g.id)).map(g => g.name).join(', ')
  }
</script>

<div class="back-link">
  <a href={`${base}/auth/groups/`}>
    Back to Group List
  </a>
</div>

<DetailPanel header='Basic Information' button={{ icon: pencilIcon, onClick: () => { modal = 'editbasic' } }}>
  <div class="row">
    <div class="label">Name:</div>
    <div class="value">{$store.group.name}</div>
  </div>
</DetailPanel>

<DetailPanel header='Members' button={{ icon: plusIcon, onClick: () => openAddUsersDialog() }} >
  <ul>
  {#each $store.group.directMembers as member (member.id)}
    <li class="flex-row">
      {member.name} ({member.id})
      <button on:click={() => { }}><Icon icon={deleteOutline} width="1.5em"/></button>
    </li>
  {/each}
  {#each $store.group.indirectMembers.filter(m => !directMemberIds.includes(m.id)) as member (member.id)}
    <li class="flex-row">
      {member.name} ({member.id})
      <div>{`Via ${getMemberDirectGroup(member.groups)}`}</div>
    </li>
  {/each}
</ul>
</DetailPanel>

{#if $store.group.subgroups.length}
<DetailPanel header='Subgroups'>
  <ul>
    {#each $store.group.subgroups as group (group.id)}
      <li class="flex-row">
        {group.name}
        {#if (group.parents.map(g => g.id).includes($store.group.id))}
          <button on:click={() => { }}><Icon icon={linkVariantOffIcon} width="1.5em"/></button>
        {:else}
          <div>{`Via ${group.parents.map(g => g.name).join(', ')}`}</div>
        {/if}
      </li>
    {/each}
  </ul>
</DetailPanel>
{/if}

{#if $store.group.supergroups.length}
  <DetailPanel header='Ancestor Groups'>
    {#each $store.group.supergroups as group (group.id)}
    <li class="flex-row">
      {group.name}
    </li>
    {/each}
  </DetailPanel>
{/if}

{#if $store.group.sites.length}
  <DetailPanel header='Sites'>
    <ul>
      {#each $store.group.sites as site (site.id)}
        <li class="flex-row">
          {site.name}
        </li>
      {/each}
    </ul>
  </DetailPanel>
{/if}

<DetailPanel header='Managers' button={{ icon: plusIcon, onClick: () => openAddManagersDialog() }}>
 {#if $store.group.directManagers.length || $store.group.managersThroughSite.length }
  {#each $store.group.directManagers as manager (manager.id)}
    <li class="flex-row">
      {manager.name} ({manager.id})
      <button on:click={() => { }}><Icon icon={deleteOutline} width="1.5em"/></button>
    </li>
  {/each}
  {#each $store.group.managersThroughSite as manager (manager.id)}
    <li class="flex-row">
      {manager.name} ({manager.id})
      <div>{getSitesManaged(manager.sitesManaged)}</div>
    </li>
  {/each}
 {:else}
  <div>{$store.group.name} has no managers.</div>
 {/if}
</DetailPanel>

<DetailPanel header='Roles' button={{ icon: plusIcon, onClick: () => {} } }>
  {#each $store.group.directRoles as role (role.id)}
    <li class="flex-row">
      {role.name}
      <button on:click={() => { }}><Icon icon={deleteOutline} width="1.5em"/></button>
    </li>
  {/each}
  {#each $store.group.rolesThroughParentGroup as role (role.id)}
    <li class="flex-row">
      {role.name}
      <div>{`Via ${getIndirectRoleGroup(role)}`}</div>
    </li>
  {/each}
</DetailPanel>

{#if modal === 'editbasic'}
  <FormDialog
    submit={onEditBasic}
    name='editbasicinfo'
    title= {'Edit Group'}
    preload={{ name: $store.group.name }}
    on:dismiss={() => { modal = undefined }}>
    <FieldText path='name' label='Group Name'></FieldText>
  </FormDialog>
{:else if modal === 'addmembers'}
  <FormDialog
    submit={onAddMembers}
    name="addmembers"
    title={`Add Members to Group ${$store.group.name}`}
    on:dismiss={() => { modal = undefined }}>
    <FieldMultiselect
      path='users'
      label='Add Members'
      getOptions={searchUsersForMembers}/>
  </FormDialog>
{:else if modal === 'addmanagers'}
  <FormDialog
    submit={onAddManagers}
    name="addmanagers"
    title={`Add Managers to Group ${$store.group.name}`}
    on:dismiss={() => { modal = undefined }}>
    <FieldMultiselect
      path='users'
      label='Add Managers'
      getOptions={searchUsersForManagers}/>
  </FormDialog>
{:else if modal === 'maynotaddmanagers'}
  <Dialog
    on:continue={() => { modal = undefined }}>
    <div>
      {`Managers can not be added to a group linked to a site. This group is maintained by the manager(s) of the ${getPrettySiteList()} site${siteIds.length > 1 ? 's' : ''}.` }
    </div>
  </Dialog>
{/if}
<style>
  .back-link {
    display: flex;
    justify-content: flex-end;
    font-size: 1.2em;
  }
  .row {
    display: flex;
    padding: 0.5rem 0;
  }
  .label {
    font-weight: bold;
    width: 25%;
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
</style>
