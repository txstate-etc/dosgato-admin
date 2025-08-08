<script lang="ts">
  import { TopSearchManager } from '$lib'
  import { _roleFilterStore as roleFilterStore } from './+page'
</script>

<TopSearchManager
  placeholder="Search Roles"
  asYouType={true}
  filterStore={roleFilterStore}
/>

<slot />
