<script lang="ts" context="module">
  import applicationOutline from '@iconify-icons/mdi/application-outline'
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
import { api, ActionPanel, Tree, TreeStore, type TypedTreeItem, type SiteListSite } from '$lib'
</script>

<ActionPanel actions={[]}>
  <Tree {store} headers={[
     { id: 'name', label: 'Site Name', get: 'name', defaultWidth: '20%', icon: applicationOutline },
     { id: 'url', label: 'URL', get: 'url.prefix', defaultWidth: '20%' },
     { id: 'organization', label: 'Organization', get: 'organization.name', defaultWidth: '20%' },
     { id: 'owner', label: 'Owner', render: renderOwner, defaultWidth: '20%' }
  ]}>

  </Tree>
</ActionPanel>