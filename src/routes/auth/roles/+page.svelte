<script lang="ts">
  import { Dialog, FieldSelect, FieldText, FormDialog, Tree, TreeStore, type TypedTreeItem } from '@dosgato/dialog'
  import keyIcon from '@iconify-icons/ph/key'
  import plusIcon from '@iconify-icons/mdi/plus'
  import deleteOutline from '@iconify-icons/mdi/delete-outline'
  import { setContext, tick } from 'svelte'
  import { goto } from '$app/navigation'
  import { base } from '$app/paths'
  import { ActionPanel, type ActionPanelAction, api, type RoleListRole, messageForDialog, uiLog, ModalContextStore, SearchInput, actionPanelStore } from '$lib'

  export let data: { siteOptions: { value: string, label: string }[] }
  const siteNamesById: Record<string, string> = data.siteOptions.reduce((acc, site) => {
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
  const modalContext = new ModalContextStore<Modals>(undefined, () => actionPanelTarget.target)

  type TypedRoleItem = TypedTreeItem<RoleListRole>
  async function fetchChildren (role?: TypedRoleItem) {
    if (role) return []
    return await api.getRoleList()
  }

  const store = new TreeStore<RoleListRole>(fetchChildren)

  function noneselectedactions () {
    const actions: ActionPanelAction[] = [
      { label: 'Add Role', icon: plusIcon, disabled: false, onClick: () => modalContext.setModal('addrole') }
    ]
    return actions
  }

  function singleactions (role: TypedRoleItem) {
    const actions: ActionPanelAction[] = [
      { label: 'Delete', icon: deleteOutline, disabled: !role.permissions.delete, onClick: () => modalContext.setModal('deleterole') }
    ]
    return actions
  }


  // TODO: send state params as object { name, description, siteId }
  async function validateAddRole (state) {
    const resp = await api.addRole(state, true)
    return resp.messages.map(m => ({ path: m.arg, type: m.type, message: m.message }))
  }

  async function onAddRole (state) {
    const resp = await api.addRole(state)
    modalContext.logModalResponse(resp, resp.role?.name)
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
    modalContext.reset()
  }

  async function onDeleteRole () {
    const resp = await api.deleteRole($store.selectedItems[0].id)
    modalContext.logModalResponse(resp, actionPanelTarget.target)
    if (resp.success) void store.refresh()
    modalContext.reset()
  }

let filter = ''

  $: actionPanelTarget.target = uiLog.targetFromTreeStore($store, 'id')
</script>

{#if filter.length}
  <div class="searching">Search results for "{filter}"...</div>
{/if}
<ActionPanel actionsTitle={$store.selected.size === 1 ? $store.selectedItems[0].name : 'Roles'} actions={$store.selected.size === 1 ? singleactions($store.selectedItems[0]) : noneselectedactions()}>
  <svelte:fragment slot="abovePanel" let:panelHidden>
    <SearchInput bind:searchInput asYouType on:search={e => { filter = e.detail }} on:maximize={onClickMinifiedSearch} minimized={panelHidden} />
  </svelte:fragment>
  <Tree singleSelect {store} on:choose={async ({ detail }) => await goto(base + '/auth/roles/' + detail.id)} headers={[
    { id: 'name', label: 'Name', get: 'name', icon: { icon: keyIcon } },
    { id: 'description', label: 'Description', get: 'description' },
    { id: 'site', label: 'Site', render: role => role.site?.id ? siteNamesById[role.site.id] : '' }
  ]} searchable='name' filter={filter} enableResize>
  </Tree>
</ActionPanel>
{#if $modalContext.modal === 'addrole'}
  <FormDialog
    submit={onAddRole}
    validate={validateAddRole}
    title='Add Role'
    name='addrole'
    on:escape={modalContext.onModalEscape}
    on:saved={onCompleteAddRole}>
    <FieldText path='name' label='Name' required />
    <FieldText path='description' label='Description' />
    <FieldSelect path='siteId' label='Site' choices={data.siteOptions} />
  </FormDialog>
{:else if $modalContext.modal === 'deleterole'}
  <Dialog
    title='Delete Role'
    continueText='Delete'
    cancelText='Cancel'
    on:escape={modalContext.onModalEscape}
    on:continue={onDeleteRole}>
    {`Delete ${$store.selectedItems[0].name} role?`}
  </Dialog>
{/if}
