<script lang="ts">
  import pencilIcon from '@iconify-icons/mdi/pencil'
  import plusIcon from '@iconify-icons/mdi/plus'
  import linkVariantOffIcon from '@iconify-icons/mdi/link-variant-off'
  import deleteOutline from '@iconify-icons/mdi/delete-outline'
  import { Dialog, FieldText, FieldMultiselect, Icon, FieldSelect, FormDialog } from '@dosgato/dialog'
  import { base } from '$app/paths'
  import { api, BackButton, DetailPanel, DetailPanelSection, messageForDialog, StyledList, type RoleListRole, type UserListUser } from '$lib'
  import { _store as store } from './+page'
  import { MessageType } from '@txstate-mws/svelte-forms'
  import DetailPageContent from '$lib/components/DetailPageContent.svelte'
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
    return allUsers.filter(u => !u.disabled && (u.firstname.includes(term) || (u.lastname.includes(term)) || u.id.includes(term))).map(u => ({ label: `${u.firstname} ${u.lastname} (${u.id})`, value: u.id }))
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

  function getIndirectRoleGroup (role) {
    // This role is an indirect role. It comes from an ancestor group of the group we are inspecting.
    // Look at the role's direct groups to see which one(s) are in the supergroups list
    return role.groups.filter(g => supergroupIds.includes(g.id)).map(g => g.name).join(', ')
  }

  async function openAddRoleDialog () {
    allRoles ??= await api.getRoleList()
    modal = 'addrole'
  }

  async function onAddRole (state) {
    const resp = await api.addRoleToGroup(state.role, $store.group.id)
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
  <DetailPanel header='Basic Information' headerColor={panelHeaderColor} button={{ icon: pencilIcon, onClick: () => { modal = 'editbasic' } }}>
    <DetailPanelSection>
      <div class="row">
        <div class="label">Name:</div>
        <div class="value">{$store.group.name}</div>
      </div>
    </DetailPanelSection>
  </DetailPanel>

  {#if $store.group.subgroups.length}
  <DetailPanel header='Subgroups' headerColor={panelHeaderColor}>
    <DetailPanelSection>
      <StyledList>
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
      </StyledList>
    </DetailPanelSection>
  </DetailPanel>
  {/if}

  {#if $store.group.supergroups.length}
  <DetailPanel header='Ancestor Groups' headerColor={panelHeaderColor}>
    <DetailPanelSection>
      <StyledList>
        {#each $store.group.supergroups as group (group.id)}
        <li class="flex-row">
          <a href={`${base}/auth/groups/${group.id}`}>{group.name}</a>
        </li>
        {/each}
      </StyledList>
    </DetailPanelSection>
  </DetailPanel>
  {/if}

  <DetailPanel header='Roles' headerColor={panelHeaderColor} button={{ icon: plusIcon, onClick: () => { openAddRoleDialog() } } }>
    <DetailPanelSection>
      <StyledList>
        {#each $store.group.directRoles as role (role.id)}
          <li class="flex-row">
            {role.name}
            <button on:click={() => { onClickRemoveRole(role.id) }}><Icon icon={deleteOutline} width="1.5em"/></button>
          </li>
        {/each}
        {#each $store.group.rolesThroughParentGroup as role (role.id)}
          <li class="flex-row">
            {role.name}
            <div>{`Via ${getIndirectRoleGroup(role)}`}</div>
          </li>
        {/each}
      </StyledList>
    </DetailPanelSection>
  </DetailPanel>

  {#if Object.keys($store.sites).length || $store.permittedOnAllSites.length}
    <DetailPanel header='Sites' headerColor={panelHeaderColor}>
      <DetailPanelSection>
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
      </DetailPanelSection>
    </DetailPanel>
  {/if}


  <DetailPanel header='Members' headerColor={panelHeaderColor} button={{ icon: plusIcon, onClick: () => openAddUsersDialog() }} >
    <DetailPanelSection>
      {#if $store.group.directMembers.length || $store.group.indirectMembers.length}
        <StyledList>
          {#each $store.group.directMembers as member (member.id)}
            <li class="flex-row">
              {member.firstname} {member.lastname}  ({member.id})
              <button on:click={() => { onClickRemoveGroupMember(member.id) }}><Icon icon={deleteOutline} width="1.5em"/></button>
            </li>
          {/each}
          {#each $store.group.indirectMembers.filter(m => !directMemberIds.includes(m.id)) as member (member.id)}
            <li class="flex-row">
              {member.firstname} {member.lastname} ({member.id})
              <div>{`Via ${getMemberDirectGroup(member.groups)}`}</div>
            </li>
          {/each}
        </StyledList>
      {:else}
        <div>{$store.group.name} has no members.</div>
      {/if}
    </DetailPanelSection>
  </DetailPanel>

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
  .row {
    display: flex;
    padding: 0.5rem 0;
  }
  .label {
    font-weight: bold;
    width: 25%;
  }
</style>
