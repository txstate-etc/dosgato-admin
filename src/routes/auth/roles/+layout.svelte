<script lang="ts">
  import { TopSearchManager } from '$lib'
  import { _roleFilterStore as roleFilterStore } from './+page'
  import { page } from '$app/stores'
  import { base } from '$app/paths'
</script>

{#if $page.url.pathname === `${base}/auth/roles`}
  <TopSearchManager
    placeholder="Search Roles"
    asYouType={true}
    filterStore={roleFilterStore}
  />
{/if}

<slot />
