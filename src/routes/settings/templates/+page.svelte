<script lang="ts">
  import { ActionPanel, type ActionPanelAction, api, Tree, TreeStore, type TypedTreeItem, type TemplateListTemplate } from '$lib'
  import checkIcon from '@iconify-icons/mdi/check'
  import earthIcon from '@iconify-icons/mdi/earth'
  import earthOffIcon from '@iconify-icons/mdi/earth-off'
  type TypedTemplateItem = TypedTreeItem<TemplateListTemplate>

  async function fetchChildren (template?: TypedTemplateItem) {
    if (template) return []
    const templates = await api.getAllTemplates()
    return templates.map(t => ({ ...t, id: t.key }))
  }

  const store: TreeStore<TemplateListTemplate> = new TreeStore(fetchChildren)

  function singleactions (template: TypedTemplateItem) {
    const actions: ActionPanelAction[] = []
    if (template.universal) actions.push({ id: 'universalrestricted', label: 'Set Restricted', disabled: false, onClick: () => {}, icon: earthOffIcon })
    else actions.push({ id: 'universalrestricted', label: 'Set Universal', disabled: false, onClick: () => {}, icon: earthIcon })
    return actions
  }

</script>

<ActionPanel actions={$store.selected.size === 1 ? singleactions($store.selectedItems[0]) : []}>
  <Tree singleSelect {store} headers={[
    { id: 'key', label: 'Key', get: 'key', defaultWidth: '25%' },
    { id: 'name', label: 'Name', get: 'name', defaultWidth: '25%' },
    { id: 'universal', label: 'Universal', icon: item => item.universal ? checkIcon : undefined, defaultWidth: '25%' }
  ]}/>
</ActionPanel>