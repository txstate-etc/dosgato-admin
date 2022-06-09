<script lang="ts" context="module">
  import type { Load } from '@sveltejs/kit'
  import { api, editorStore, environmentConfig, pageEditorStore, type ActionPanelAction } from '$lib'
  import ActionPanel from '$lib/components/ActionPanel.svelte'

  export const load: Load = async ({ params }) => {
    const page = await api.getEditorPage(params.id)
    if (!page) return { status: 404 }
    pageEditorStore.open(page)
    return {}
  }
</script>
<script lang="ts">
  function getActions () {
    return [
      { label: 'Delete', onClick: () => {} }
    ] as ActionPanelAction[]
  }
</script>

<ActionPanel actions={getActions()}>
  <iframe src="{environmentConfig.renderBase}/.edit/{$editorStore.page.pagetree.id}{$editorStore.page.path}?token={api.token}" title="page preview for editing"></iframe>
</ActionPanel>

<style>
  iframe {
    border: 0;
    width: 100%;
    height: 100%;
  }
</style>
