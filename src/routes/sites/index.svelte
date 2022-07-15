<script lang="ts" context="module">
  import applicationOutline from '@iconify-icons/mdi/application-outline'
  import plusIcon from '@iconify-icons/mdi/plus'
  import deleteOutline from '@iconify-icons/mdi/delete-outline'
  import deleteRestore from '@iconify-icons/mdi/delete-restore'
  type TypedSiteItem = TypedTreeItem<SiteListSite>

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
import { api, ActionPanel, Tree, TreeStore, type TypedTreeItem, type SiteListSite, type ActionPanelAction } from '$lib'

function noneSelectedActions () {
  return [
    { label: 'Add Site', icon: plusIcon, disabled: false, onClick: () => {} }
  ]
}
function singleActions (item: TypedSiteItem) {
  const actions: ActionPanelAction[] = []
  if (item.deleted) {
    actions.push({ label: 'Undelete', icon: deleteRestore, disabled: false, onClick: () => {} })
  } else {
    actions.push({ label: 'Delete', icon: deleteOutline, disabled: false, onClick: () => {} })
  }
  return actions
}

function getActions (selectedItems: TypedSiteItem[]) {
  if (selectedItems.length === 0) return noneSelectedActions()
  if (selectedItems.length === 1) return singleActions(selectedItems[0])
  return []
}
</script>

<ActionPanel  actions={getActions($store.selectedItems)}>
  <Tree singleSelect {store} headers={[
     { id: 'name', label: 'Site Name', get: 'name', defaultWidth: '20%', icon: applicationOutline },
     { id: 'url', label: 'URL', get: 'url.prefix', defaultWidth: '20%' },
     { id: 'organization', label: 'Organization', get: 'organization.name', defaultWidth: '20%' },
     { id: 'owner', label: 'Owner', render: renderOwner, defaultWidth: '20%' }
  ]}>

  </Tree>
</ActionPanel>