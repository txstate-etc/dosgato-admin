<script lang="ts">
  import { isNotBlank } from 'txstate-utils'
  import { actionPanelStore, TopSearchManager } from '$lib'
  import { _assetsStore as assetsStore, _searchStore as searchStore } from './+page'
  import { page } from '$app/stores'
  import { base } from '$app/paths'

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

{#if $page.url.pathname === `${base}/assets`}
  <TopSearchManager
    placeholder="Search Assets"
    asYouType={false}
    filterStore={assetsStore}
    onSearch={handleAssetsSearch}
  />
{/if}

<slot />
