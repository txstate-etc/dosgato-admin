<script lang="ts">
  import { TopSearchManager } from '$lib'
  import { _siteFilterStore as siteFilterStore } from './+page'
</script>

<TopSearchManager
  placeholder="Search Sites"
  asYouType={true}
  filterStore={siteFilterStore}
/>

<slot />
