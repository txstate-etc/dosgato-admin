<script lang="ts">
  import applicationEditOutline from '@iconify-icons/mdi/application-edit-outline'
  import fileTree from '@iconify-icons/mdi/file-tree'
  import { goto } from '$app/navigation'
  import { base } from '$app/paths'
  import { pageEditorStore, subnav } from '$lib'
  async function onClose (idx: number) {
    const actual = idx - 1
    let newactive = $pageEditorStore.active
    if (actual === $pageEditorStore.active) {
      newactive = $pageEditorStore.active > actual || actual === $pageEditorStore.editors.length - 1 ? $pageEditorStore.active - 1 : $pageEditorStore.active
      if ($pageEditorStore.editors.length > 1) await goto(base + '/pages/' + $pageEditorStore.editors[newactive].page.id)
      else await goto(base + '/pages')
    }
    pageEditorStore.close(actual, newactive)
  }
  $: subnav.set([{ label: 'Pages', href: base + '/pages', icon: fileTree }, ...$pageEditorStore.editors.map(e => ({ label: e.page.title ?? e.page.name, href: base + '/pages/' + e.page.id, icon: applicationEditOutline, onClose }))])
</script>

<slot />
