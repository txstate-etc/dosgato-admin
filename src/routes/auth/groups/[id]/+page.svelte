<script lang="ts">
  import pencilIcon from '@iconify-icons/mdi/pencil'
  import plusIcon from '@iconify-icons/ph/plus'
  import deleteIcon from '@iconify-icons/ph/trash'
  import { Dialog, FieldText, FieldMultiselect, FieldSelect, FormDialog } from '@dosgato/dialog'
  import { base } from '$app/paths'
  import { api, BackButton, DetailList, DetailPanel, DetailPanelSection, messageForDialog, StyledList, type RoleListRole, type UserListUser } from '$lib'
  import { _store as store } from './+page'
  import { MessageType } from '@txstate-mws/svelte-forms'
  import DetailPageContent from '$lib/components/DetailPageContent.svelte'
  import SortableTable from '$lib/components/table/SortableTable.svelte'
  let modal: 'editbasic' | 'addmembers' | 'removegroupmember' | 'addrole' | 'removerole' | undefined
  let allUsers: UserListUser[]
  let allRoles: RoleListRole[]

  const panelHeaderColor = '#007096'

  $: directMemberIds = $store.group.directMembers.map(m => m.id)
  $: subgroupIds = $store.group.subgroups.map(g => g.id)
  $: supergroupIds = $store.group.supergroups.map(g => g.id)
  $: directRoleIds = $store.group.directRoles.map(r => r.id)

  async function onEditBasic (state) {
    const resp = await api.editGroup($store.group.id, state.name)
    return {
      success: resp.success,
      messages: resp.messages.map(m => ({ path: m.arg, type: m.type, message: m.message })),
      data: resp.success
        ? { name: resp.group!.name }
        : undefined
    }
  }

  async function validateBasic (state) {
    const resp = await api.editGroup($store.group.id, state.name, true)
    return messageForDialog(resp.messages, '')
  }

  async function searchUsersForMembers (term: string) {
    term = term.toLowerCase()
    return allUsers.filter(u => !u.disabled && (u.name.toLowerCase().includes(term) || u.id.includes(term))).map(u => ({ label: `${u.name} (${u.id})`, value: u.id }))
  }

  async function openAddUsersDialog () {
    allUsers ??= await api.getUserList({ enabled: true })
    modal = 'addmembers'
  }

  async function onAddMembers (state) {
    const resp = await api.setGroupUsers($store.group.id, state.users)
    return {
      success: resp.success,
      messages: messageForDialog(resp.messages, ''),
      data: state
    }
  }

  let groupMemberRemovingId: string | undefined = undefined

  function onClickRemoveGroupMember (id: string) {
    groupMemberRemovingId = id
    modal = 'removegroupmember'
  }

  async function onRemoveGroupMember (state) {
    if (!groupMemberRemovingId) return { success: false, messages: [{ type: MessageType.ERROR, message: 'Something went wrong' }], data: state }
    const resp = await api.removeMemberFromGroup($store.group.id, groupMemberRemovingId)
    if (resp.success) {
      groupMemberRemovingId = undefined
      onSaved()
    }
    return { success: resp.success, messages: messageForDialog(resp.messages, ''), data: undefined }
  }

  // Takes the indirect member's direct groups and returns those that are subgroups of the group we are inspecting
  function getMemberDirectGroup (groups) {
    return groups.filter(g => subgroupIds.includes(g.id)).map(g => g.name).join(', ')
  }

  function renderIndirectRoleGroups (role) {
    // This role is an indirect role. It comes from an ancestor group of the group we are inspecting.
    // Look at the role's direct groups to see which one(s) are in the supergroups list
    return role.groups.filter(g => supergroupIds.includes(g.id)).map(g => `<a href="${base}/auth/groups/${g.id}">${g.name}</a>`).join(', ')
  }

  async function openAddRoleDialog () {
    allRoles ??= await api.getRoleList()
    modal = 'addrole'
  }

  async function onAddRole (state) {
    const resp = await api.addRoleToGroups(state.role, [$store.group.id])
    return {
      success: resp.success,
      messages: messageForDialog(resp.messages, ''),
      data: state
    }
  }

  let roleRemovingId: string | undefined = undefined

  function onClickRemoveRole (id: string) {
    roleRemovingId = id
    modal = 'removerole'
  }

  async function onRemoveRole (state) {
    if (!roleRemovingId) return { success: false, messages: [{ type: MessageType.ERROR, message: 'Something went wrong' }], data: state }
    const resp = await api.removeRoleFromGroup(roleRemovingId, $store.group.id)
    if (resp.success) {
      roleRemovingId = undefined
      onSaved()
    }
    return { success: resp.success, messages: messageForDialog(resp.messages, ''), data: undefined }
  }

  function onSaved () {
    store.refresh($store.group.id)
    modal = undefined
  }
</script>

<DetailPageContent>
  <BackButton destination="group list" url={`${base}/auth/groups/`}/>
  <div class="panel-grid">
    <div class="vertical-group">
      <DetailPanel header='Basic Information' headerColor={panelHeaderColor} button={{ icon: pencilIcon, onClick: () => { modal = 'editbasic' } }}>
        <DetailPanelSection>
          <DetailList records={{ Name: $store.group.name }}/>
        </DetailPanelSection>
        {#if $store.group.subgroups.length}
          <DetailPanelSection>
            <SortableTable items={$store.group.subgroups}
              headers={[
                { id: 'name', label: 'Subgroup', render: (item) => `<a href="${base}/auth/groups/${item.id}">${item.name}</a>`, sortable: true },
                { id: 'parents', label: 'Subgroup parent', render: (item) => item.parents.map(g => g.name).join(', ') }
              ]}/>
          </DetailPanelSection>
        {/if}
      </DetailPanel>

      <DetailPanel header='Roles' headerColor={panelHeaderColor} button={{ icon: plusIcon, onClick: () => { openAddRoleDialog() } } }>
        <DetailPanelSection>
          {#if $store.group.directRoles.length}
            <SortableTable items={$store.group.directRoles}
              headers={[
                { id: 'name', label: 'Assigned Role Names', render: (item) => `<a href="${base}/auth/roles/${item.id}">${item.name}</a>`, sortable: true },
                { id: 'remove', label: 'Remove', actions: [{ icon: deleteIcon, label: 'Delete', onClick: (item) => onClickRemoveRole(item.id) }] }
              ]}/>
          {:else}
            <span>This group has no assigned roles.</span>
          {/if}
          {#if $store.group.rolesThroughParentGroup.length}
            <SortableTable items={$store.group.rolesThroughParentGroup}
              headers={[
                { id: 'name', label: 'Inherited Role Names', render: (item) => `<a href="${base}/auth/roles/${item.id}">${item.name}</a>`, sortable: true },
                { id: 'source', label: 'From group', render: (item) => renderIndirectRoleGroups(item) }
              ]}/>
          {/if}
        </DetailPanelSection>
      </DetailPanel>

      {#if Object.keys($store.sites).length}
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
              <div>Group {$store.group.name} has no permissions on sites.</div>
            {/if}
          </DetailPanelSection>
        </DetailPanel>
      {/if}
    </div>
    <div>
      <DetailPanel header='Members' headerColor={panelHeaderColor} button={{ icon: plusIcon, onClick: () => openAddUsersDialog() }} >
        <DetailPanelSection>
          {#if $store.group.directMembers.length}
            <SortableTable items={$store.group.directMembers}
              headers={[
                { id: 'name', label: 'Member names', render: (item) => `<a href="${base}/auth/users/${item.id}">${item.firstname} ${item.lastname}</a> (${item.id})`, sortable: true, sortFunction: (item) => item.lastname },
                { id: 'remove', label: 'Remove', actions: [{ icon: deleteIcon, label: 'Delete', onClick: (item) => onClickRemoveGroupMember(item.id) }] }
              ]}/>
          {:else}
            <span>This group has no directly assigned members.</span>
          {/if}
          {#if $store.group.indirectMembers.filter(m => !directMemberIds.includes(m.id)).length}
          <SortableTable items={$store.group.indirectMembers.filter(m => !directMemberIds.includes(m.id))}
                  headers={[
                    { id: 'name', label: 'Inherited members', render: (item) => `<a href="${base}/auth/users/${item.id}">${item.firstname} ${item.lastname}</a> (${item.id})`, sortable: true, sortFunction: (item) => item.lastname },
                    { id: 'remove', label: 'From group', render: (item) => getMemberDirectGroup(item.groups) }
                ]}/>
          {/if}
        </DetailPanelSection>
      </DetailPanel>
    </div>
  </div>

</DetailPageContent>

{#if modal === 'editbasic'}
  <FormDialog
    submit={onEditBasic}
    validate={validateBasic}
    name='editbasicinfo'
    title= {'Edit Group'}
    preload={{ name: $store.group.name }}
    on:escape={() => { modal = undefined }}
    on:saved={onSaved}>
    <FieldText path='name' label='Group Name' required></FieldText>
  </FormDialog>
{:else if modal === 'addmembers'}
  <FormDialog
    submit={onAddMembers}
    name="addmembers"
    title={`Add Members to Group ${$store.group.name}`}
    on:escape={() => { modal = undefined }}
    on:saved={onSaved}
    preload={{ users: $store.group.directMembers.map(u => u.id) }}>
    <FieldMultiselect
      path='users'
      label='Add Members'
      getOptions={searchUsersForMembers}/>
  </FormDialog>
{:else if modal === 'removegroupmember'}
  <Dialog
    title="Remove Group Member"
    continueText="Remove"
    cancelText="Cancel"
    on:continue={onRemoveGroupMember}
    on:escape={() => { modal = undefined; groupMemberRemovingId = undefined }}>
    Remove this member from group {$store.group.name}?
  </Dialog>
{:else if modal === 'addrole'}
  <FormDialog
    submit={onAddRole}
    name="addroles"
    title={`Assign Role to Group ${$store.group.name}`}
    on:escape={() => { modal = undefined }}
    on:saved={onSaved}
    preload={{ roles: $store.group.directRoles.map(r => r.id) }}>
    <FieldSelect path='role' label='Role' choices={allRoles.filter(r => !directRoleIds.includes(r.id)).map(r => ({ label: r.name, value: r.id }))}/>
  </FormDialog>
{:else if modal === 'removerole'}
  <Dialog
    title="Remove Role"
    continueText="Remove"
    cancelText="Cancel"
    on:continue={onRemoveRole}
    on:escape={() => { modal = undefined; roleRemovingId = undefined }}>
    Remove this role from group {$store.group.name}?
  </Dialog>
{/if}
<style>
  .panel-grid {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: 1em;
  }
  .vertical-group {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1em;
  }
  :global([data-eq~="800px"]) .panel-grid {
    grid-template-columns: 1fr;
  }
</style>
