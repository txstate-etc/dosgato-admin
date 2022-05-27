<script lang="ts" context="module">
  import { ActionPanel, type ActionPanelAction, api, Tree, TreeStore, type TypedTreeItem, type GroupListGroup } from '$lib'
  import type { Load } from '@sveltejs/kit'

  type TypedGroupItem = TypedTreeItem<GroupListGroup>
  export const load: Load = async (input) => {
    const groups = await api.getGroupList()
    return {}
  }

  async function fetchChildren (group?: TypedGroupItem) {
    if (group) return []
    return await api.getGroupList()
  }

  const store: TreeStore<GroupListGroup> = new TreeStore(fetchChildren)
</script>

<script lang="ts">

</script>

<ActionPanel actions={[]}>
  <Tree {store} headers ={[
    { id: 'name', label: 'Name', get: 'name', defaultWidth: '25%' }
  ]}/>
</ActionPanel>
