<script lang="ts">
  import { isNotBlank } from 'txstate-utils'
  import { actionPanelStore, TopSearchManager } from '$lib'
  import { _assetsStore as assetsStore, _searchStore as searchStore } from './+page'

  function handleAssetsSearch (searchTerm: string) {
    const showsearch = isNotBlank(searchTerm)
    if (showsearch) {
      actionPanelStore.hide()
    }
    assetsStore.update(s => ({ ...s, search: searchTerm, showsearch }))
    // We need to refresh the search store to apply the new search term
    searchStore.refresh().catch(console.error)
  }
</script>

<TopSearchManager
  placeholder="Search Assets"
  asYouType={false}
  filterStore={assetsStore}
  onSearch={handleAssetsSearch}
/>

<slot />
