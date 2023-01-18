<script lang="ts">
  import { goto } from '$app/navigation'
  import { base } from '$app/paths'
  import { Dialog, FieldSelect, FormDialog, Icon } from '@dosgato/dialog'
  import type { UITemplate } from '@dosgato/templating'
  import clipboardTextLight from '@iconify-icons/ph/clipboard-text-light'
  import copyLight from '@iconify-icons/ph/copy-light'
  import copySimpleLight from '@iconify-icons/ph/copy-simple-light'
  import fileXLight from '@iconify-icons/ph/file-x-light'
  import historyIcon from '@iconify-icons/mdi/history'
  import pencilIcon from '@iconify-icons/mdi/pencil'
  import scissorsLight from '@iconify-icons/ph/scissors-light'
  import trashLight from '@iconify-icons/ph/trash-light'
  import { printIf } from 'txstate-utils'
  import { ActionPanel, actionsStore, editorStore, environmentConfig, pageStore, pageEditorStore, type ActionPanelAction, templateRegistry, type PageEditorPage, dateStamp, type EnhancedUITemplate, ChooserClient } from '$lib'
  import { getTempToken } from './helpers'

  export let data: { temptoken: string, page: PageEditorPage, pagetemplate: EnhancedUITemplate }
  $: ({ page, temptoken, pagetemplate } = data)
  $: pageEditorStore.open(page)
  $: chooserClient = new ChooserClient(page.pagetree.id)
  let iframe: HTMLIFrameElement
  let panelelement: HTMLElement
  $: editable = $editorStore.page.permissions.update

  function getActions (selectedPath?: string): ActionPanelAction[] {
    if (!selectedPath) {
      // nothing selected
      return [
        { label: 'Edit Page Properties', disabled: !editable, icon: pencilIcon, onClick: () => pageEditorStore.editPropertiesShowModal() },
        { label: 'Preview in new window', icon: copySimpleLight, onClick: () => { window.open(base + '/preview?url=' + encodeURIComponent(`${environmentConfig.renderBase}/.preview/${$editorStore.page.pagetree.id}/latest${$editorStore.page.path}.html`), '_blank') } },
        { label: 'Show Versions', icon: historyIcon, onClick: () => pageEditorStore.versionsShowModal(), disabled: page.versions.length === 0 }
      ]
    } else if (/\.\d+$/.test(selectedPath)) {
      // edit bar selected
      return [
        { label: 'Edit', icon: pencilIcon, onClick: () => pageEditorStore.editComponentShowModal(selectedPath) },
        { label: 'Delete', icon: trashLight, onClick: () => pageEditorStore.removeComponentShowModal(selectedPath) },
        ...($actionsStore.clipboardActive
          ? [
              { label: `Cancel ${$actionsStore.clipboardPath ? 'Cut' : 'Copy'}`, icon: fileXLight, onClick: () => pageEditorStore.clearClipboard() }
            ]
          : [
              { label: 'Cut', icon: scissorsLight, onClick: () => pageEditorStore.cutComponent(selectedPath) },
              { label: 'Copy', icon: copyLight, onClick: () => pageEditorStore.copyComponent(selectedPath) }
            ]),
        { label: `Paste${printIf($actionsStore.clipboardPath ?? $actionsStore.clipboardData, ` (${$actionsStore.clipboardLabel})`)}`, icon: clipboardTextLight, disabled: !$editorStore.pasteAllowed, onClick: () => pageEditorStore.pasteComponent(selectedPath).then(refreshIframe) }
      ]
    } else {
      // new bar selected
      const actions: ActionPanelAction[] = []
      if ($actionsStore.clipboardActive) actions.push({ label: `Cancel ${$actionsStore.clipboardPath ? 'Cut' : 'Copy'}`, onClick: () => pageEditorStore.clearClipboard() })
      actions.push({ label: `Paste${printIf($actionsStore.clipboardPath ?? $actionsStore.clipboardData, ` (${$actionsStore.clipboardLabel})`)}`, icon: clipboardTextLight, disabled: !$editorStore.pasteAllowed, onClick: () => pageEditorStore.pasteComponent(selectedPath).then(refreshIframe) })
      return actions
    }
  }

  function onMessage (message: { action: string, path: string, allpaths?: string[], from?: string, to?: string, scrollTop?: number, pageId?: string, label?: string, maxreached?: boolean, state?: any }) {
    if (message.action === 'scroll') {
      $editorStore.scrollY = message.scrollTop!
      return
    }
    console.log('received message', message)
    if (message.action === 'drag') {
      const validdrops = new Set<string>()
      for (const p of message.allpaths ?? []) {
        if (pageEditorStore.validMove($editorStore.page.data, message.path, p)) validdrops.add(p)
      }
      iframe.contentWindow?.postMessage({ validdrops }, '*')
    } else if (message.action === 'select') {
      pageEditorStore.select(message.path, message.label, message.maxreached)
    } else if (message.action === 'edit') {
      pageEditorStore.editComponentShowModal(message.path)
    } else if (message.action === 'cut') {
      pageEditorStore.cutComponent($editorStore.selectedPath)
    } else if (message.action === 'copy') {
      pageEditorStore.copyComponent($editorStore.selectedPath!)
    } else if (message.action === 'paste') {
      if ($editorStore.pasteAllowed) {
        pageEditorStore.pasteComponent($editorStore.selectedPath)
          .then(refreshIframe)
      }
    } else if (message.action === 'cancelCopy') {
      pageEditorStore.clearClipboard()
    } else if (message.action === 'create') {
      pageEditorStore.addComponentShowModal(message.path, refreshIframe)
    } else if (message.action === 'del') {
      pageEditorStore.removeComponentShowModal(message.path)
    } else if (message.action === 'drop') {
      pageEditorStore.moveComponent(message.from!, message.to!)
        .then(refreshIframe)
    } else if (message.action === 'deselect') {
      pageEditorStore.select(undefined)
    } else if (message.action === 'jump') {
      goto(base + '/pages/' + message.pageId!)
    } else if (message.action === 'menu') {
      panelelement.querySelector<HTMLElement>('.actions li button')?.focus()
    } else if (message.action === 'save') {
      pageEditorStore.saveState(message.state)
    }
  }

  function cancelModal () {
    pageEditorStore.cancelModal()
  }

  async function refreshIframe () {
    const newTempToken = await getTempToken($editorStore!.page)
    if (newTempToken === temptoken) {
      iframe.src = iframe.src // force refresh the iframe
    } else {
      temptoken = newTempToken // if there's a new token, setting it will alter the iframe src and therefore refresh it
    }
  }

  function onAddComponentChooseTemplate (templateKey: string) {
    return () => pageEditorStore.addComponentChooseTemplate(templateKey, refreshIframe)
  }

  async function onAddComponentValidate (data: any) {
    const resp = await pageEditorStore.addComponentSubmit(data, true)
    return resp?.messages ?? []
  }

  async function onAddComponentSubmit (data: any) {
    const resp = await pageEditorStore.addComponentSubmit(data)
    if (resp.success) await refreshIframe()
    return resp
  }

  async function onEditComponentValidate (data: any) {
    const resp = await pageEditorStore.editComponentSubmit(data, true)
    return resp?.messages ?? []
  }

  async function onEditComponentSubmit (data: any) {
    const resp = await pageEditorStore.editComponentSubmit(data)
    if (resp.success) await refreshIframe()
    return resp
  }

  async function onDeleteComponentSubmit () {
    const resp = await pageEditorStore.removeComponentSubmit()
    if (resp?.success) await refreshIframe()
  }

  async function onEditPagePropertiesValidate (data: any) {
    const resp = await pageEditorStore.editPropertiesSubmit(data, true)
    return resp!.messages
  }

  async function onEditPagePropertiesSubmit (data: any) {
    const resp = await pageEditorStore.editPropertiesSubmit(data)
    if (resp?.success) await refreshIframe()
    return resp!
  }

  async function onSelectVersionSubmit (data: any) {
    // TODO: it needs to open the selected version of the page.
    // The user should then have the option to restore that version
    return { success: true, messages: [], data }
  }

  function onUserButtonClick (button: NonNullable<UITemplate['pageBarButtons']>[0]) {
    return () => {
      iframe.contentWindow?.postMessage({ action: 'pagebar', label: button.label }, '*')
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

  function onReturnFocus () {
    iframe.contentWindow?.postMessage({ focus: $editorStore.selectedPath }, '*')
  }

  // if user refreshes the iframe manually, it's possible the temporary token will have
  // expired, so we need to watch for refresh errors and load in a new token
  async function iframeload () {
    iframe.contentWindow?.postMessage({ scrollTop: $editorStore.scrollY ?? 0, selectedPath: $editorStore.selectedPath, state: $editorStore.state }, '*')
    const newtemptoken = await getTempToken($editorStore.page, temptoken)
    if (newtemptoken !== temptoken) temptoken = newtemptoken
  }

  $: iframesrc = editable
    ? `${environmentConfig.renderBase}/.edit/${$pageStore.pagetree.id}${$pageStore.path}?token=${temptoken}`
    : `${environmentConfig.renderBase}/.preview/${$pageStore.pagetree.id}/latest${$pageStore.path}?token=${temptoken}`
</script>

<ActionPanel bind:panelelement actionsTitle={$editorStore.selectedPath ? $editorStore.selectedLabel ?? '' : 'Page Actions'} actions={getActions($actionsStore.selectedPath)} on:returnfocus={onReturnFocus}>
  <div class="page-bar"><span>{$editorStore.page.path}</span>
    {#each pagetemplate.pageBarButtons ?? [] as button}
      {#if button.shouldAppear?.($editorStore.page.data, $editorStore.page.path)}
        <button class="user-button" on:click={onUserButtonClick(button)}>
          <Icon icon={button.icon} hiddenLabel={button.hideLabel ? button.label : undefined} />
          {#if !button.hideLabel}{button.label}{/if}
        </button>
      {/if}
    {/each}
  </div>
  <!-- this iframe should NEVER get allow-same-origin in its sandbox, it would give editors the ability
  to steal credentials from other editors!
  UPDATE: I'm  going to go ahead and add allow-same-origin for now and we'll explore putting the render server on
  a separate subdomain or port to prevent credential exposure. -->
  <iframe use:messages sandbox="allow-scripts allow-same-origin" src={iframesrc} title="page preview for editing" on:load={iframeload}></iframe>
</ActionPanel>

{#if $editorStore.modal === 'edit' && $editorStore.editing}
  {@const template = templateRegistry.getTemplate($editorStore.editing.templateKey)}
  {#if template && template.dialog}
    <FormDialog {chooserClient} icon={template.icon} title={template.name} preload={$editorStore.editing.data} submit={onEditComponentSubmit} validate={onEditComponentValidate} on:escape={cancelModal} let:data>
      <svelte:component this={template.dialog} creating={false} page={$editorStore.page} path={$editorStore.editing.path} {data} templateProperties={pagetemplate.templateProperties} {environmentConfig} />
    </FormDialog>
  {:else}
    <Dialog title="Unrecognized Template" on:continue={cancelModal} on:escape={cancelModal}>This content uses an unrecognized template. Please contact support for assistance.</Dialog>
  {/if}
{:else if $editorStore.modal === 'create' && $editorStore.creating }
  {#if $editorStore.creating.templateKey}
    {@const template = templateRegistry.getTemplate($editorStore.creating.templateKey)}
    {#if template}
      {#if template.dialog}
        <FormDialog {chooserClient} icon={template.icon} title={template.name} preload={$editorStore.creating.data} submit={onAddComponentSubmit} validate={onAddComponentValidate} on:escape={cancelModal} let:data>
          <svelte:component this={template.dialog} creating={true} page={$editorStore.page} path={$editorStore.creating.componentEventualPath} {data} templateProperties={pagetemplate.templateProperties} {environmentConfig} />
        </FormDialog>
      {/if}
    {:else}
      <Dialog title="Unrecognized Template" on:continue={cancelModal} on:escape={cancelModal}>This content uses an unrecognized template. Please contact support for assistance.</Dialog>
    {/if}
  {:else}
    <Dialog title="What would you like to add?" cancelText="Cancel" size="large" on:escape={cancelModal}>
      <div class="component-chooser">
        {#each $editorStore.creating.availableComponents as availableComponent}
          <button type="button" on:click={onAddComponentChooseTemplate(availableComponent.templateKey)}>
            <Icon icon={availableComponent.preview ?? availableComponent.icon} width="60%" /><br>{availableComponent.name}
          </button>
        {/each}
      </div>
    </Dialog>
  {/if}
{:else if $editorStore.modal === 'delete' && $editorStore.editing}
  {@const template = templateRegistry.getTemplate($editorStore.editing.templateKey)}
  <Dialog icon={template?.icon} title="Delete {template?.name ?? 'Content'}" cancelText="Cancel" continueText="Delete" on:escape={cancelModal} on:continue={onDeleteComponentSubmit}>
    Are you sure you want to delete the {template?.name ?? 'unrecognized content'}?
  </Dialog>
{:else if $editorStore.modal === 'properties' && $editorStore.editing}
  {@const template = templateRegistry.getTemplate($editorStore.editing.templateKey)}
  <FormDialog {chooserClient} icon={template?.icon} title="Edit Page Properties" submit={onEditPagePropertiesSubmit} validate={onEditPagePropertiesValidate} on:escape={cancelModal} preload={$editorStore.editing.data} let:data>
    {#if template && template.dialog}
      <svelte:component this={template.dialog} creating={false} page={$editorStore.page} {data} templateProperties={template.templateProperties} {environmentConfig} />
    {:else}
      <span>This content uses an unrecognized template. Please contact support for assistance.</span>
    {/if}
  </FormDialog>
{:else if $editorStore.modal === 'versions'}
  <FormDialog title="Page Versions" submit={onSelectVersionSubmit} on:escape={cancelModal}>
    <FieldSelect path="version" label="Version" choices={page.versions.map(v => ({ value: String(v.version), label: `${v.version}: ${dateStamp(v.date)} (${v.user.id})` }))}/>
  </FormDialog>
{/if}


<style>
  iframe {
    display: block;
    border: 0;
    width: 100%;
    height: calc(100% - 2em);
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
  .page-bar {
    background-color: var(--dg-page-bar-bg, #00507A);
    color: var(--dg-page-bar-text, white);
    padding: 0.2em 0.5em;
    display: flex;
    align-items: center;
  }
  .page-bar span {
    margin-right: auto;
  }
</style>
