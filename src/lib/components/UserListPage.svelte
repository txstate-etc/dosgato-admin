<script lang="ts">
  import { FieldCheckbox, FieldText, FormDialog, Dialog, Tree, TreeStore, type TypedTreeItem } from '@dosgato/dialog'
  import accountIcon from '@iconify-icons/mdi/account'
  import accountCheck from '@iconify-icons/mdi/account-check'
  import accountCancel from '@iconify-icons/mdi/account-cancel'
  import accountOff from '@iconify-icons/mdi/account-off'
  import accountPlus from '@iconify-icons/mdi/account-plus'
  import pencilIcon from '@iconify-icons/mdi/pencil'
  import { sortby } from 'txstate-utils'
  import { goto } from '$app/navigation'
  import { base } from '$app/paths'
  import { ActionPanel, type ActionPanelAction, api, type CreateUserInput, globalStore, type UserListUser } from '$lib'

  export let system: boolean

  type TypedUserItem = TypedTreeItem<UserListUser>

  let modal: 'create' | 'disable' | 'enable' | undefined

  async function fetchChildren (user?: TypedUserItem) {
    if (user) return []
    return await api.getUserList({ system })
  }

  function renderRoles (user: TypedUserItem) {
    return sortby(user.roles.map(r => r.name), n => ['editor', 'superuser'].includes(n), n => n).slice(0, 3).join(', ') + (
      user.roles.length > 3 ? `, and ${user.roles.length - 3} more` : ''
    )
  }

  const store: TreeStore<UserListUser> = new TreeStore(fetchChildren)
  const { filteredRootItems } = store

  function singleactions (user: TypedUserItem) {
    const actions: ActionPanelAction[] = [
      { label: 'Edit', icon: pencilIcon, disabled: !user.permissions.update, onClick: () => goto(base + '/auth/users/' + user.id) }
    ]
    if (user.disabled) actions.push({ id: 'enabledisable', label: 'Enable', icon: accountCheck, disabled: !user.permissions.disable, onClick: () => { modal = 'enable' } })
    else actions.push({ id: 'enabledisable', label: 'Disable', icon: accountCancel, disabled: !user.permissions.disable, onClick: () => { modal = 'disable' } })
    return actions
  }

  function multiactions (pages: TypedUserItem[]) {
    if (!pages?.length) return []
    return [
      { label: 'Disable', disabled: pages.some(u => !u.permissions.disable), onClick: () => {} }
    ]
  }

  const emptyactions: ActionPanelAction[] = [
    { label: 'Create', icon: accountPlus, disabled: !$globalStore.access.createUsers, onClick: () => { modal = 'create' } }
  ]

  async function onDisable () {
    const resp = await api.disableUsers($store.selectedItems.map(u => u.id))
    if (resp.success) store.refresh()
    modal = undefined
  }

  async function onEnable () {
    const resp = await api.enableUsers($store.selectedItems.map(u => u.id))
    if (resp.success) store.refresh()
    modal = undefined
  }

  async function onCreate (data: CreateUserInput) {
    const resp = await api.createUser({ ...data, system })
    return {
      success: resp.success,
      messages: resp.messages.map(m => ({ ...m, path: m.arg })),
      data: resp.success
        ? {
            userId: resp.user!.id,
            firstname: resp.user!.firstname,
            lastname: resp.user!.lastname,
            email: resp.user!.email,
            trained: resp.user!.trained
          }
        : undefined
    }
  }

  async function onCreateValidate (data: CreateUserInput) {
    const resp = await api.createUser({ ...data, validateOnly: true, system })
    return resp.messages.map(m => ({ ...m, path: m.arg }))
  }

  function onCreateComplete () {
    modal = undefined
    store.refresh()
  }
  let filter
  $: console.log($filteredRootItems, filter)
  $: actions = $store.selected.size ? ($store.selected.size === 1 ? singleactions($store.selectedItems[0]) : multiactions($store.selectedItems)) : emptyactions
</script>
<ActionPanel {actions} actionsTitle={$store.selected.size ? $store.selectedItems[0].id : 'Users'} filterinput on:filter={e => { filter = e.detail }}>
  <Tree singleSelect {store} on:choose={({ detail }) => goto(base + '/auth/users/' + detail.id)} headers={[
    { id: 'username', label: system ? 'Service Account' : 'Username', get: 'id', fixed: '10em', icon: u => u.disabled ? accountOff : accountIcon },
    { id: 'fullname', label: 'Full Name', get: 'name', fixed: '17em' },
    { id: 'roles', label: 'Roles', render: renderRoles, grow: 5 }
  ]} searchable={['id', 'firstname', 'lastname']} {filter}/>
</ActionPanel>
{#if modal === 'disable'}
  <Dialog
    title={`Disable ${$store.selectedItems[0].name} (${$store.selectedItems[0].id})${$store.selectedItems.length > 1 ? ` and ${$store.selectedItems.length - 1} more` : ''}`}
    continueText="Disable User{$store.selectedItems.length > 1 ? 's' : ''}"
    cancelText="Cancel"
    on:continue={onDisable}
    on:escape={() => { modal = undefined }}>
    Are you sure you want to disable {#if $store.selectedItems.length > 1}{$store.selectedItems.length} users{:else}this user{/if}? They will be unable to log in, but their roles will be preserved so that they can be re-enabled with minimal work.
  </Dialog>
{:else if modal === 'enable'}
  <Dialog
    title={`Enable ${$store.selectedItems[0].name} (${$store.selectedItems[0].id})${$store.selectedItems.length > 1 ? ` and ${$store.selectedItems.length - 1} more` : ''}`}
    continueText="Enable User{$store.selectedItems.length > 1 ? 's' : ''}"
    cancelText="Cancel"
    on:continue={onEnable}
    on:escape={() => { modal = undefined }}>
    Are you sure you want to enable {#if $store.selectedItems.length > 1}{$store.selectedItems.length} users{:else}this user{/if}? They will be able to log in again and will have all the same roles as when they were disabled.
  </Dialog>
{:else if modal === 'create'}
  <FormDialog title="Create User" submit={onCreate} validate={onCreateValidate} on:escape={() => { modal = undefined }} on:saved={onCreateComplete}>
    <FieldText path="userId" label="Login"></FieldText>
    {#if !system}
      <FieldText path="firstname" label="First Name"></FieldText>
    {/if}
    <FieldText path="lastname" label="{system ? 'Name' : 'Last Name'}"></FieldText>
    <FieldText path="email" label="E-mail"></FieldText>
    <FieldCheckbox path="trained" label="Training" boxLabel="This user successfully completed editor training." defaultValue={false}></FieldCheckbox>
  </FormDialog>
{/if}
