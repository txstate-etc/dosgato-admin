<script lang="ts">
  import { TopSearchManager } from '$lib'
  import { _siteFilterStore as siteFilterStore } from './+page'
  import { page } from '$app/stores'
  import { base } from '$app/paths'
</script>

{#if $page.url.pathname === `${base}/sites`}
  <TopSearchManager
    placeholder="Search Sites"
    asYouType={true}
    filterStore={siteFilterStore}
  />
{/if}

<slot />
