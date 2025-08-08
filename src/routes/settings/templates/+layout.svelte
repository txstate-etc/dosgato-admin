<script lang="ts">
  import { TopSearchManager, topSearchStore } from '$lib'
  import { templateFilterStore } from './templateFilterStore'
  import { afterNavigate } from '$app/navigation'

  afterNavigate(() => {
    topSearchStore.reset()
    templateFilterStore.set({ search: '' })
  })
</script>

<TopSearchManager
  placeholder="Search Templates"
  asYouType={true}
  filterStore={templateFilterStore}
/>

<slot />
