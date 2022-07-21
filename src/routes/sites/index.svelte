<script lang="ts" context="module">
  import type { Load } from '@sveltejs/kit'
  import applicationOutline from '@iconify-icons/mdi/application-outline'
  import plusIcon from '@iconify-icons/mdi/plus'
  import deleteOutline from '@iconify-icons/mdi/delete-outline'
  import deleteRestore from '@iconify-icons/mdi/delete-restore'
  type TypedSiteItem = TypedTreeItem<SiteListSite>

  let pageTemplateChoices: PopupMenuItem[] = []

  export const load: Load = async (input) => {
    const pageTemplates = await api.getTemplatesByType('PAGE')
    pageTemplateChoices = pageTemplates.map(t => ({ label: t.name, value: t.id }))
    return {}
  }

  async function fetchChildren (site?: TypedSiteItem) {
    if (site) return []
    const siteList = await api.getSiteList()
    return siteList
  }
  function renderOwner (site: TypedSiteItem) {
    return `${site.owner.name} (${site.owner.id})`
  }
  const store: TreeStore<SiteListSite> = new TreeStore(fetchChildren)
</script>

<script lang="ts">
import { api, ActionPanel, Tree, TreeStore, globalStore, type TypedTreeItem, type SiteListSite, type ActionPanelAction, type TemplateListTemplate } from '$lib'
import Dialog from '$lib/components/Dialog.svelte'
import FormDialog from '$lib/components/FormDialog.svelte'
import { FieldText, FieldSelect } from '@dosgato/dialog'
import type { PopupMenuItem } from '@txstate-mws/svelte-components'
import { goto } from '$app/navigation'
import { base } from '$app/paths'

let modal: 'addsite'|'deletesite'|'restoresite'|undefined

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

async function onCreateSite (state) {
  // TODO
  return { success: true, messages: [], data: {} }
}

async function onDeleteSite () {
  // TODO
}

async function onRestoreSite () {
  // TODO
}
</script>

<ActionPanel  actions={getActions($store.selectedItems)}>
  <Tree singleSelect {store}  on:choose={({ detail }) => goto(base + '/sites/' + detail.id)} headers={[
     { id: 'name', label: 'Site Name', get: 'name', defaultWidth: '20%', icon: applicationOutline },
     { id: 'url', label: 'URL', get: 'url.prefix', defaultWidth: '20%' },
     { id: 'organization', label: 'Organization', get: 'organization.name', defaultWidth: '20%' },
     { id: 'owner', label: 'Owner', render: renderOwner, defaultWidth: '20%' }
  ]}>
  </Tree>
</ActionPanel>
{#if modal === 'addsite'}
  <FormDialog
    submit={onCreateSite}
    title='Create Site'
    name='createsite'
    on:dismiss={() => { modal = undefined }}>
    <FieldText path='name' label='Site Name'/>
    <FieldSelect path='template' label='Root Page Template' choices={pageTemplateChoices} placeholder='Select'/>
  </FormDialog>
{:else if modal === 'deletesite'}
  <Dialog
    title='Delete Site'
    continueText='Delete Site'
    cancelText='Cancel'
    on:continue={onDeleteSite}
    on:dismiss={() => { modal = undefined }}>
    {`Delete ${$store.selectedItems[0].name}?`}
  </Dialog>
{:else if modal === 'restoresite'}
  <Dialog
    title='Restore Site'
    continueText='Restore Site'
    cancelText='Cancel'
    on:continue={onRestoreSite}
    on:dismiss={() => { modal = undefined }}>
    {`Restore ${$store.selectedItems[0].name}?`}
  </Dialog>
{/if}