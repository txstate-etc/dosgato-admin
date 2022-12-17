<script lang="ts">
  import { Dialog, Icon, FieldText, FieldMultiselect, FieldCheckbox, FormDialog } from '@dosgato/dialog'
  import pencilIcon from '@iconify-icons/mdi/pencil'
  import plusIcon from '@iconify-icons/mdi/plus'
  import arrowLeft from '@iconify-icons/mdi/arrow-left'
  import deleteOutline from '@iconify-icons/mdi/delete-outline'
  import { DateTime } from 'luxon'
  import { base } from '$app/paths'
  import { api, DetailPanel, StyledList, messageForDialog, ensureRequiredNotNull, type GroupWithParents, type GroupListGroup, type RoleListRole, type FullUser } from '$lib'
  import { _store as store } from './+page'

  export let data: { allGroups: GroupListGroup[], allRoles: RoleListRole[] }

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
    const resp = await api.updateUserInfo($store.user.id, state)
    if (resp.success) store.refresh($store.user.id)
    modal = undefined
    return { success: resp.success, messages: messageForDialog(resp.messages, 'args'), data: state }
  }

  async function validateBasicInfo (state) {
    const localMessages = ensureRequiredNotNull(state, ['lastname', 'email'])
    if (!localMessages.length) {
      const resp = await api.updateUserInfo($store.user.id, state, true)
      return messageForDialog(resp.messages, 'args')
    }
    return localMessages
  }

  async function searchGroups (term: string) {
    return data.allGroups.filter(g => g.name.includes(term)).map(g => ({ label: g.name, value: g.id }))
  }

  async function onAddGroups (state) {
    const resp = await api.setUserGroups($store.user.id, state.groups)
    if (resp.success) {
      store.refresh($store.user.id)
      modal = undefined
    }
    return {
      success: resp.success,
      messages: messageForDialog(resp.messages, ''),
      data: undefined
    }
  }

  async function searchRoles (term: string) {
    const filtered = data.allRoles.filter(r => r.permissions.assign && r.name.includes(term))
    return filtered.map(role => ({ label: role.name, value: role.id }))
  }

  async function onAddRoles (state: { roleIds: string[] }) {
    const resp = await api.addRolesToUser(state.roleIds, $store.user.id)
    if (resp.success) {
      store.refresh($store.user.id)
      modal = undefined
    }
    return { ...resp, data: state }
  }

  function onRemoveRole (role: FullUser['directRoles'][number]) {
    return async () => {
      const resp = await api.removeRoleFromUser(role.id, $store.user.id)
      if (resp.success) store.refresh($store.user.id)
    }
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

<DetailPanel header='Basic Information' button={$store.user.permissions.update ? { icon: pencilIcon, onClick: () => { modal = 'editbasic' } } : undefined}>
  <div class="row">
    <div class="label">Login:</div>
    <div class="value">{$store.user.id}</div>
  </div>
  {#if !$store.user.system}
  <div class="row">
    <div class="label">First Name:</div>
    <div class="value">{$store.user.firstname}</div>
  </div>
  {/if}
  <div class="row">
    <div class="label">{#if $store.user.system}Name{:else}Last Name{/if}:</div>
    <div class="value">{$store.user.lastname}</div>
  </div>
  <div class="row">
    <div class="label">Email:</div>
    <div class="value">{$store.user.email}</div>
  </div>
  <div class="row">
    <div class="label">Trained:</div>
    <div class="value">{$store.user.trained ? 'Yes' : 'No'}</div>
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
</DetailPanel>

<DetailPanel header='Group Memberships' button={{ icon: plusIcon, onClick: () => { modal = 'editgroups' } }}>
  {#if $store.user.directGroups.length || $store.user.indirectGroups.length}
    <StyledList>
      {#each $store.user.directGroups as group (group.id)}
        <li class="flex-row">
          <a href={`${base}/auth/groups/${group.id}`}>{group.name}</a>
          <button class="leave-group" on:click={() => { groupLeaving = group; modal = 'removefromgroup' }}><Icon icon={deleteOutline} width="1.5em"/></button>
        </li>
      {/each}
      {#each $store.user.indirectGroups as group (group.id)}
        <li class="flex-row">
          <a href={`${base}/auth/groups/${group.id}`}>{group.name}</a>
          <div>{`Via ${getGroupParents(group)}`}</div>
        </li>
      {/each}
    </StyledList>
  {:else}
    <div>User {$store.user.id} is not a member of any groups.</div>
  {/if}
</DetailPanel>

<DetailPanel header='Roles' button={data.allRoles.some(r => r.permissions.assign) ? { icon: plusIcon, onClick: () => { modal = 'editroles' } } : undefined}>
  {#if $store.user.directRoles.length || $store.user.indirectRoles.length}
    <StyledList>
      {#each $store.user.directRoles as role (role.id)}
        <li class="flex-row">
          {role.name}
          <button class="remove-role" disabled={!role.permissions.assign} on:click={onRemoveRole(role)}><Icon icon={deleteOutline} width="1.5em"/></button>
        </li>
      {/each}
      {#each $store.user.indirectRoles as role (role.id)}
        <li class="flex-row">
          {role.name}
          <div>{`Via ${getIndirectRoleGroup(role)}`}</div>
        </li>
      {/each}
      </StyledList>
  {:else}
  <div>User {$store.user.id} has no roles assigned.</div>
  {/if}
</DetailPanel>

{#if Object.keys($store.sites).length || $store.permittedOnAllSites.length}
  <DetailPanel header='Sites'>
    <StyledList>
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
    </StyledList>
  </DetailPanel>
{/if}

<DetailPanel header='Global Data'></DetailPanel>

{#if modal === 'editbasic'}
  <FormDialog
    submit={onEditBasic}
    validate={validateBasicInfo}
    name='editbasicinfo'
    title= {`Edit ${$store.user.id}`}
    preload={{ firstname: $store.user.firstname, lastname: $store.user.lastname, email: $store.user.email, trained: $store.user.trained }}
    on:escape={() => { modal = undefined }}>
    {#if !$store.user.system}
      <FieldText path='firstname' label='First Name' required={true}/>
    {/if}
    <FieldText path='lastname' label={`${$store.user.system ? 'Name' : 'Last Name'}`} required={true}/>
    <FieldText path='email' label='Email' required={true}/>
    <FieldCheckbox path='trained' label='Trained' defaultValue={false} boxLabel='User has received training'/>
  </FormDialog>
{:else if modal === 'editgroups'}
  <FormDialog
    submit={onAddGroups}
    name='editgroups'
    title={`Edit groups for ${$store.user.id}`}
    preload={{ groups: $store.user.directGroups.map(g => g.id) }}
    on:escape={() => { modal = undefined }}>
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
    on:escape={() => { modal = undefined; groupLeaving = undefined }}>
    Remove user {$store.user.id} from group {groupLeaving ? groupLeaving.name : ''}?
  </Dialog>
{:else if modal === 'editroles'}
  <FormDialog
    submit={onAddRoles}
    name='editroles'
    title={`Edit roles for ${$store.user.id}`}
    on:escape={() => { modal = undefined }}>
    <FieldMultiselect
      path='roleIds'
      label='Add Roles'
      getOptions={searchRoles}/>
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
</style>
