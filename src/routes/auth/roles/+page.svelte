<script lang="ts">
  import { Dialog, FieldText, FormDialog, Tree, TreeStore, type TypedTreeItem } from '@dosgato/dialog'
  import keyIcon from '@iconify-icons/ph/key'
  import plusIcon from '@iconify-icons/mdi/plus'
  import deleteOutline from '@iconify-icons/mdi/delete-outline'
  import { goto } from '$app/navigation'
  import { base } from '$app/paths'
  import { ActionPanel, type ActionPanelAction, api, type RoleListRole, messageForDialog } from '$lib'

  type TypedRoleItem = TypedTreeItem<RoleListRole>

  async function fetchChildren (role?: TypedRoleItem) {
    if (role) return []
    return await api.getRoleList()
  }

  const store: TreeStore<RoleListRole> = new TreeStore(fetchChildren)

  function noneselectedactions () {
    const actions: ActionPanelAction[] = [
      { label: 'Add Role', icon: plusIcon, disabled: false, onClick: () => { modal = 'addrole' } }
    ]
    return actions
  }

  function singleactions (role: TypedRoleItem) {
    const actions: ActionPanelAction[] = [
      { label: 'Delete', icon: deleteOutline, disabled: !role.permissions.delete, onClick: () => { modal = 'deleterole' } }
    ]
    return actions
  }

  let modal: 'addrole'|'deleterole'|undefined

  async function validateAddRole (state) {
    const resp = await api.addRole(state.name, true)
    return resp.messages.map(m => ({ path: m.arg, type: m.type, message: m.message }))
  }

  async function onAddRole (state) {
    const resp = await api.addRole(state.name)
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
    store.refresh()
    modal = undefined
  }

  async function onDeleteRole () {
    const resp = await api.deleteRole($store.selectedItems[0].id)
    if (resp.success) store.refresh()
    modal = undefined
  }
</script>

<ActionPanel actionsTitle={$store.selected.size === 1 ? $store.selectedItems[0].name : 'Roles'} actions={$store.selected.size === 1 ? singleactions($store.selectedItems[0]) : noneselectedactions()}>
  <Tree singleSelect {store} on:choose={({ detail }) => goto(base + '/auth/roles/' + detail.id)} headers={[
    { id: 'name', label: 'Name', get: 'name', grow: 4, icon: keyIcon }
  ]}>
  </Tree>
</ActionPanel>
{#if modal === 'addrole'}
  <FormDialog
    submit={onAddRole}
    validate={validateAddRole}
    title='Add Role'
    name='addrole'
    on:escape={() => { modal = undefined }}
    on:saved={onCompleteAddRole}>
    <FieldText path='name' label='Name' required />
  </FormDialog>
{:else if modal === 'deleterole'}
  <Dialog
    title='Delete Role'
    continueText='Delete'
    cancelText='Cancel'
    on:escape={() => { modal = undefined }}
    on:continue={onDeleteRole}>
    {`Delete ${$store.selectedItems[0].name} role?`}
  </Dialog>
{/if}
