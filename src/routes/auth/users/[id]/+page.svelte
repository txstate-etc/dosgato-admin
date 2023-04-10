<script lang="ts">

  import { Dialog, Icon, FieldText, FieldMultiselect, FieldCheckbox, FormDialog } from '@dosgato/dialog'
  import pencilIcon from '@iconify-icons/mdi/pencil'
  import plusIcon from '@iconify-icons/ph/plus'
  import deleteIcon from '@iconify-icons/ph/trash'
  import { DateTime } from 'luxon'
  import { base } from '$app/paths'
  import { api, Accordion, DetailList, DetailPageContent, DetailPanel, DetailPanelSection, StyledList, messageForDialog, ensureRequiredNotNull, type GroupWithParents, type GroupListGroup, type RoleListRole, type FullUser, BackButton, type DetailPanelButton } from '$lib'
  import { _store as store } from './+page'
  import { unique } from 'txstate-utils'
  import SortableTable from '$lib/components/table/SortableTable.svelte'


  export let data: { allGroups: GroupListGroup[], allRoles: RoleListRole[] }

  let modal: 'editbasic' | 'editgroups' | 'editroles' | 'removefromgroup' | 'removerole' | undefined

  const panelHeaderColor = '#BCD2CA'

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

  function onSaved () {
    store.refresh($store.user.id)
    modal = undefined
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
    return data.allGroups.filter(g => {
      return g.name.includes(term)
    }).map(g => ({ label: g.name, value: g.id }))
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

  async function onRemoveRole (state) {
    if (!$store.roleRemoving) return
    const resp = await api.removeRoleFromUser($store.roleRemoving.id, $store.user.id)
    console.log(resp)
    if (resp.success) {
      store.resetRoleRemoving()
      onSaved()
    }
    return { ...resp, data: state }
  }

  async function onRemoveFromGroup (state) {
    if (!$store.groupRemoving) return
    const resp = await api.removeUserFromGroup($store.user.id, $store.groupRemoving.id)
    if (resp.success) {
      store.resetGroupRemoving()
      onSaved()
    }
    return { ...resp, data: state }
  }

  function onClickRemoveGroup (groupId, groupName) {
    store.setGroupRemoving(groupId, groupName)
    modal = 'removefromgroup'
  }

  function onClickRemoveRole (roleId, roleName) {
    store.setRoleRemoving(roleId, roleName)
    modal = 'removerole'
  }

</script>

<DetailPageContent>

  <BackButton destination="user list" url={`${base}/auth/users/`}/>

  <div class="panel-grid">
    <div class="grid-item">
      <DetailPanel header='Basic Information' headerColor={panelHeaderColor} button={$store.user.permissions.update ? [{ icon: pencilIcon, onClick: () => { modal = 'editbasic' } }, { icon: plusIcon, onClick: () => { modal = 'editgroups' } }] : undefined}>
        <DetailPanelSection>
          <DetailList records={{
            'First Name': $store.user.system ? ' ' : $store.user.firstname,
            'Last Name': $store.user.lastname,
            Login: $store.user.id,
            Email: $store.user.email,
            Trained: $store.user.trained ? 'Yes' : 'No',
            'Last Login': $store.user.lastlogin ? DateTime.fromISO($store.user.lastlogin).toFormat('LLL d yyyy h:mma').replace(/(AM|PM)$/, v => v.toLocaleLowerCase()) : 'Never',
            'Inactive Since': $store.user.disabledAt ? DateTime.fromISO($store.user.disabledAt).toFormat('LLL d yyyy h:mma').replace(/(AM|PM)$/, v => v.toLocaleLowerCase()) : ''
          }} />
        </DetailPanelSection>
        <DetailPanelSection hasBackground addTopBorder>
          <Accordion title="Group Memberships">
            {#if $store.user.directGroups.length}
              <SortableTable items={$store.user.directGroups}
                headers={[{ id: 'name', label: 'Group name', sortable: true, render: (item) => `<a href="${base}/auth/groups/${item.id}">${item.name}</a>` }, { id: 'remove', label: 'Remove', actions: [{ icon: deleteIcon, hiddenLabel: 'Remove user from group', label: 'Delete', onClick: (item) => { onClickRemoveGroup(item.id, item.name) } }] }]}/>
            {:else}
              <div>User {$store.user.id} is not a member of any groups.</div>
            {/if}
            {#if $store.user.indirectGroups.length}
              <SortableTable items={$store.user.indirectGroups}
                headers={[{ id: 'name', label: 'Indirect group name', sortable: true, render: (item) => `<a href="${base}/auth/groups/${item.id}">${item.name}</a>` }, { id: 'relationship', label: 'Via group', render: (item) => getGroupParents(item) }]}/>
            {/if}
          </Accordion>
        </DetailPanelSection>
      </DetailPanel>
    </div>

    <div class="grid-item">
      <DetailPanel header='Sites' headerColor={panelHeaderColor}>
        <DetailPanelSection>
          {#if $store.sites.length}
            <SortableTable items={$store.sites}
            headers={[
              { id: 'name', label: 'Site name', get: 'name' },
              { id: 'permissions', label: 'Permissions', render: item => `<div>${item.permissions.join(', ')}</div>` }
            ]}
              />
          {:else}
            <div>User {$store.user.id} has no permissions on sites.</div>
          {/if}
        </DetailPanelSection>
      </DetailPanel>
    </div>

    <div class="grid-item">
      <DetailPanel header='Roles' headerColor={panelHeaderColor} button={data.allRoles.some(r => r.permissions.assign) ? { icon: plusIcon, onClick: () => { modal = 'editroles' } } : undefined}>
        <DetailPanelSection>
          {#if $store.user.directRoles.length}
            <SortableTable items = {$store.user.directRoles}
              headers={[
                { id: 'name', label: 'Role name', render: (item) => `<a href="${base}/auth/roles/${item.id}">${item.name}</a>` },
                { id: 'remove', label: 'Remove', actions: [{ icon: deleteIcon, hiddenLabel: 'Remove role from user', label: 'Delete', onClick: (item) => { onClickRemoveRole(item.id, item.name) } }] }
              ]} />
          {:else}
          <div>User {$store.user.id} has no roles assigned.</div>
          {/if}
          {#if $store.user.indirectRoles.length}
            <SortableTable items = {$store.user.indirectRoles}
              headers={[
                { id: 'name', label: 'Inherited role name', render: (item) => `<a href="${base}/auth/roles/${item.id}">${item.name}</a>` },
                { id: 'origin', label: 'Inherited from', render: (item) => getIndirectRoleGroup(item) }
              ]} />
          {/if}
        </DetailPanelSection>
      </DetailPanel>
    </div>
    <div class="grid-item last">
      <DetailPanel header='Global Data' headerColor={panelHeaderColor}>
        <DetailPanelSection></DetailPanelSection>
      </DetailPanel>
    </div>
  </div>
</DetailPageContent>

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
    on:escape={() => { modal = undefined; $store.groupRemoving = undefined }}>
    Remove user {$store.user.id} from group {$store.groupRemoving?.name ?? ''}?
  </Dialog>
{:else if modal === 'removerole'}
  <Dialog
    title='Remove Role'
    continueText='Remove'
    cancelText='Cancel'
    on:continue={onRemoveRole}
    on:escape={() => { modal = undefined; $store.roleRemoving = undefined }}>
    Remove role {$store.roleRemoving?.name ?? ''} from user {$store.user.id}?
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
  .panel-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 1em;
  }
  .grid-item.last {
    grid-column-start: 1;
    grid-column-end: span 3;
  }
  :global([data-eq~="800px"]) .panel-grid {
    grid-template-columns: 1fr;
  }
  :global([data-eq~="800px"]) .grid-item.last {
    grid-column-start: auto;
    grid-column-end: auto;
  }
</style>
