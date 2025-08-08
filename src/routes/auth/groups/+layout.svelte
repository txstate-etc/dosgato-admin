<script lang="ts">
  import { TopSearchManager } from '$lib'
  import { _groupFilterStore as groupFilterStore } from './+page'
</script>

<TopSearchManager
  placeholder="Search Groups"
  asYouType={true}
  filterStore={groupFilterStore}
  showSearch={false}
/>

<slot />
