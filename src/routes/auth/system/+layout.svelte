<script lang="ts">
  import { TopSearchManager } from '$lib'
  import { _userFilterStore as userFilterStore } from './+page'
</script>

<TopSearchManager
  placeholder="Search Users"
  asYouType={true}
  filterStore={userFilterStore}
/>

<slot />
