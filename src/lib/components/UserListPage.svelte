<script lang="ts">
  import { FieldText, FormDialog, Dialog, Tree, TreeStore, type TypedTreeItem } from '@dosgato/dialog'
  import accountIcon from '@iconify-icons/mdi/account'
  import accountCheck from '@iconify-icons/mdi/account-check'
  import accountCancel from '@iconify-icons/mdi/account-cancel'
  import accountOff from '@iconify-icons/mdi/account-off'
  import accountPlus from '@iconify-icons/mdi/account-plus'
  import pencilIcon from '@iconify-icons/mdi/pencil'
  import downloadIcon from '@iconify-icons/ph/download-simple'
  import { PopupMenu, type PopupMenuItem } from '@txstate-mws/svelte-components'
  import type { FormStore } from '@txstate-mws/svelte-forms'
  import { derivedStore } from '@txstate-mws/svelte-store'
  import { setContext, tick } from 'svelte'
  import { csv, intersect, isBlank, isNull, pick, rescue, sleep, sortby } from 'txstate-utils'
  import { goto } from '$app/navigation'
  import { base } from '$app/paths'
  import { ActionPanel, type ActionPanelAction, api, type CreateUserInput, globalStore, type UserListUser, ModalContextStore, uiLog, UserTrainingsChooser, SearchInput, actionPanelStore } from '$lib'

  export let system: boolean
  export let trainings: { id: string, name: string, lcName: string }[]
  export let filter = ''

  type TypedUserItem = TypedTreeItem<UserListUser>

  const actionPanelTarget: { target: string | undefined } = { target: 'UserListPage' }
  setContext('ActionPanelTarget', { getTarget: () => actionPanelTarget.target })

  type Modals = 'create' | 'disable' | 'enable'
  const modalContext = new ModalContextStore<Modals>(undefined, () => actionPanelTarget.target)
  const creatingStore = derivedStore(modalContext, mc => mc.modal === 'create')

  async function fetchChildren (user?: TypedUserItem) {
    if (user) return []
    return await api.getUserList({ system })
  }

  function renderRoles (user: TypedUserItem) {
    return sortby(user.roles.map(r => r.name), n => ['editor', 'superuser'].includes(n), n => n).slice(0, 3).join(', ') + (
      user.roles.length > 3 ? `, and ${user.roles.length - 3} more` : ''
    )
  }

  const store = new TreeStore<UserListUser>(fetchChildren)
  const { filteredRootItems } = store

  function singleactions (user: TypedUserItem) {
    const actions: ActionPanelAction[] = [
      { label: 'Edit', icon: pencilIcon, disabled: !user.permissions.update, onClick: async () => await goto(base + '/auth/users/' + user.id) }
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
  if (!system) emptyactions.push({ label: 'Download CSV', icon: downloadIcon, disabled: !$globalStore.access.createUsers, onClick: () => { void downloadUserEmails() } })

  async function onDisable () {
    const resp = await api.disableUsers($store.selectedItems.map(u => u.id))
    modalContext.logModalResponse(resp, actionPanelTarget.target, { id: uiLog.targetFromTreeStore($store, 'id') })
    if (resp.success) void store.refresh()
    modalContext.reset()
  }

  async function onEnable () {
    const resp = await api.enableUsers($store.selectedItems.map(u => u.id))
    modalContext.logModalResponse(resp, actionPanelTarget.target, { id: uiLog.targetFromTreeStore($store, 'id') })
    if (resp.success) void store.refresh()
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
            email: resp.user!.email
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
    void store.refresh()
  }

  let createStore: FormStore | undefined
  let loginElement: HTMLInputElement
  let firstnameElement: HTMLInputElement
  let lastnameElement: HTMLInputElement
  let emailElement: HTMLInputElement
  let createItems: PopupMenuItem[] = []
  let hideEmptyText = true
  // eslint-disable-next-line prefer-const
  let createMenuLoading = false
  let counter = 0
  interface ExternalUser {
    login: string
    firstname: string
    lastname: string
    email: string
  }
  async function findExternalUsers (q: string) {
    const myCounter = ++counter
    await sleep(200)
    if (myCounter !== counter) return
    if (isBlank(q)) {
      createItems = []
      return
    }
    const ret = await rescue(api.restful<ExternalUser[]>('/users/external?q=' + encodeURIComponent(q)), [] as ExternalUser[])
    hideEmptyText = false
    createItems = ret.map(u => ({ label: `${u.firstname} ${u.lastname} (${u.login})`, value: u.login, full: u }))
  }
  async function reactToCreationModal (..._: any) {
    if ($creatingStore) {
      if (system) return
      hideEmptyText = true
      await tick()
      loginElement.addEventListener('input', () => { findExternalUsers(loginElement.value).catch(console.error) })
      firstnameElement.addEventListener('input', () => { findExternalUsers(firstnameElement.value).catch(console.error) })
      lastnameElement.addEventListener('input', () => { findExternalUsers(lastnameElement.value).catch(console.error) })
      emailElement.addEventListener('input', () => { findExternalUsers(emailElement.value).catch(console.error) })
      loginElement.addEventListener('focus', () => { findExternalUsers(loginElement.value).catch(console.error) })
      firstnameElement.addEventListener('focus', () => { findExternalUsers(firstnameElement.value).catch(console.error) })
      lastnameElement.addEventListener('focus', () => { findExternalUsers(lastnameElement.value).catch(console.error) })
      emailElement.addEventListener('focus', () => { findExternalUsers(emailElement.value).catch(console.error) })
    } else {
      createStore = undefined
    }
  }
  $: reactToCreationModal($creatingStore).catch(console.error)
  function onCreateMenuSelection (e: CustomEvent) {
    createStore!.setData({ ...$createStore!.data, userId: e.detail.full.login, ...pick(e.detail.full, 'firstname', 'lastname', 'email') }).catch(console.error)
  }

  export async function buildEmailCSV () {
    const users = await api.getUserListForAudit()
    const rows = [['Last Name', 'First Name', 'ID', 'Email', 'Status', 'Access']]
    for (const user of users) {
      // Look at the user's roles to get the sites they can edit.
      // They should have viewForEdit on both pages and assets for a site
      let canEditAllPages = false
      let canEditAllAssets = false
      const pageEditorSites: string[] = []
      const assetEditorSites: string[] = []
      for (const role of user.roles) {
        for (const rule of role.pageRules) {
          if (rule.grants?.viewForEdit) {
            if (isNull(rule.site)) {
              canEditAllPages = true
            } else {
              pageEditorSites.push(rule.site.name)
            }
          }
        }
        for (const rule of role.assetRules) {
          if (rule.grants?.viewForEdit) {
            if (isNull(rule.site)) {
              canEditAllAssets = true
            } else {
              assetEditorSites.push(rule.site.name)
            }
          }
        }
      }
      let access = ''
      if (canEditAllAssets && canEditAllPages) {
        access = 'All Sites'
      } else {
        access = intersect(pageEditorSites, assetEditorSites).sort().join(', ')
      }
      rows.push([user.lastname, user.firstname ?? '', user.id, user.email, (user.disabled ? 'Inactive' : 'Active'), access])
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

  function handleResponsiveHeaders (treeWidth: number) {
    if (treeWidth > 500) {
      return ['username', 'fullname', 'roles']
    } else {
      return ['username', 'fullname']
    }
  }

  $: actions = $store.selected.size ? ($store.selected.size === 1 ? singleactions($store.selectedItems[0]) : multiactions($store.selectedItems)) : emptyactions

  // TODO: Get with Rachel on what we want the target to be here. Probably don't want it to be the user. Do we want IDs in the logs??? I think yes but can that bite us?
  // $: actionPanelTarget.target = uiLog.targetFromTreeStore($store, 'id')
</script>
<ActionPanel {actions} actionsTitle={$store.selected.size ? $store.selectedItems[0].id : 'Users'}>
  <Tree singleSelect {store} on:choose={async ({ detail }) => await goto(base + '/auth/users/' + detail.id)} headers={[
    { id: 'username', label: system ? 'Service Account' : 'Username', get: 'id', fixed: '10em', icon: u => ({ icon: u.disabled ? accountOff : accountIcon }) },
    { id: 'fullname', label: 'Full Name', get: 'name', fixed: '17em' },
    { id: 'roles', label: 'Roles', render: renderRoles, grow: 5 }
  ]} searchable={['id', 'firstname', 'lastname']} {filter} enableResize responsiveHeaders={handleResponsiveHeaders}/>
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
  <FormDialog bind:store={createStore} title="Create User" submit={onCreate} validate={onCreateValidate} on:escape={modalContext.onModalEscape} on:saved={onCreateComplete}>
    <FieldText bind:inputelement={loginElement} path="userId" label="Login"></FieldText>
    {#if !system}
      <FieldText bind:inputelement={firstnameElement} path="firstname" label="First Name"></FieldText>
    {/if}
    <FieldText bind:inputelement={lastnameElement} path="lastname" label="{system ? 'Name' : 'Last Name'}"></FieldText>
    <FieldText bind:inputelement={emailElement} path="email" label="E-mail"></FieldText>
    <UserTrainingsChooser {trainings} />
    <PopupMenu align="bottomleft" hideSelectedIndicator loading={createMenuLoading} {hideEmptyText} buttonelement={loginElement} items={createItems} on:change={onCreateMenuSelection}></PopupMenu>
    <PopupMenu align="bottomleft" hideSelectedIndicator loading={createMenuLoading} {hideEmptyText} buttonelement={firstnameElement} items={createItems} on:change={onCreateMenuSelection}></PopupMenu>
    <PopupMenu align="bottomleft" hideSelectedIndicator loading={createMenuLoading} {hideEmptyText} buttonelement={lastnameElement} items={createItems} on:change={onCreateMenuSelection}></PopupMenu>
    <PopupMenu align="bottomleft" hideSelectedIndicator loading={createMenuLoading} {hideEmptyText} buttonelement={emailElement} items={createItems} on:change={onCreateMenuSelection}></PopupMenu>
  </FormDialog>
{/if}
