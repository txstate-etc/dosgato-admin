<script lang="ts">
  import { api, TemplatesListPage, type AnyTemplateTreeItem, type TypedTemplateTreeItem } from '$lib'
  import { TreeStore } from '@dosgato/dialog'

  async function fetchChildren (template?: TypedTemplateTreeItem) {
    if (template) return []
    const templates = await api.getTemplatesWithAreassByType('DATA')
    return templates.map(t => ({ ...t, type: 'template' as const, hasChildren: false }))
  }

  const store = new TreeStore<AnyTemplateTreeItem>(fetchChildren)

</script>

<TemplatesListPage type="data" {store} />
