<script lang="ts" context="module">
  import { base } from '$app/paths'
  import { pageEditorStore } from '$lib'
  import { subnav } from '$lib/stores/global'
  import applicationEditOutline from '@iconify-icons/mdi/application-edit-outline'
  import fileTree from '@iconify-icons/mdi/file-tree'

  export const load = async () => {
    subnav.set([
      { label: 'Pages', href: base + '/pages', icon: fileTree }
    ])
    return {}
  }
</script>
<script lang="ts">
  import { goto } from '$app/navigation'
  function onClose (idx: number) {
    const actual = idx - 1
    const wasactive = actual === $pageEditorStore.active
    pageEditorStore.close(actual)
    if (wasactive) {
      if ($pageEditorStore.editors.length) goto(base + '/pages/' + $pageEditorStore.editors[$pageEditorStore.active].page.id)
      else goto(base + '/pages')
    }
  }
  $: subnav.set([{ label: 'Pages', href: base + '/pages', icon: fileTree }, ...$pageEditorStore.editors.map(e => ({ label: e.page.title ?? e.page.name, href: base + '/pages/' + e.page.id, icon: applicationEditOutline, onClose }))])
</script>

<slot />
