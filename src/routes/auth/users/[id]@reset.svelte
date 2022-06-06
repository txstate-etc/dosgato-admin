<script lang="ts" context="module">
  import type { Load } from '@sveltejs/kit'
  import pencilIcon from '@iconify-icons/mdi/pencil'
  import plusIcon from '@iconify-icons/mdi/plus'
  import arrowLeft from '@iconify-icons/mdi/arrow-left'
  import deleteOutline from '@iconify-icons/mdi/delete-outline'
  import { Icon, FieldText, FieldMultiselect } from '@dosgato/dialog'
  import FormDialog from '$lib/components/FormDialog.svelte'
  import Dialog from '$lib/components/Dialog.svelte'

  let allGroups: GroupListGroup[] = []
  export const load: Load = async ({ params }) => {
    await store.refresh(params.id)
    if (!store.userFetched()) return { status: 404 }
    allGroups = await api.getAllGroups()
    return {}
  }

  async function getUser (id: string) {
    const user = await api.getUserById(id)
    return user
  }

  const store = new UserDetailStore(getUser)
</script>

<script lang="ts">
  import { api, UserDetailStore, type GroupWithParents, type GroupListGroup } from '$lib'
  import { base } from '$app/paths'
  import { DateTime } from 'luxon'
  let modal: 'editbasic'|'editgroups'|'editroles'|'removefromgroup'|undefined
  let groupLeaving: GroupWithParents|undefined = undefined

  $: allUserGroups = [...$store.user.directGroups, ...$store.user.indirectGroups]

  function getGroupParents (group) {
    const parents: string[] = []
    for (const g of allUserGroups) {
      if (g.parents.find(p => p.id === group.id)) {
        parents.push(g.name)
      }
    }
    return parents.join(', ')
  }

  function getIndirectRoleGroup (role) {
    const relevantGroups = role.groups.filter(g => {
      return allUserGroups.find(ug => ug.id === g.id)
    })
    return relevantGroups.map(g => g.name).join(', ')
  }

  async function onEditBasic (state) {
    // TODO
    modal = undefined
    return { success: true, messages: [], data: [] }
  }

  async function searchGroups (term: string) {
    const directGroupIds = $store.user.directGroups.map(g => g.id)
    return allGroups.filter(g => !directGroupIds.includes(g.id) && g.name.indexOf(term) > -1).map(g => ({ label: g.name, value: g.id }))
  }

  async function onAddGroups (state) {
    const resp = await api.addUserToGroups($store.user.id, state.groups)
    if (resp.success) {
      store.refresh($store.user.id)
      modal = undefined
    }
    // TODO: What should be returned in data?
    return { success: resp.success, messages: resp.messages, data: {} }
  }

  async function onRemoveFromGroup () {
    if (!groupLeaving) return
    const resp = await api.removeUserFromGroup($store.user.id, groupLeaving.id)
    if (resp.success) {
      store.refresh($store.user.id)
    }
    groupLeaving = undefined
    modal = undefined
  }


</script>

<div class="back-link">
  <a href={`${base}/auth/users/`}>
    <Icon icon={arrowLeft}/>
    Back to User List
  </a>
</div>

<div class="panel">
  <div class="header">
    <div>Basic Information</div>
    <button class="edit" on:click={() => { modal = 'editbasic' }}><Icon icon={pencilIcon}/></button>
  </div>
  <div class="body">
    <div class="row">
      <div class="label">Login:</div>
      <div class="value">{$store.user.id}</div>
    </div>
    <div class="row">
      <div class="label">Name:</div>
      <div class="value">{$store.user.name}</div>
    </div>
    <div class="row">
      <div class="label">Email:</div>
      <div class="value">{$store.user.email}</div>
    </div>
    <div class="row">
      <div class="label">Last Login:</div>
      <div class="value">
        {$store.user.lastlogin ? DateTime.fromISO($store.user.lastlogin).toFormat('LLL d yyyy h:mma').replace(/(AM|PM)$/, v => v.toLocaleLowerCase()) : 'Never'}
      </div>
    </div>
    {#if $store.user.disabledAt}
      <div class="row">
        <div class="label">Inactive Since:</div>
        <div class="value">{DateTime.fromISO($store.user.disabledAt).toFormat('LLL d yyyy h:mma').replace(/(AM|PM)$/, v => v.toLocaleLowerCase())}</div>
      </div>
    {/if}
  </div>
</div>

<div class="panel">
  <div class="header">
    <div>Group Memberships</div>
    <button class="edit" on:click={() => { modal = 'editgroups' }}><Icon icon={plusIcon}/></button>
  </div>
  <div class="body">
    {#if $store.user.directGroups.length || $store.user.indirectGroups.length}
      <ul class="groups">
        {#each $store.user.directGroups as group (group.id)}
          <li class="group-row">
            <div>{group.name}</div>
            <button class="leave-group" on:click={() => { groupLeaving = group; modal = 'removefromgroup' }}><Icon icon={deleteOutline} width="1.5em"/></button>
          </li>
        {/each}
        {#each $store.user.indirectGroups as group (group.id)}
          <li class="group-row">
            <div>{group.name}</div>
            <div>{`Via ${getGroupParents(group)}`}</div>
          </li>
        {/each}
      </ul>
    {:else}
      <div>User {$store.user.id} is not a member of any groups.</div>
    {/if}
  </div>
</div>

<div class="panel">
  <div class="header">
    <div>Roles</div>
    <button class="edit"><Icon icon={plusIcon}/></button>
  </div>
  <div class="body">
    {#if $store.user.directRoles.length || $store.user.indirectRoles.length}
      <ul class="roles">
        {#each $store.user.directRoles as role (role.id)}
          <li class="role-row">
            {role.name}
            <button class="remove-role"><Icon icon={deleteOutline} width="1.5em"/></button>
          </li>
        {/each}
        {#each $store.user.indirectRoles as role (role.id)}
          <li class="role-row">
            {role.name}
            <div>{`Via ${getIndirectRoleGroup(role)}`}</div>
          </li>
        {/each}
      </ul>
    {:else}
    <div>User {$store.user.id} has no roles assigned.</div>
    {/if}
  </div>
</div>
{#if modal === 'editbasic'}
  <FormDialog
    submit={onEditBasic}
    name='editbasicinfo'
    title= {`Edit ${$store.user.id}`}
    preload={{ name: $store.user.name, email: $store.user.email }}
    on:dismiss={() => { modal = undefined }}>
    <FieldText path='name' label='Full Name'></FieldText>
    <FieldText path='email' label='Email'></FieldText>
  </FormDialog>
{:else if modal === 'editgroups'}
  <FormDialog
    submit={onAddGroups}
    name='editgroups'
    title={`Edit groups for ${$store.user.id}`}
    on:dismiss={() => { modal = undefined }}>
    <FieldMultiselect
      path='groups'
      label='Add Groups'
      getOptions={searchGroups}
    />
  </FormDialog>
{:else if modal === 'removefromgroup'}
  <Dialog
    title='Remove from Group'
    continueText='Remove'
    cancelText='Cancel'
    on:continue={onRemoveFromGroup}
    on:dismiss={() => { modal = undefined; groupLeaving = undefined }}>
    Remove user {$store.user.id} from group {groupLeaving ? groupLeaving.name : ''}?
  </Dialog>
{/if}

<style>
  .back-link {
    display: flex;
    justify-content: flex-end;
    font-size: 1.2em;
  }
  .panel {
    width: 50%;
    margin: 0 auto 3em auto;
  }
  .header {
    background-color: #00507A;
    color: #fff;
    display: flex;
    justify-content: space-between;
    padding: 0.8em 1em;
    font-weight: bold;
  }
  .header button.edit {
    color: white;
    background: transparent;
    border: 0;
  }
  .body {
    border: 1px solid #666;
    border-top-width: 0;
    padding: 0.8em 1em;
  }
  .body .row {
    display: flex;
    padding: 0.5rem 0;
  }
  .body .label {
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
  li.group-row, li.role-row {
    display: flex;
    justify-content: space-between;
  }
  .leave-group, .remove-role {
    border: 0;
    padding: 0;
    background-color: transparent;
  }
</style>