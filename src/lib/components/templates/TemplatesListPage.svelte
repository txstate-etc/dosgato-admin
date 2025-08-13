<script lang="ts">
  import { titleCase } from 'txstate-utils'
  import { ActionPanel, api, ModalContextStore, templateRegistry, uiLog, type ActionPanelAction, type TemplateListTemplateArea, type TemplateListTemplateWithAreas } from '$lib'
  import { setContext } from 'svelte'
  import { goto } from '$app/navigation'
  import { base } from '$app/paths'
  import { Dialog, Tree, type TreeStore, type TreeHeader } from '@dosgato/dialog'
  import checkIcon from '@iconify-icons/mdi/check'
  import earthIcon from '@iconify-icons/mdi/earth'
  import earthOffIcon from '@iconify-icons/mdi/earth-off'
  import boundingBoxLight from '@iconify-icons/ph/bounding-box-light'
  import selectionPlus from '@iconify-icons/ph/selection-plus'
  import type { AnyTemplateTreeItem, TreeTemplate, TreeTemplateArea, TypedTemplateTreeItem } from './templatetree'

  type T = $$Generic<TreeItemFromDB>

  export let type: 'page' | 'component' | 'data'
  export let store: TreeStore<T>
  export let filter = ''

  const actionPanelTarget: { target: string | undefined } = { target: undefined }
  setContext('ActionPanelTarget', { getTarget: () => actionPanelTarget.target })

  type Modals = 'setuniversal' | 'setrestricted'
  const modalContext = new ModalContextStore<Modals>(undefined, () => actionPanelTarget.target)

  function singleactions (template: TreeTemplate | TreeTemplateArea) {
    if (type === 'data' || template.type === 'area') return []
    const actions: ActionPanelAction[] = []
    if (template.universal) actions.push({ id: 'universalrestricted', label: 'Set Restricted', disabled: !template.permissions.setUniversal, onClick: () => modalContext.setModal('setrestricted'), icon: earthOffIcon })
    else actions.push({ id: 'universalrestricted', label: 'Set Universal', disabled: !template.permissions.setUniversal, onClick: () => modalContext.setModal('setuniversal'), icon: earthIcon })
    return actions
  }

  async function setUniversal (universal) {
    if ($store.selectedItems[0].type === 'template') {
      const resp = await api.setTemplateUniversal($store.selectedItems[0].key, universal)
      modalContext.logModalResponse(resp, $store.selectedItems[0].key, { universal })
      if (resp.success) {
        void store.refresh()
        modalContext.reset()
      }
    }
  }

  $: actionPanelTarget.target = uiLog.targetFromTreeStore($store, 'name')

  function handleResponsiveHeaders (treeWidth: number) {
    if (treeWidth > 500) {
      return ['name', 'key', 'type', 'restricted']
    } else {
      return ['name', 'key']
    }
  }

  const treeHeaders: TreeHeader<TreeTemplate | TreeTemplateArea>[] = [
    { id: 'name', label: 'Name', get: 'name', grow: 5, icon: itm => ({ icon: itm.type === 'template' ? (templateRegistry.getTemplate(itm.key)?.icon ?? boundingBoxLight) : selectionPlus }) },
    { id: 'key', label: 'Key', get: 'key', grow: 4 }
  ]
  if (type !== 'data') {
    treeHeaders.push({ id: 'restricted', label: 'Restricted', icon: item => item.type === 'template' && !item.universal ? { icon: checkIcon, label: 'Restricted' } : undefined, fixed: '6em' })
  }
</script>

{#if filter}
  <div class="searching">Search results for "{filter}"...</div>
{/if}
<ActionPanel actionsTitle={$store.selected.size === 1 ? $store.selectedItems[0].name : `${titleCase(type)} Templates`} actions={$store.selected.size === 1 ? singleactions($store.selectedItems[0]) : []}>
  <Tree singleSelect {store} on:choose={({ detail }) => { if (detail.type === 'template') void goto(base + '/settings/templates/' + detail.id) }} headers={treeHeaders} enableResize responsiveHeaders={handleResponsiveHeaders} searchable={['name', 'id']} {filter}/>
</ActionPanel>
{#if $modalContext.modal === 'setuniversal'}
  <Dialog title="Make Template Universal" cancelText="Cancel" continueText="Set Universal" on:escape={modalContext.onModalEscape} on:continue={async () => await setUniversal(true)}>
    <span>{`Making the ${$store.selectedItems[0].name} template universal will allow it to be used on all sites and pagetrees.`}</span>
  </Dialog>
{:else if $modalContext.modal === 'setrestricted'}
  <Dialog title="Restrict Template Usage" cancelText="Cancel" continueText="Restrict" on:escape={modalContext.onModalEscape} on:continue={async () => await setUniversal(false)}>
    <span>Restricted templates must be improved for usage on individual sites and/or pagetrees. Proceed?</span>
  </Dialog>
{/if}
