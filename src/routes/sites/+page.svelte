<script lang="ts">
  import { Dialog, Tree, TreeStore, type TypedTreeItem } from '@dosgato/dialog'
  import globeLight from '@iconify-icons/ph/globe-light'
  import plusIcon from '@iconify-icons/mdi/plus'
  import deleteOutline from '@iconify-icons/mdi/delete-outline'
  import deleteRestore from '@iconify-icons/mdi/delete-restore'
  import downloadIcon from '@iconify-icons/ph/download-simple'
  import type { PopupMenuItem } from '@txstate-mws/svelte-components'
  import { goto } from '$app/navigation'
  import { base } from '$app/paths'
  import { api, ActionPanel, globalStore, type SiteListSite, type ActionPanelAction, type CreateWithPageState, CreateWithPageDialog, uiLog, ModalContextStore } from '$lib'
  import { buildAuditCSV } from './audit'
  import { setContext } from 'svelte'

  type TypedSiteItem = TypedTreeItem<SiteListSite>

  export let data: { pageTemplateChoices: PopupMenuItem[] }

  const actionPanelTarget: { target: string | undefined } = { target: undefined }
  setContext('ActionPanelTarget', { getTarget: () => actionPanelTarget.target })

  type Modals = 'addsite' | 'deletesite' | 'restoresite'
  const modalContext = new ModalContextStore<Modals>()

  async function fetchChildren (site?: TypedSiteItem) {
    if (site) return []
    const siteList = await api.getSiteList()
    return siteList
  }

  function renderOwner (site: TypedSiteItem) {
    return site.owner ? `${site.owner.name} (${site.owner.id})` : ''
  }

  const store: TreeStore<SiteListSite> = new TreeStore(fetchChildren)

  function noneSelectedActions () {
    // TODO: Do we need another permission for being able to download the audit CSV? I set it to the createSites permission right now
    // because very few people will be able to do that. We don't want everyone who can see a subset of the site list to be able to
    // see all sites information.
    return [
      { label: 'Add Site', icon: plusIcon, disabled: !$globalStore.access.createSites, onClick: () => modalContext.setModal('addsite') },
      { label: 'Download CSV', icon: downloadIcon, disabled: !$globalStore.access.createSites, onClick: () => downloadSitesAudit() }
    ]
  }

  function singleActions (item: TypedSiteItem) {
    const actions: ActionPanelAction[] = []
    if (item.deleted) {
      actions.push({ label: 'Undelete', icon: deleteRestore, disabled: !item.permissions.undelete, onClick: () => modalContext.setModal('restoresite') })
    } else {
      actions.push({ label: 'Delete', icon: deleteOutline, disabled: !item.permissions.delete, onClick: () => modalContext.setModal('deletesite') })
    }
    return actions
  }

  function getActions (selectedItems: TypedSiteItem[]) {
    if (selectedItems.length === 0) return noneSelectedActions()
    if (selectedItems.length === 1) return singleActions(selectedItems[0])
    return []
  }

  async function validateCreateSite (state: CreateWithPageState) {
    const resp = await api.addSite(state.name!, state.templateKey, state.data, true)
    return resp.messages.map(m => ({ ...m, path: m.arg }))
  }

  async function onCreateSite (state: CreateWithPageState) {
    const resp = await api.addSite(state.name!, state.templateKey, state.data)
    modalContext.logModalResponse(resp, state.name, { templateKey: state.templateKey })
    return {
      success: resp.success,
      messages: resp.messages.map(m => ({ ...m, path: m.arg })),
      data: state
    }
  }

  function onCreateSiteComplete () {
    store.refresh()
    modalContext.reset()
  }

  async function onDeleteSite () {
    const resp = await api.deleteSite($store.selectedItems[0].id)
    modalContext.logModalResponse(resp, $store.selectedItems[0].id)
    if (resp.success) store.refresh()
    modalContext.reset()
  }

  async function onRestoreSite () {
    // TODO
    // - Implement Function and update modalContext.log... statement to pass response of api.restoreSite instead of success=false.
    modalContext.logModalResponse({ success: false }, $store.selectedItems[0].id)
  }

  async function downloadSitesAudit () {
    const sitesCSV = await buildAuditCSV()
    const j = document.createElement('a')
    j.download = 'siteaudit_' + Date.now() + '.csv'
    j.href = URL.createObjectURL(new Blob([sitesCSV]))
    j.click()
  }

  $: actionPanelTarget.target = uiLog.targetFromTreeStore($store, 'name')
</script>

<ActionPanel actionsTitle={$store.selected.size === 1 ? $store.selectedItems[0].name : 'Sites'} actions={getActions($store.selectedItems)}>
  <Tree singleSelect {store}  on:choose={({ detail }) => goto(base + '/sites/' + detail.id)} headers={[
     { id: 'name', label: 'Site Name', get: 'name', grow: 10, icon: { icon: globeLight } },
     { id: 'url', label: 'URL', get: 'url.prefix', grow: 10 },
     { id: 'organization', label: 'Organization', get: 'organization.name', grow: 8 },
     { id: 'owner', label: 'Owner', render: renderOwner, grow: 7 }
  ]} searchable='name'>
  </Tree>
</ActionPanel>
{#if $modalContext.modal === 'addsite'}
  <CreateWithPageDialog
    title='Create Site'
    propertyDialogTitle= 'Root Page Properties'
    submit={onCreateSite}
    on:escape={modalContext.onModalEscape}
    validate={validateCreateSite}
    templateChoices={data.pageTemplateChoices}
    on:saved={onCreateSiteComplete}
    creatingSite={true}
  />
{:else if $modalContext.modal === 'deletesite'}
  <Dialog
    title='Delete Site'
    continueText='Delete Site'
    cancelText='Cancel'
    on:continue={onDeleteSite}
    on:escape={modalContext.onModalEscape}>
    {`Are you sure you want to delete ${$store.selectedItems[0].name}?`}
  </Dialog>
{:else if $modalContext.modal === 'restoresite'}
  <Dialog
    title='Restore Site'
    continueText='Restore Site'
    cancelText='Cancel'
    on:continue={onRestoreSite}
    on:escape={modalContext.onModalEscape}>
    {`Restore ${$store.selectedItems[0].name}?`}
  </Dialog>
{/if}
