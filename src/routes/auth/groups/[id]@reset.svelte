<script lang="ts" context="module">
  import type { Load } from '@sveltejs/kit'
  import pencilIcon from '@iconify-icons/mdi/pencil'
  import plusIcon from '@iconify-icons/mdi/plus'
  import FormDialog from '$lib/components/FormDialog.svelte'
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
  let modal: 'editbasic'|'addmembers'|undefined
  let allUsers: UserListUser[]

  $: directMemberIds = $store.group.directMembers.map(m => m.id)
  $: subgroupIds = $store.group.subgroups.map(g => g.id)

  async function onEditBasic (state) {
    // TODO
    modal = undefined
    return { success: true, messages: [], data: [] }
  }

  async function searchUsers (term: string) {
    // TODO: If there's a "trained" flag, do we want to filter out users that don't have that set? Should they be trained before
    // they can be added to a group?
    return allUsers.filter(u => !u.disabled && !directMemberIds.includes(u.id) && (u.name.indexOf(term) > -1 || u.id.indexOf(term) > -1)).map(u => ({ label: `${u.name} (${u.id})`, value: u.id }))
  }

  async function openAddUsersDialog () {
    allUsers = await api.getUserList()
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

<DetailPanel header='Subgroups'>
  <ul>
    {#each $store.group.subgroups as group (group.id)}
      <li class="flex-row">
        {group.name}
        {#if !(group.parents.map(g => g.id).includes($store.group.id))}
          <div>{`Via ${group.parents.map(g => g.name).join(', ')}`}</div>
        {/if}
      </li>
    {/each}
  </ul>
</DetailPanel>

<DetailPanel header='Sites'>
  <ul>
    {#each $store.group.sites as site (site.id)}
      <li class="flex-row">
        {site.name}
      </li>
    {/each}
  </ul>
</DetailPanel>

<DetailPanel header='Managers'>

</DetailPanel>

<DetailPanel header='Roles'></DetailPanel>

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
      getOptions={searchUsers}
    />
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
