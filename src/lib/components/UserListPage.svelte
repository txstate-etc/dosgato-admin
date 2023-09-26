<script lang="ts">
  import { FieldCheckbox, FieldText, FormDialog, Dialog, Tree, TreeStore, type TypedTreeItem } from '@dosgato/dialog'
  import accountIcon from '@iconify-icons/mdi/account'
  import accountCheck from '@iconify-icons/mdi/account-check'
  import accountCancel from '@iconify-icons/mdi/account-cancel'
  import accountOff from '@iconify-icons/mdi/account-off'
  import accountPlus from '@iconify-icons/mdi/account-plus'
  import pencilIcon from '@iconify-icons/mdi/pencil'
  import downloadIcon from '@iconify-icons/ph/download-simple'
  import { csv, sortby } from 'txstate-utils'
  import { goto } from '$app/navigation'
  import { base } from '$app/paths'
  import { ActionPanel, type ActionPanelAction, api, type CreateUserInput, globalStore, type UserListUser, ModalContextStore, uiLog } from '$lib'
  import { setContext } from 'svelte'

  export let system: boolean

  type TypedUserItem = TypedTreeItem<UserListUser>

  const actionPanelTarget: { target: string | undefined } = { target: 'UserListPage' }
  setContext('ActionPanelTarget', { getTarget: () => actionPanelTarget.target })

  type Modals = 'create' | 'disable' | 'enable'
  const modalContext = new ModalContextStore<Modals>(undefined, () => actionPanelTarget.target)

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
    if (user.disabled) actions.push({ id: 'enabledisable', label: 'Enable', icon: accountCheck, disabled: !user.permissions.disable, onClick: () => modalContext.setModal('enable') })
    else actions.push({ id: 'enabledisable', label: 'Disable', icon: accountCancel, disabled: !user.permissions.disable, onClick: () => modalContext.setModal('disable') })
    return actions
  }

  function multiactions (pages: TypedUserItem[]) {
    if (!pages?.length) return []
    return [
      { label: 'Disable', disabled: pages.some(u => !u.permissions.disable), onClick: () => {} }
    ]
  }

  const emptyactions: ActionPanelAction[] = [
    { label: 'Create', icon: accountPlus, disabled: !$globalStore.access.createUsers, onClick: () => modalContext.setModal('create') }
  ]
  if (!system) emptyactions.push({ label: 'Download CSV', icon: downloadIcon, disabled: !$globalStore.access.createUsers, onClick: () => { downloadUserEmails() } })

  async function onDisable () {
    const resp = await api.disableUsers($store.selectedItems.map(u => u.id))
    modalContext.logModalResponse(resp, actionPanelTarget.target, { id: uiLog.targetFromTreeStore($store, 'id') })
    if (resp.success) store.refresh()
    modalContext.reset()
  }

  async function onEnable () {
    const resp = await api.enableUsers($store.selectedItems.map(u => u.id))
    modalContext.logModalResponse(resp, actionPanelTarget.target, { id: uiLog.targetFromTreeStore($store, 'id') })
    if (resp.success) store.refresh()
    modalContext.reset()
  }

  async function onCreate (data: CreateUserInput) {
    const resp = await api.createUser({ ...data, system })
    modalContext.logModalResponse(resp, actionPanelTarget.target, { id: resp.user?.id })
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
    modalContext.reset()
    store.refresh()
  }

  export async function buildEmailCSV () {
    const users = sortby(await api.getUserList({ enabled: true, system: false }), 'lastname')
    const rows = [['Last Name', 'First Name', 'ID', 'Email']]
    for (const user of users) {
      rows.push([user.lastname, user.firstname ?? '', user.id, user.email])
    }
    return csv(rows)
  }

  async function downloadUserEmails () {
    const sitesCSV = await buildEmailCSV()
    const j = document.createElement('a')
    j.download = 'dosgatoemails_' + Date.now() + '.csv'
    j.href = URL.createObjectURL(new Blob([sitesCSV]))
    j.click()
  }

  let filter

  $: actions = $store.selected.size ? ($store.selected.size === 1 ? singleactions($store.selectedItems[0]) : multiactions($store.selectedItems)) : emptyactions

  // TODO: Get with Rachel on what we want the target to be here. Probably don't want it to be the user. Do we want IDs in the logs??? I think yes but can that bite us?
  // $: actionPanelTarget.target = uiLog.targetFromTreeStore($store, 'id')
</script>
<ActionPanel {actions} actionsTitle={$store.selected.size ? $store.selectedItems[0].id : 'Users'} filterinput on:filter={e => { filter = e.detail }}>
  <Tree singleSelect {store} on:choose={({ detail }) => goto(base + '/auth/users/' + detail.id)} headers={[
    { id: 'username', label: system ? 'Service Account' : 'Username', get: 'id', fixed: '10em', icon: u => ({ icon: u.disabled ? accountOff : accountIcon }) },
    { id: 'fullname', label: 'Full Name', get: 'name', fixed: '17em' },
    { id: 'roles', label: 'Roles', render: renderRoles, grow: 5 }
  ]} searchable={['id', 'firstname', 'lastname']} {filter} enableResize />
</ActionPanel>
{#if $modalContext.modal === 'disable'}
  <Dialog
    title={`Disable ${$store.selectedItems[0].name} (${$store.selectedItems[0].id})${$store.selectedItems.length > 1 ? ` and ${$store.selectedItems.length - 1} more` : ''}`}
    continueText="Disable User{$store.selectedItems.length > 1 ? 's' : ''}"
    cancelText="Cancel"
    on:continue={onDisable}
    on:escape={modalContext.onModalEscape}>
    Are you sure you want to disable {#if $store.selectedItems.length > 1}{$store.selectedItems.length} users{:else}this user{/if}? They will be unable to log in, but their roles will be preserved so that they can be re-enabled with minimal work.
  </Dialog>
{:else if $modalContext.modal === 'enable'}
  <Dialog
    title={`Enable ${$store.selectedItems[0].name} (${$store.selectedItems[0].id})${$store.selectedItems.length > 1 ? ` and ${$store.selectedItems.length - 1} more` : ''}`}
    continueText="Enable User{$store.selectedItems.length > 1 ? 's' : ''}"
    cancelText="Cancel"
    on:continue={onEnable}
    on:escape={modalContext.onModalEscape}>
    Are you sure you want to enable {#if $store.selectedItems.length > 1}{$store.selectedItems.length} users{:else}this user{/if}? They will be able to log in again and will have all the same roles as when they were disabled.
  </Dialog>
{:else if $modalContext.modal === 'create'}
  <FormDialog title="Create User" submit={onCreate} validate={onCreateValidate} on:escape={modalContext.onModalEscape} on:saved={onCreateComplete}>
    <FieldText path="userId" label="Login"></FieldText>
    {#if !system}
      <FieldText path="firstname" label="First Name"></FieldText>
    {/if}
    <FieldText path="lastname" label="{system ? 'Name' : 'Last Name'}"></FieldText>
    <FieldText path="email" label="E-mail"></FieldText>
    <FieldCheckbox path="trained" label="Training" boxLabel="This user successfully completed editor training." defaultValue={false}></FieldCheckbox>
  </FormDialog>
{/if}
