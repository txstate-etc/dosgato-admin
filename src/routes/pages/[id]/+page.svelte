<script lang="ts">
  import { Icon } from '@dosgato/dialog'
  import { editorStore, environmentConfig, pageStore, pageEditorStore, type ActionPanelAction, templateRegistry } from '$lib'
  import Dialog from '$lib/components/Dialog.svelte'
  import FormDialog from '$lib/components/FormDialog.svelte'
  import ActionPanel from '$lib/components/ActionPanel.svelte'
  import { getTempToken } from './+page'

  export let data: { temptoken: string }

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
      pageEditorStore.editComponentShowModal(message.path)
    } else if (message.action === 'create') {
      pageEditorStore.addComponentShowModal(message.path)
    } else if (message.action === 'del') {
      pageEditorStore.removeComponentShowModal(message.path)
    }
  }

  function cancelModal () {
    pageEditorStore.cancelModal()
  }

  async function refreshIframe () {
    const newTempToken = await getTempToken($editorStore.page)
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

</script>

<ActionPanel actions={getActions()}>
  <!-- this iframe should NEVER get allow-same-origin in its sandbox, it would give editors the ability
  to steal credentials from other editors! -->
  <iframe use:messages sandbox="allow-scripts" src="{environmentConfig.renderBase}/.edit/{$pageStore.pagetree.id}{$pageStore.path}?token={data.temptoken}" title="page preview for editing"></iframe>
</ActionPanel>

{#if $editorStore.modal === 'edit' && $editorStore.editing}
  {@const template = templateRegistry.getTemplate($editorStore.editing.templateKey)}
  {#if template && template.dialog}
    <FormDialog preload={$editorStore.editing.data} submit={onEditComponentSubmit} on:dismiss={cancelModal} let:data>
      <svelte:component this={template.dialog} {data} {environmentConfig} />
    </FormDialog>
  {:else}
    <Dialog title="Unrecognized Template">This content uses an unrecognized template. Please contact support for assistance.</Dialog>
  {/if}
{:else if $editorStore.modal === 'create' && $editorStore.creating }
  {#if $editorStore.creating.templateKey}
    {@const template = templateRegistry.getTemplate($editorStore.creating.templateKey)}
    {#if template && template.dialog}
      <FormDialog preload={$editorStore.creating.data} submit={onAddComponentSubmit} on:dismiss={cancelModal}>
        <svelte:component this={template.dialog} />
      </FormDialog>
    {:else}
      <Dialog title="Unrecognized Template">This content uses an unrecognized template. Please contact support for assistance.</Dialog>
    {/if}
  {:else}
    <Dialog title="What would you like to add?" cancelText="Cancel" size="large" on:dismiss={cancelModal}>
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
  <Dialog title="Delete Content" cancelText="Cancel" continueText="Delete" on:dismiss={cancelModal} on:continue={onDeleteComponentSubmit}>
    Are you sure you want to delete the {template?.templateKey} content?
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
