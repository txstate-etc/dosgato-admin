<script lang="ts">
  import { topSearchStore } from '$lib/stores/topsearch'
  import { onDestroy, onMount } from 'svelte'
  import type { Store } from '@txstate-mws/svelte-store'

  export let placeholder: string
  export let asYouType: boolean
  export let filterStore: Store<{ search: string }>
  export let onSearch: ((searchTerm: string) => void) | undefined = undefined
  export let showSearch: boolean = true

  function handleSearch (searchTerm: string) {
    if (onSearch) {
      onSearch(searchTerm)
    } else {
      filterStore.update(s => ({ ...s, search: searchTerm }))
    }
  }

  onMount(() => {
    // When this component mounts, we tell the top search to become visible,
    // set its properties, and sync its input with our current search term.
    topSearchStore.update(s => ({
      ...s,
      show: showSearch,
      asYouType,
      placeholder,
      searchInput: (filterStore as any).value.search
    }))
    // We also provide the search function to be called by the top search bar.
    topSearchStore.topSearchFn = handleSearch
  })

  onDestroy(() => {
    // When leaving the section, hide the search bar, reset its state,
    // and remove the search function.
    topSearchStore.update(v => ({ ...v, show: false, placeholder: 'Search...', searchInput: '' }))
    topSearchStore.topSearchFn = null
  })
</script>