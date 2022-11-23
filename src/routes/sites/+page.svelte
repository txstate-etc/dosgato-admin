<script lang="ts">
  import { Dialog, Tree, TreeStore, type TypedTreeItem } from '@dosgato/dialog'
  import globeLight from '@iconify-icons/ph/globe-light'
  import plusIcon from '@iconify-icons/mdi/plus'
  import deleteOutline from '@iconify-icons/mdi/delete-outline'
  import deleteRestore from '@iconify-icons/mdi/delete-restore'
  import type { PopupMenuItem } from '@txstate-mws/svelte-components'
  import { goto } from '$app/navigation'
  import { base } from '$app/paths'
  import { api, ActionPanel, globalStore, type SiteListSite, type ActionPanelAction, type CreateWithPageState, CreateWithPageDialog } from '$lib'

  type TypedSiteItem = TypedTreeItem<SiteListSite>

  export let data: { pageTemplateChoices: PopupMenuItem[] }

  let modal: 'addsite'|'deletesite'|'restoresite'|undefined

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
    return [
      { label: 'Add Site', icon: plusIcon, disabled: !$globalStore.access.createSites, onClick: () => { modal = 'addsite' } }
    ]
  }
  function singleActions (item: TypedSiteItem) {
    const actions: ActionPanelAction[] = []
    if (item.deleted) {
      actions.push({ label: 'Undelete', icon: deleteRestore, disabled: !item.permissions.undelete, onClick: () => { modal = 'restoresite' } })
    } else {
      actions.push({ label: 'Delete', icon: deleteOutline, disabled: !item.permissions.delete, onClick: () => { modal = 'deletesite' } })
    }
    return actions
  }

  function getActions (selectedItems: TypedSiteItem[]) {
    if (selectedItems.length === 0) return noneSelectedActions()
    if (selectedItems.length === 1) return singleActions(selectedItems[0])
    return []
  }

  async function validateCreateSite (state: CreateWithPageState) {
    const resp = await api.addSite(state.name, state.templateKey, state.data, true)
    return resp.messages.map(m => ({ ...m, path: m.arg }))
  }

  async function onCreateSite (state: CreateWithPageState) {
    const resp = await api.addSite(state.name, state.templateKey, state.data)
    return {
      success: resp.success,
      messages: resp.messages.map(m => ({ ...m, path: m.arg })),
      data: state
    }
  }

  function onCreateSiteComplete () {
    store.refresh()
    modal = undefined
  }

  async function onDeleteSite () {
    const resp = await api.deleteSite($store.selectedItems[0].id)
    if (resp.success) store.refresh()
    modal = undefined
  }

  async function onRestoreSite () {
    // TODO
  }
</script>

<ActionPanel actionsTitle={$store.selected.size === 1 ? $store.selectedItems[0].name : 'Sites'} actions={getActions($store.selectedItems)}>
  <Tree singleSelect {store}  on:choose={({ detail }) => goto(base + '/sites/' + detail.id)} headers={[
     { id: 'name', label: 'Site Name', get: 'name', grow: 10, icon: globeLight },
     { id: 'url', label: 'URL', get: 'url.prefix', grow: 10 },
     { id: 'organization', label: 'Organization', get: 'organization.name', grow: 8 },
     { id: 'owner', label: 'Owner', render: renderOwner, grow: 7 }
  ]}>
  </Tree>
</ActionPanel>
{#if modal === 'addsite'}
  <CreateWithPageDialog
    title='Create Site'
    submit={onCreateSite}
    on:escape={() => { modal = undefined }}
    validate={validateCreateSite}
    templateChoices={data.pageTemplateChoices}
    on:saved={onCreateSiteComplete}
  />
{:else if modal === 'deletesite'}
  <Dialog
    title='Delete Site'
    continueText='Delete Site'
    cancelText='Cancel'
    on:continue={onDeleteSite}
    on:escape={() => { modal = undefined }}>
    {`Are you sure you want to delete ${$store.selectedItems[0].name}?`}
  </Dialog>
{:else if modal === 'restoresite'}
  <Dialog
    title='Restore Site'
    continueText='Restore Site'
    cancelText='Cancel'
    on:continue={onRestoreSite}
    on:escape={() => { modal = undefined }}>
    {`Restore ${$store.selectedItems[0].name}?`}
  </Dialog>
{/if}
