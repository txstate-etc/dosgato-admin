<script lang="ts" context="module">
  import pencilIcon from '@iconify-icons/mdi/pencil'

  type TypedDataTemplateItem = TypedTreeItem<TemplateListTemplate>

  async function fetchChildren (template?: TypedDataTemplateItem) {
  if (template) return []
    return await api.getDataTemplates()
  }

  function actions (template: TypedDataTemplateItem) {
    return [
      { label: 'Edit', icon: pencilIcon, disabled: false, onClick: () => goto(base + '/data/' + template.id) }
    ]
  }

  const store: TreeStore<TemplateListTemplate> = new TreeStore(fetchChildren)
</script>
<script lang="ts">
  import { ActionPanel, TreeStore, Tree, api, type TypedTreeItem, type TemplateListTemplate } from '$lib'
  import { goto } from '$app/navigation'
  import { base } from '$app/paths'
</script>


<ActionPanel actions={actions($store.selectedItems[0])}>
  <Tree singleSelect {store} on:choose={({ detail }) => goto(base + '/data/' + detail.id)} headers={[
    { label: 'Name', id: 'name', defaultWidth: 'calc(25%)', get: 'name' },
    { label: 'Key', id: 'key', defaultWidth: 'calc(25%)', get: 'key' }
  ]}/>
</ActionPanel>
