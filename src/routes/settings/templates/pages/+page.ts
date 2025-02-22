import { api, type AnyTemplateTreeItem, type TypedTemplateTreeItem } from '$lib'
import { TreeStore } from '@dosgato/dialog'

async function fetchChildren (item?: TypedTemplateTreeItem) {
  if (!item) {
    const templates = await api.getTemplatesWithAreasByType('PAGE')
    return templates.map(t => ({ ...t, type: 'template' as const, hasChildren: t.areas.length > 0 }))
  } else {
    if (item.type === 'area') {
      // get components in area
      const parentTemplateKey = item.id.slice(0, (item.id.length - `_${item.name}`.length))
      const parentTemplate = await api.getTemplateWithAreasByKey(parentTemplateKey)
      for (const area of parentTemplate.areas) {
        if (area.name === item.name) {
          return area.availableComponents.map(c => ({
            ...c,
            type: 'template' as const,
            hasChildren: c.areas.length > 0
          }))
        }
      }
    } else {
      // get areas in component/page
      const areas = await api.getTemplateAreas(item.key)
      return areas.map(a => ({
        ...a,
        type: 'area' as const,
        hasChildren: a.availableComponents.length > 0
      }))
    }
  }
  return []
}

export const _store = new TreeStore<AnyTemplateTreeItem>(fetchChildren)
