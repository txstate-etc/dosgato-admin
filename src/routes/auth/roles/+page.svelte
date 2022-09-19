<script lang="ts">
  import keyLight from '@iconify-icons/ph/key-light'
  import { goto } from '$app/navigation'
  import { base } from '$app/paths'
  import { ActionPanel, type ActionPanelAction, api, Tree, TreeStore, type TypedTreeItem, type RoleListRole } from '$lib'

  type TypedRoleItem = TypedTreeItem<RoleListRole>

  async function fetchChildren (role?: TypedRoleItem) {
    if (role) return []
    return await api.getRoleList()
  }

  const store: TreeStore<RoleListRole> = new TreeStore(fetchChildren)

  function noneselectedactions () {
    const actions: ActionPanelAction[] = [
      { label: 'Add Role', disabled: false, onClick: () => {} }
    ]
    return actions
  }

  function singleactions (role: TypedRoleItem) {
    const actions: ActionPanelAction[] = [
      { label: 'Delete', disabled: !role.permissions.delete, onClick: () => {} }
    ]
    return actions
  }
</script>

<ActionPanel actions={$store.selected.size === 1 ? singleactions($store.selectedItems[0]) : noneselectedactions()}>
  <Tree singleSelect {store} on:choose={({ detail }) => goto(base + '/auth/roles/' + detail.id)} headers={[
    { id: 'name', label: 'Name', get: 'name', defaultWidth: '30%', icon: keyLight }
  ]}>
  </Tree>
</ActionPanel>
