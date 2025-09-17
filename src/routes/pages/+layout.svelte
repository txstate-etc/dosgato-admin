<script lang="ts">
  import { isNotBlank } from 'txstate-utils'
  import { actionPanelStore, TopSearchManager } from '$lib'
  import { _pagesStore as pagesStore, _searchStore as searchStore } from './+page'
  import { page } from '$app/stores'
  import { base } from '$app/paths'

  function handlePagesSearch (searchTerm: string) {
    const showsearch = isNotBlank(searchTerm)
    if (showsearch) {
      actionPanelStore.hide()
    }
    pagesStore.update(s => ({ ...s, search: searchTerm, showsearch }))
    // We need to refresh the search store to apply the new search term
    searchStore.refresh().catch(console.error)
  }
</script>

{#if $page.url.pathname === `${base}/pages`}
  <TopSearchManager
    placeholder="Search Pages"
    asYouType={false}
    filterStore={pagesStore}
    onSearch={handlePagesSearch}
  />
{/if}

<slot />

