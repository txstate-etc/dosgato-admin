<script lang="ts" context="module">
  import pencilIcon from '@iconify-icons/mdi/pencil'
  import accountMultiplePlusOutline from '@iconify-icons/mdi/account-multiple-plus-outline'
  import accountMultipleRemoveOutline from '@iconify-icons/mdi/account-multiple-remove-outline'
  import { ActionPanel, type ActionPanelAction, api, Tree, TreeStore, type TypedTreeItem, type GroupListGroup } from '$lib'

  type TypedGroupItem = TypedTreeItem<GroupListGroup>

  async function fetchChildren (group?: TypedGroupItem) {
    if (group) return []
    return await api.getGroupList()
  }

  const store: TreeStore<GroupListGroup> = new TreeStore(fetchChildren)
</script>

<script lang="ts">
  import { goto } from '$app/navigation'
  import { base } from '$app/paths'

  function noneselectedactions () {
    const actions: ActionPanelAction[] = [
      { label: 'Add Group', icon: accountMultiplePlusOutline, disabled: false, onClick: () => {} }
    ]
    return actions
  }

  function singleactions (user: TypedGroupItem) {
    const actions: ActionPanelAction[] = [
      { label: 'Edit', icon: pencilIcon, disabled: false, onClick: () => {} },
      { label: 'Delete', icon: accountMultipleRemoveOutline, disabled: false, onClick: () => {} }
    ]
    return actions
  }

</script>

<ActionPanel actions={$store.selected.size === 1 ? singleactions($store.selectedItems[0]) : noneselectedactions()}>
  <Tree singleSelect {store} on:choose={({ detail }) => goto(base + '/auth/groups/' + detail.id)} headers ={[
    { id: 'name', label: 'Name', get: 'name', defaultWidth: '30%' },
    { id: 'managers', label: 'Managers', render: item => (item.managers.map(m => m.name)).join(', '), defaultWidth: '30%' },
    { id: 'roles', label: 'Roles', render: item => (item.roles.map(r => r.name)).join(', '), defaultWidth: '30%' }
  ]}/>
</ActionPanel>
