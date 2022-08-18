<script lang="ts">
  import codeJson from '@iconify-icons/mdi/code-json'
  import { goto } from '$app/navigation'
  import { base } from '$app/paths'
  import { dataListStore } from '$lib'
  import { subnav } from '$lib/stores/global'

  function onClose (idx: number) {
    const actual = idx - 1
    const wasactive = actual === $dataListStore.active
    dataListStore.close(actual)
    if (wasactive) {
      if ($dataListStore.templates.length) goto(base + '/data/' + $dataListStore.templates[$dataListStore.active].id)
      else goto(base + '/data')
    }
  }
  $: subnav.set([{ label: 'Templates', href: base + '/data', icon: codeJson }, ...$dataListStore.templates.map(t => ({ label: t.name, href: base + '/data/' + t.id, onClose }))])
</script>

<slot />
