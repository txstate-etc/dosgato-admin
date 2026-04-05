<script lang="ts">
  import { Dialog, FieldSelect, FieldText, FormDialog, Tree, TreeStore, type TypedTreeItem } from '@dosgato/dialog'
  import keyIcon from '@iconify-icons/ph/key'
  import plusIcon from '@iconify-icons/mdi/plus'
  import deleteOutline from '@iconify-icons/mdi/delete-outline'
  import { setContext, tick } from 'svelte'
  import { goto } from '$app/navigation'
  import { base } from '$app/paths'
  import { ActionPanel, type ActionPanelAction, api, type RoleListRole, messageForDialog, uiLog, SearchInput, actionPanelStore } from '$lib'
  import { isNotBlank } from 'txstate-utils';

  export let data: { siteOptions: { value: string, label: string }[] }
  const { siteOptions } = data
  const siteNamesById: Record<string, string> = siteOptions.reduce((acc, site) => {
    acc[site.value] = site.label
    return acc
  }, {} as Record<string, string>)

  const actionPanelTarget: { target: string | undefined } = { target: undefined }
  setContext('ActionPanelTarget', { getTarget: () => actionPanelTarget.target })

  let searchInput: HTMLInputElement
  async function onClickMinifiedSearch () {
    actionPanelStore.show()
    await tick()
    searchInput?.focus()
  }

  type Modals = 'addrole' | 'deleterole'
  let modal: Modals | undefined

  type TypedRoleItem = TypedTreeItem<RoleListRole>
  async function fetchChildren (role?: TypedRoleItem) {
    if (role) return []
    return await api.getRoleList()
  }

  const store = new TreeStore<RoleListRole>(fetchChildren)

  function noneselectedactions () {
    const actions: ActionPanelAction[] = [
      { label: 'Add Role', icon: plusIcon, disabled: false, onClick: () => openModal('addrole') }
    ]
    return actions
  }

  function singleactions (role: TypedRoleItem) {
    const actions: ActionPanelAction[] = [
      { label: 'Delete', icon: deleteOutline, disabled: !role.permissions.delete, onClick: () => openModal('deleterole') }
    ]
    return actions
  }

  async function validateAddRole (state) {
    const resp = await api.addRole(state, true)
    return resp.messages.map(m => ({ path: m.arg, type: m.type, message: m.message }))
  }

  async function onAddRole (state) {
    const resp = await api.addRole(state)
    uiLog.log({ eventType: 'RolesPage-modal-' + modal, action: resp.success ? 'Success' : 'Failed', target: resp.role?.name })
    return {
      success: resp.success,
      messages: messageForDialog(resp.messages, ''),
      data: resp.success
        ? {
            name: resp.role!.name
          }
        : undefined
    }
  }

  function onCompleteAddRole () {
    void store.refresh()
    modal = undefined
  }

  async function onDeleteRole () {
    const resp = await api.deleteRole($store.selectedItems[0].id)
    uiLog.log({ eventType: 'RolesPage-modal-' + modal, action: resp.success ? 'Success' : 'Failed', target: actionPanelTarget.target })
    if (resp.success) void store.refresh()
    modal = undefined
  }

  function onModalEscape () {
    uiLog.log({ eventType: 'RolesPage-modal-' + modal, action: 'Cancel', target: actionPanelTarget.target })
    modal = undefined
  }

  function openModal (m: Modals) {
    uiLog.log({ eventType: 'RolesPage-modal-' + m, action: 'Open', target: actionPanelTarget.target })
    modal = m
  }

let filter = ''

  $: actionPanelTarget.target = uiLog.targetFromTreeStore($store, 'name')

  function handleResponsiveHeaders (treeWidth: number) {
    if (treeWidth > 900) {
      return ['name', 'description', 'site', 'access']
    } else if (treeWidth > 600) {
      return ['name', 'site', 'access']
    } else  {
      return ['name', 'site']
    }
  }
</script>

{#if filter.length}
  <div class="searching">Search results for "{filter}"...</div>
{/if}
<ActionPanel actionsTitle={$store.selected.size === 1 ? $store.selectedItems[0].name : 'Roles'} actions={$store.selected.size === 1 ? singleactions($store.selectedItems[0]) : noneselectedactions()}>
  <svelte:fragment slot="abovePanel" let:panelHidden>
    <SearchInput bind:searchInput asYouType on:search={e => { filter = e.detail }} on:maximize={onClickMinifiedSearch} minimized={panelHidden} />
  </svelte:fragment>
  <Tree singleSelect {store} on:choose={async ({ detail }) => await goto(base + '/auth/roles/' + detail.id)} headers={[
    { id: 'name', label: 'Name', get: 'name', icon: { icon: keyIcon }, grow: 2 },
    { id: 'description', label: 'Description', get: 'description', grow: 2 },
    { id: 'site', label: 'Site', render: role => role.site?.id ? siteNamesById[role.site.id] : '', grow: 2 },
    { id: 'access', label: 'Access Level', get: 'access' }
  ]} searchable='name' filter={filter} enableResize responsiveHeaders={handleResponsiveHeaders}>
    <svelte:fragment slot="empty">
      No roles found. Try expanding your search?
    </svelte:fragment>
  </Tree>
</ActionPanel>
{#if modal === 'addrole'}
  <FormDialog
    submit={onAddRole}
    validate={validateAddRole}
    title='Add Role'
    name='addrole'
    on:escape={onModalEscape}
    on:saved={onCompleteAddRole}
    let:data>
    <FieldText path='name' label='Name' required />
    <FieldText path='description' label='Description' maxlength={200} />
    <FieldSelect path='siteId' label='Site' choices={siteOptions} />
    <FieldSelect path='access' label="Access Level" conditional={isNotBlank(data.siteId)} required choices={[
      { value: 'EDITOR', label: 'Editor' },
      { value: 'CONTRIBUTOR', label: 'Contributor' },
      { value: 'READONLY', label: 'Read Only' }
    ]} helptext="A summary of the access level this role provides. Once the role is created, you need to assign rules to it to define what users with this role can do." />
  </FormDialog>
{:else if modal === 'deleterole'}
  <Dialog
    title='Delete Role'
    continueText='Delete'
    cancelText='Cancel'
    on:escape={onModalEscape}
    on:continue={onDeleteRole}>
    {`Delete ${$store.selectedItems[0].name} role?`}
  </Dialog>
{/if}
