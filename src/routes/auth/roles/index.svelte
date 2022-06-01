<script lang="ts" context="module">
  import { ActionPanel, type ActionPanelAction, api, Tree, TreeStore, type TypedTreeItem, type RoleListRole } from '$lib'

  type TypedRoleItem = TypedTreeItem<RoleListRole>

  async function fetchChildren (role?: TypedRoleItem) {
    if (role) return []
    return await api.getRoleList()
  }

  const store: TreeStore<RoleListRole> = new TreeStore(fetchChildren)
</script>

<script lang="ts">
  function noneselectedactions () {
    const actions: ActionPanelAction[] = [
      { label: 'Add Role', disabled: false, onClick: () => {} }
    ]
    return actions
  }

  function singleactions (user: TypedRoleItem) {
    const actions: ActionPanelAction[] = [
      { label: 'Edit', disabled: false, onClick: () => {} },
      { label: 'Delete', disabled: false, onClick: () => {} }
    ]
    return actions
  }
</script>

<ActionPanel actions={$store.selected.size === 1 ? singleactions($store.selectedItems[0]) : noneselectedactions()}>
  <Tree singleSelect {store} headers={[
    { id: 'name', label: 'Name', get: 'name', defaultWidth: '30%' }
  ]}>
  </Tree>
</ActionPanel>