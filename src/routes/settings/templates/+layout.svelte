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

  const templatePagePaths = [
    `${base}/settings/templates/components`,
    `${base}/settings/templates/data`,
    `${base}/settings/templates/pages`]
</script>

{#if templatePagePaths.includes($page.url.pathname)}
  <TopSearchManager
    placeholder="Search Templates"
    asYouType={true}
    filterStore={templateFilterStore}
  />
{/if}

<slot />
