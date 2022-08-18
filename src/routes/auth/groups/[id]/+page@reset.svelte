<script lang="ts">
  import pencilIcon from '@iconify-icons/mdi/pencil'
  import plusIcon from '@iconify-icons/mdi/plus'
  import linkVariantOffIcon from '@iconify-icons/mdi/link-variant-off'
  import FormDialog from '$lib/components/FormDialog.svelte'
  import deleteOutline from '@iconify-icons/mdi/delete-outline'
  import { FieldText, FieldMultiselect, Icon } from '@dosgato/dialog'
  import { base } from '$app/paths'
  import { api, DetailPanel, type UserListUser } from '$lib'
  import { store } from './+page'
  let modal: 'editbasic'|'addmembers'|undefined
  let allUsers: UserListUser[]

  $: directMemberIds = $store.group.directMembers.map(m => m.id)
  $: subgroupIds = $store.group.subgroups.map(g => g.id)
  $: supergroupIds = $store.group.supergroups.map(g => g.id)

  async function onEditBasic (state) {
    const resp = await api.editGroup($store.group.id, state.name)
    if (resp.success) {
      store.refresh($store.group.id)
      modal = undefined
    }
    return { success: resp.success, messages: resp.messages.map(m => ({ path: m.arg, type: m.type, message: m.message })), data: state }
  }

  async function searchUsersForMembers (term: string) {
    // TODO: If there's a "trained" flag, do we want to filter out users that don't have that set? Should they be trained before
    // they can be added to a group?
    return allUsers.filter(u => !u.disabled && !directMemberIds.includes(u.id) && (u.name.indexOf(term) > -1 || u.id.indexOf(term) > -1)).map(u => ({ label: `${u.name} (${u.id})`, value: u.id }))
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

  // Takes the indirect member's direct groups and returns those that are subgroups of the group we are inspecting
  function getMemberDirectGroup (groups) {
    return groups.filter(g => subgroupIds.includes(g.id)).map(g => g.name).join(', ')
  }

  function getIndirectRoleGroup (role) {
    // This role is an indirect role. It comes from an ancestor group of the group we are inspecting.
    // Look at the role's direct groups to see which one(s) are in the supergroups list
    return role.groups.filter(g => supergroupIds.includes(g.id)).map(g => g.name).join(', ')
  }

  async function validateGroupName (state) {
    if (state.name) {
      const resp = await api.editGroup($store.group.id, state.name, true)
      return resp.messages.map(m => ({ path: m.arg, type: m.type, message: m.message }))
    } else {
      return []
    }
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
  {#if $store.group.directMembers.length || $store.group.indirectMembers.length}
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
  {:else}
    <div>{$store.group.name} has no members.</div>
  {/if}
</DetailPanel>

{#if $store.group.subgroups.length}
<DetailPanel header='Subgroups'>
  <ul>
    {#each $store.group.subgroups as group (group.id)}
      <li class="flex-row">
        <a href={`${base}/auth/groups/${group.id}`}>{group.name}</a>
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
      <a href={`${base}/auth/groups/${group.id}`}>{group.name}</a>
    </li>
    {/each}
  </DetailPanel>
{/if}

<DetailPanel header='Roles' button={{ icon: plusIcon, onClick: () => {} } }>
  <ul>
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
  </ul>
</DetailPanel>

{#if Object.keys($store.sites).length || $store.permittedOnAllSites.length}
  <DetailPanel header='Sites'>
    <ul class="sites">
      {#if $store.permittedOnAllSites.length}
        <li class="flex-row">
          All Sites
          <div>{$store.permittedOnAllSites.join(', ')}</div>
        </li>
      {/if}
      {#each Object.keys($store.sites) as site (site)}
        <li class="flex-row">
          {site}
          <div>{$store.sites[site].join(', ')}</div>
        </li>
      {/each}
    </ul>
  </DetailPanel>
{/if}

{#if modal === 'editbasic'}
  <FormDialog
    submit={onEditBasic}
    validate={validateGroupName}
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
