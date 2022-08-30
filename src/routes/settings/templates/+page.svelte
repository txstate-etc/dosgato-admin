<script lang="ts">
  import { ActionPanel, type ActionPanelAction, api, Tree, TreeStore, type TypedTreeItem, type TemplateListTemplate } from '$lib'
  import checkIcon from '@iconify-icons/mdi/check'
  import earthIcon from '@iconify-icons/mdi/earth'
  import earthOffIcon from '@iconify-icons/mdi/earth-off'
  import Dialog from '$lib/components/Dialog.svelte'

  type TypedTemplateItem = TypedTreeItem<TemplateListTemplate>

  let modal: 'setuniversal'|'setrestricted'|undefined = undefined

  async function fetchChildren (template?: TypedTemplateItem) {
    if (template) return []
    const templates = await api.getAllTemplates()
    return templates.map(t => ({ ...t, id: t.key }))
  }

  const store: TreeStore<TemplateListTemplate> = new TreeStore(fetchChildren)

  function singleactions (template: TypedTemplateItem) {
    const actions: ActionPanelAction[] = []
    if (template.universal) actions.push({ id: 'universalrestricted', label: 'Set Restricted', disabled: !template.permissions.setUniversal, onClick: () => { modal = 'setrestricted' }, icon: earthOffIcon })
    else actions.push({ id: 'universalrestricted', label: 'Set Universal', disabled: !template.permissions.setUniversal, onClick: () => { modal = 'setuniversal' }, icon: earthIcon })
    return actions
  }

  async function setUniversal (universal) {
    const resp = await api.setTemplateUniversal($store.selectedItems[0].key, universal)
    if (resp.success) {
      store.refresh()
      modal = undefined
    }
  }

</script>

<ActionPanel actions={$store.selected.size === 1 ? singleactions($store.selectedItems[0]) : []}>
  <Tree singleSelect {store} headers={[
    { id: 'key', label: 'Key', get: 'key', defaultWidth: '25%' },
    { id: 'name', label: 'Name', get: 'name', defaultWidth: '25%' },
    { id: 'universal', label: 'Universal', icon: item => item.universal ? checkIcon : undefined, defaultWidth: '25%' }
  ]}/>
</ActionPanel>
{#if modal === 'setuniversal'}
  <Dialog title="Make Template Universal" cancelText="Cancel" continueText="Set Universal" on:dismiss={() => { modal = undefined }} on:continue={() => setUniversal(true)}>
    <span>{`Making the ${$store.selectedItems[0].name} template universal will allow it to be used on all sites and pagetrees.`}</span>
  </Dialog>
{:else if modal === 'setrestricted'}
  <Dialog title="Restrict Template Usage" cancelText="Cancel" continueText="Restrict" on:dismiss={() => { modal = undefined }} on:continue={() => setUniversal(false)}>
    <span>Restricted templates must be improved for usage on individual sites and/or pagetrees. Proceed?</span>
  </Dialog>
{/if}