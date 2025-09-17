<script lang="ts">
  import { TopSearchManager } from '$lib'
  import { _userFilterStore as userFilterStore } from './+page'
  import { page } from '$app/stores'
  import { base } from '$app/paths'
</script>

{#if $page.url.pathname === `${base}/auth/users`}
  <TopSearchManager
    placeholder="Search Users"
    asYouType={true}
    filterStore={userFilterStore}
  />
{/if}

<slot />
