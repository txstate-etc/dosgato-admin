<script lang="ts">
  import { ActionPanel, type ActionPanelAction, api, type TemplateListTemplate, templateRegistry, uiLog, ModalContextStore } from '$lib'
  import { Dialog, Tree, TreeStore, type TypedTreeItem } from '@dosgato/dialog'
  import checkIcon from '@iconify-icons/mdi/check'
  import earthIcon from '@iconify-icons/mdi/earth'
  import earthOffIcon from '@iconify-icons/mdi/earth-off'
  import boundingBoxLight from '@iconify-icons/ph/bounding-box-light'
  import { setContext } from 'svelte'

  type TypedTemplateItem = TypedTreeItem<TemplateListTemplate>

  const actionPanelTarget: { target: string | undefined } = { target: undefined }
  setContext('ActionPanelTarget', { getTarget: () => actionPanelTarget.target })

  type Modals = 'setuniversal' | 'setrestricted'
  const modalContext = new ModalContextStore<Modals>(undefined, () => actionPanelTarget.target)

  async function fetchChildren (template?: TypedTemplateItem) {
    if (template) return []
    const templates = await api.getAllTemplates()
    return templates.map(t => ({ ...t, id: t.key }))
  }

  const store: TreeStore<TemplateListTemplate> = new TreeStore(fetchChildren)

  function singleactions (template: TypedTemplateItem) {
    const actions: ActionPanelAction[] = []
    if (template.universal) actions.push({ id: 'universalrestricted', label: 'Set Restricted', disabled: !template.permissions.setUniversal, onClick: () => modalContext.setModal('setrestricted'), icon: earthOffIcon })
    else actions.push({ id: 'universalrestricted', label: 'Set Universal', disabled: !template.permissions.setUniversal, onClick: () => modalContext.setModal('setuniversal'), icon: earthIcon })
    return actions
  }

  async function setUniversal (universal) {
    const resp = await api.setTemplateUniversal($store.selectedItems[0].key, universal)
    modalContext.logModalResponse(resp, $store.selectedItems[0].key, { universal })
    if (resp.success) {
      store.refresh()
      modalContext.reset()
    }
  }

  $: actionPanelTarget.target = uiLog.targetFromTreeStore($store, 'name')
</script>

<ActionPanel actionsTitle={$store.selected.size === 1 ? $store.selectedItems[0].name : 'Templates'} actions={$store.selected.size === 1 ? singleactions($store.selectedItems[0]) : []}>
  <Tree singleSelect {store} headers={[
    { id: 'name', label: 'Name', get: 'name', grow: 5, icon: itm => ({ icon: templateRegistry.getTemplate(itm.key)?.icon ?? boundingBoxLight }) },
    { id: 'key', label: 'Key', get: 'key', grow: 4 },
    { id: 'universal', label: 'Universal', icon: item => item.universal ? { icon: checkIcon, label: 'Universal' } : undefined, fixed: '6em' }
  ]}/>
</ActionPanel>
{#if $modalContext.modal === 'setuniversal'}
  <Dialog title="Make Template Universal" cancelText="Cancel" continueText="Set Universal" on:escape={modalContext.onModalEscape} on:continue={() => setUniversal(true)}>
    <span>{`Making the ${$store.selectedItems[0].name} template universal will allow it to be used on all sites and pagetrees.`}</span>
  </Dialog>
{:else if $modalContext.modal === 'setrestricted'}
  <Dialog title="Restrict Template Usage" cancelText="Cancel" continueText="Restrict" on:escape={modalContext.onModalEscape} on:continue={() => setUniversal(false)}>
    <span>Restricted templates must be improved for usage on individual sites and/or pagetrees. Proceed?</span>
  </Dialog>
{/if}
