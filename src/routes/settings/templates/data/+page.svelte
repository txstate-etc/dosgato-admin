<script lang="ts">
  import { api, TemplatesListPage, type AnyTemplateTreeItem, type TypedTemplateTreeItem } from '$lib'
  import { TreeStore } from '@dosgato/dialog'
  import { templateFilterStore } from '../templateFilterStore'

  async function fetchChildren (template?: TypedTemplateTreeItem) {
    if (template) return []
    const templates = await api.getTemplatesWithAreasByType('DATA')
    return templates.map(t => ({ ...t, type: 'template' as const, hasChildren: false }))
  }

  const store = new TreeStore<AnyTemplateTreeItem>(fetchChildren)

</script>

<TemplatesListPage type="data" {store} filter={$templateFilterStore.search} />
