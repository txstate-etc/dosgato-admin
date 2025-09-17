<script lang="ts">
  import { TopSearchManager, topSearchStore } from '$lib'
  import { templateFilterStore } from './templateFilterStore'
  import { afterNavigate } from '$app/navigation'
  import { page } from '$app/stores'
  import { base } from '$app/paths'

  afterNavigate(() => {
    topSearchStore.reset()
    templateFilterStore.set({ search: '' })
  })
</script>

{#if $page.url.pathname === `${base}/settings/templates`}
  <TopSearchManager
    placeholder="Search Templates"
    asYouType={true}
    filterStore={templateFilterStore}
  />
{/if}

<slot />
