<script lang="ts">
  import { Icon } from '@dosgato/dialog'
  import type { ComponentData } from '@dosgato/templating'
  import { get } from 'txstate-utils'
  import { ActionPanel, Dialog, editorStore, environmentConfig, FormDialog, pageStore, pageEditorStore, type ActionPanelAction, templateRegistry } from '$lib'
  import { getTempToken } from './+page'

  export let data: { temptoken: string }

  let iframe: HTMLIFrameElement
  let selectedPath: string

  function getActions (selectedPath: string) {
    return (selectedPath
      ? [
          { label: 'Edit', onClick: () => pageEditorStore.editComponentShowModal(selectedPath) },
          { label: 'Delete', onClick: () => pageEditorStore.removeComponentShowModal(selectedPath) }
        ]
      : []) as ActionPanelAction[]
  }

  function onMessage (message: { action: string, path: string, allpaths?: string[], from?: string, to?: string }) {
    console.log('received message', message)
    if (message.action === 'drag') {
      const validdrops = new Set<string>()
      const pageData = $editorStore.page.data
      const draggingKey = get<ComponentData>(pageData, message.path).templateKey
      for (const p of message.allpaths ?? []) {
        if (p === message.path) continue
        const d = get<ComponentData | ComponentData[]>(pageData, p) ?? []
        let draggable = false
        if (Array.isArray(d)) {
          const parts = p.split('.')
          const cpath = parts.slice(0, -2).join('.')
          const aname = parts[parts.length - 1]
          const tkey = get<ComponentData>(pageData, cpath).templateKey
          draggable = !!templateRegistry.getTemplate(tkey)?.areas.get(aname)?.availableComponents?.has(draggingKey)
        } else {
          const parts = p.split('.')
          const cpath = parts.slice(0, -3).join('.')
          const aname = parts[parts.length - 2]
          const tkey = get<ComponentData>(pageData, cpath).templateKey
          draggable = !!templateRegistry.getTemplate(tkey)?.areas.get(aname)?.availableComponents?.has(draggingKey)
        }
        if (draggable) validdrops.add(p)
      }
      iframe.contentWindow?.postMessage({ validdrops }, '*')
    } else if (message.action === 'select') {
      selectedPath = message.path
    } else if (message.action === 'edit') {
      pageEditorStore.editComponentShowModal(message.path)
    } else if (message.action === 'create') {
      pageEditorStore.addComponentShowModal(message.path)
    } else if (message.action === 'del') {
      pageEditorStore.removeComponentShowModal(message.path)
    } else if (message.action === 'drop') {
      pageEditorStore.moveComponent(message.from!, message.to!)
        .then(refreshIframe)
    }
  }

  function cancelModal () {
    pageEditorStore.cancelModal()
  }

  async function refreshIframe () {
    const newTempToken = await getTempToken($editorStore!.page)
    if (newTempToken === data.temptoken) {
      iframe.src = iframe.src // force refresh the iframe
    } else {
      data.temptoken = newTempToken // if there's a new token, setting it will alter the iframe src and therefore refresh it
    }
  }

  function onAddComponentChooseTemplate (templateKey: string) {
    return () => pageEditorStore.addComponentChooseTemplate(templateKey)
  }

  async function onAddComponentSubmit (data: any) {
    const resp = await pageEditorStore.addComponentSubmit(data)
    if (resp?.success) await refreshIframe()
    return resp!
  }

  async function onEditComponentSubmit (data: any) {
    const resp = await pageEditorStore.editComponentSubmit(data)
    if (resp?.success) await refreshIframe()
    return resp!
  }

  async function onDeleteComponentSubmit () {
    const resp = await pageEditorStore.removeComponentSubmit()
    if (resp?.success) await refreshIframe()
  }

  function messages (el: HTMLIFrameElement) {
    iframe = el
    const handler = e => { if (e.source === el.contentWindow) onMessage(e.data) }
    window.addEventListener('message', handler)
    return {
      destroy: () => window.removeEventListener('message', handler)
    }
  }

  // if user refreshes the iframe manually, it's possible the temporary token will have
  // expired, so we need to watch for refresh errors and load in a new token
  async function iframeload () {
    data.temptoken = await getTempToken($editorStore.page)
  }
</script>

<ActionPanel actions={getActions(selectedPath)}>
  <!-- this iframe should NEVER get allow-same-origin in its sandbox, it would give editors the ability
  to steal credentials from other editors! -->
  <iframe use:messages sandbox="allow-scripts" src="{environmentConfig.renderBase}/.edit/{$pageStore.pagetree.id}{$pageStore.path}?token={data.temptoken}" title="page preview for editing" on:load={iframeload}></iframe>
</ActionPanel>

{#if $editorStore.modal === 'edit' && $editorStore.editing}
  {@const template = templateRegistry.getTemplate($editorStore.editing.templateKey)}
  {#if template && template.dialog}
    <FormDialog title={template.name} preload={$editorStore.editing.data} submit={onEditComponentSubmit} on:escape={cancelModal} let:data>
      <svelte:component this={template.dialog} {data} templateProperties={templateRegistry.getTemplate($editorStore.page.data.templateKey)?.templateProperties} {environmentConfig} />
    </FormDialog>
  {:else}
    <Dialog title="Unrecognized Template">This content uses an unrecognized template. Please contact support for assistance.</Dialog>
  {/if}
{:else if $editorStore.modal === 'create' && $editorStore.creating }
  {#if $editorStore.creating.templateKey}
    {@const template = templateRegistry.getTemplate($editorStore.creating.templateKey)}
    {#if template && template.dialog}
      <FormDialog title={template.name} preload={$editorStore.creating.data} submit={onAddComponentSubmit} on:escape={cancelModal}>
        <svelte:component this={template.dialog} templateProperties={templateRegistry.getTemplate($editorStore.page.data.templateKey)?.templateProperties} {environmentConfig} />
      </FormDialog>
    {:else}
      <Dialog title="Unrecognized Template">This content uses an unrecognized template. Please contact support for assistance.</Dialog>
    {/if}
  {:else}
    <Dialog title="What would you like to add?" cancelText="Cancel" size="large" on:escape={cancelModal}>
      <div class="component-chooser">
        {#each $editorStore.creating.availableComponents as availableComponent}
          <button type="button" on:click={onAddComponentChooseTemplate(availableComponent.templateKey)}>
            <Icon icon={availableComponent.icon} width="60%" /><br>{availableComponent.name}
          </button>
        {/each}
      </div>
    </Dialog>
  {/if}
{:else if $editorStore.modal === 'delete' && $editorStore.editing}
  {@const template = templateRegistry.getTemplate($editorStore.editing.templateKey)}
  <Dialog title="Delete {template?.name ?? 'Content'}" cancelText="Cancel" continueText="Delete" on:escape={cancelModal} on:continue={onDeleteComponentSubmit}>
    Are you sure you want to delete the {template?.name ?? 'unrecognized'}?
  </Dialog>
{/if}

<style>
  iframe {
    display: block;
    border: 0;
    width: 100%;
    height: 100%;
  }

  .component-chooser {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr 1fr;
    grid-gap: 1em;
    place-content: center center;
    grid-auto-rows: 1fr;
  }
  .component-chooser button {
    aspect-ratio: 1;
    cursor: pointer;
  }
</style>
