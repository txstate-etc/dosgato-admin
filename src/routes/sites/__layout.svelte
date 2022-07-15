<script lang="ts" context="module">
  import { base } from '$app/paths'
  import { siteListStore } from '$lib'
  import { subnav } from '$lib/stores/global'

  export const load = async () => {
    subnav.set([
      { label: 'Sites', href: base + '/sites' }
    ])
    return {}
  }
</script>
<script lang="ts">
  import { goto } from '$app/navigation'
  function onClose (idx: number) {
    const actual = idx - 1
    const wasactive = actual === $siteListStore.active
    siteListStore.close(actual)
    if (wasactive) {
      if ($siteListStore.sites.length) goto(base + '/sites/' + $siteListStore.sites[$siteListStore.active].id)
      else goto(base + '/sites')
    }
  }

  $: subnav.set([{ label: 'Sites', href: base + '/sites' }, ...$siteListStore.sites.map(s => ({ label: s.name, href: base + '/sites/' + s.id, onClose }))])
</script>

<slot />