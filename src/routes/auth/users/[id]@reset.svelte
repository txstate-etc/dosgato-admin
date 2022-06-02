<script lang="ts" context="module">
  import type { Load } from '@sveltejs/kit'
  import pencilIcon from '@iconify-icons/mdi/pencil'
  import plusIcon from '@iconify-icons/mdi/plus'
  import arrowLeft from '@iconify-icons/mdi/arrow-left'
  import deleteOutline from '@iconify-icons/mdi/delete-outline'
  import { Icon, FieldText, FieldDualListbox } from '@dosgato/dialog'
  import FormDialog from '$lib/components/FormDialog.svelte'
  let user: FullUser
  let allUserGroups
  export const load: Load = async ({ params }) => {
    user = await api.getUserById(params.id)
    allUserGroups = [...user.directGroups.map(g => ({ id: g.id, name: g.name })), ...user.indirectGroups.map(g => ({ id: g.id, name: g.name }))]
    console.log(user)
    if (!user) return { status: 404 }
    return {}
  }

</script>

<script lang="ts">
  import { api, type FullUser, type GroupListGroup } from '$lib'
  import { base } from '$app/paths'
  import { DateTime } from 'luxon'
  let modal: 'editbasic'|'editgroups'|'editroles'|undefined
  let allGroups: GroupListGroup[] = []

  function getGroupParents (group) {
    const parents: string[] = []
    for (const g of user.directGroups) {
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

  async function onclickgroups () {
    allGroups = await api.getGroupList()
    modal = 'editgroups'
  }

  async function onUpdateGroups (state) {
    // TODO
    modal = undefined
    return { success: true, messages: [], data: [] }
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
      <div class="value">{user.id}</div>
    </div>
    <div class="row">
      <div class="label">Name:</div>
      <div class="value">{user.name}</div>
    </div>
    <div class="row">
      <div class="label">Email:</div>
      <div class="value">{user.email}</div>
    </div>
    <div class="row">
      <div class="label">Last Login:</div>
      <div class="value">
        {user.lastlogin ? DateTime.fromISO(user.lastlogin).toFormat('LLL d yyyy h:mma').replace(/(AM|PM)$/, v => v.toLocaleLowerCase()) : 'Never'}
      </div>
    </div>
    {#if user.disabledAt}
      <div class="row">
        <div class="label">Inactive Since:</div>
        <div class="value">{DateTime.fromISO(user.disabledAt).toFormat('LLL d yyyy h:mma').replace(/(AM|PM)$/, v => v.toLocaleLowerCase())}</div>
      </div>
    {/if}
  </div>
</div>

<div class="panel">
  <div class="header">
    <div>Group Memberships</div>
    <button class="edit" on:click={onclickgroups}><Icon icon={plusIcon}/></button>
  </div>
  <div class="body">
    {#if user.directGroups.length || user.indirectGroups.length}
      <ul class="groups">
        {#each user.directGroups as group (group.id)}
          <li class="group-row">
            <div>{group.name}</div>
            <button class="leave-group"><Icon icon={deleteOutline} width="1.5em"/></button>
          </li>
        {/each}
        {#each user.indirectGroups as group (group.id)}
          <li class="group-row">
            <div>{group.name}</div>
            <div>{`Membership through ${getGroupParents(group)}`}</div>
          </li>
        {/each}
      </ul>
    {:else}
      <div>User {user.id} is not a member of any groups.</div>
    {/if}
  </div>
</div>

<div class="panel">
  <div class="header">
    <div>Roles</div>
    <button class="edit"><Icon icon={plusIcon}/></button>
  </div>
  <div class="body">
    {#if user.directRoles.length || user.indirectRoles.length}
      <ul class="roles">
        {#each user.directRoles as role (role.id)}
          <li class="role-row">
            {role.name}
            <button class="remove-role"><Icon icon={deleteOutline} width="1.5em"/></button>
          </li>
        {/each}
        {#each user.indirectRoles as role (role.id)}
          <li class="role-row">
            {role.name}
            <div>{`Assigned through ${getIndirectRoleGroup(role)}`}</div>
          </li>
        {/each}
      </ul>
    {:else}
    <div>User {user.id} has no roles assigned.</div>
    {/if}
  </div>
</div>
{#if modal === 'editbasic'}
  <FormDialog
    submit={onEditBasic}
    name='editbasicinfo'
    title= {`Edit ${user.id}`}
    preload={{ name: user.name, email: user.email }}
    on:dismiss={() => { modal = undefined }}>
    <FieldText path='name' label='Full Name'></FieldText>
    <FieldText path='email' label='Email'></FieldText>
  </FormDialog>
{:else if modal === 'editgroups'}
  <FormDialog
    submit={onUpdateGroups}
    name='editgroups'
    title={`Edit groups for ${user.id}`}
    preload={{ groups: user.groups.map(g => g.id) }}
    on:dismiss={() => { modal = undefined }}>
    <FieldDualListbox
      path="groups"
      choices={allGroups.map(g => ({ label: g.name, value: g.id }))}
      selectedLabel={`${user.id} is a member of`}
      sourceLabel='Other available groups'
      multiselect={true}
    />
  </FormDialog>
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