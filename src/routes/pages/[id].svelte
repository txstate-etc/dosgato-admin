<script lang="ts" context="module">
  import type { Load } from '@sveltejs/kit'
  import { api, pageStore, editorStore, environmentConfig, pageEditorStore, templateRegistry, type ActionPanelAction } from '$lib'
  import ActionPanel from '$lib/components/ActionPanel.svelte'

  export const load: Load = async ({ params, fetch }) => {
    const page = await api.getEditorPage(params.id)
    if (!page) return { status: 404 }
    const resp = await fetch(environmentConfig.renderBase + '/token' + page.path, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${api.token ?? ''}`
      }
    })
    const temptoken = await resp.text()
    pageEditorStore.open(page)
    return { props: { temptoken } }
  }
</script>
<script lang="ts">
  import Dialog from '$lib/components/Dialog.svelte'
  import FormDialog from '$lib/components/FormDialog.svelte'
  import type { ComponentData } from '@dosgato/templating'

  export let temptoken: string

  let iframe: HTMLIFrameElement

  function getActions () {
    return [
      { label: 'Delete', onClick: () => {} }
    ] as ActionPanelAction[]
  }

  function onMessage (message: { action: string, path: string, allpaths?: string[] }) {
    console.log('received message', message)
    if (message.action === 'drag') {
      iframe.contentWindow?.postMessage({ validdrops: new Set(message.allpaths!.filter(p => p !== message.path)) }, '*')
    } else if (message.action === 'edit') {
      pageEditorStore.editComponent(message.path)
    }
  }

  function onEditSubmit (path: string) {
    return async (data: ComponentData) => {
      return {
        success: true,
        messages: [],
        data
      }
    }
  }

  function messages (el: HTMLIFrameElement) {
    iframe = el
    const handler = e => { if (e.source === el.contentWindow) onMessage(e.data) }
    window.addEventListener('message', handler)
    return {
      destroy: () => window.removeEventListener('message', handler)
    }
  }

</script>

<ActionPanel actions={getActions()}>
  <!-- this iframe should NEVER get allow-same-origin in its sandbox, it would give editors the ability
  to steal credentials from other editors! -->
  <iframe use:messages sandbox="allow-scripts" src="{environmentConfig.renderBase}/.edit/{$pageStore.pagetree.id}{$pageStore.path}?token={temptoken}" title="page preview for editing"></iframe>
</ActionPanel>

{#if $editorStore.modal === 'edit' && $editorStore.editing}
  {@const template = templateRegistry.getTemplate($editorStore.editing.templateKey)}
  {#if template && template.dialog}
    <FormDialog preload={$editorStore.editing.data} submit={onEditSubmit($editorStore.editing.path)}>
      <svelte:component this={template.dialog} />
    </FormDialog>
  {:else}
    <Dialog title="Unrecognized Template">This content uses an unrecognized template. Please contact support for assistance.</Dialog>
  {/if}
{/if}

<style>
  iframe {
    border: 0;
    width: 100%;
    height: 100%;
  }
</style>
