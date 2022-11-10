<script lang="ts">
  import { goto } from '$app/navigation'
  import { base } from '$app/paths'
  import { Dialog, FieldSelect, FormDialog, Icon } from '@dosgato/dialog'
  import type { ComponentData, UITemplate } from '@dosgato/templating'
  import clipboardTextLight from '@iconify-icons/ph/clipboard-text-light'
  import copyLight from '@iconify-icons/ph/copy-light'
  import fileXLight from '@iconify-icons/ph/file-x-light'
  import historyIcon from '@iconify-icons/mdi/history'
  import pencilIcon from '@iconify-icons/mdi/pencil'
  import scissorsLight from '@iconify-icons/ph/scissors-light'
  import trashLight from '@iconify-icons/ph/trash-light'
  import { derivedStore } from '@txstate-mws/svelte-store'
  import { get, printIf } from 'txstate-utils'
  import { ActionPanel, editorStore, environmentConfig, pageStore, pageEditorStore, type ActionPanelAction, templateRegistry, type PageEditorPage, dateStamp, type EnhancedUITemplate } from '$lib'
  import { getTempToken } from './+page'

  export let data: { temptoken: string, page: PageEditorPage, pagetemplate: EnhancedUITemplate }
  $: ({ page, temptoken, pagetemplate } = data)
  $: pageEditorStore.open(page)

  let iframe: HTMLIFrameElement
  let panelelement: HTMLElement
  $: editable = $editorStore.page.permissions.update

  const actionsStore = derivedStore(pageEditorStore, v => ({ clipboardData: v.clipboardData, clipboardPath: v.active === v.clipboardPage ? v.clipboardPath : undefined, clipboardPage: v.clipboardPage, clipboardLabel: v.clipboardLabel, selectedPath: v.editors[v.active!]?.selectedPath, clipboardActive: v.clipboardData || (v.clipboardPath && v.clipboardPage === v.active) }))

  function validMove (from: string, to: string) {
    if (to === from) return false // no dragging onto yourself
    const draggingParentPath = from.split('.').slice(0, -1).join('.')
    if (to === draggingParentPath) return false // no dragging onto your own new bar
    const draggingKey = get<ComponentData>($editorStore.page.data, from).templateKey
    return validCopy(draggingKey, to)
  }

  function validCopy (templateKey: string, to: string) {
    const d = get<ComponentData | ComponentData[]>($editorStore.page.data, to) ?? []
    if (Array.isArray(d)) {
      const parts = to.split('.')
      const cpath = parts.slice(0, -2).join('.')
      const aname = parts[parts.length - 1]
      const tkey = get<ComponentData>($editorStore.page.data, cpath).templateKey
      return !!templateRegistry.getTemplate(tkey)?.areas.get(aname)?.availableComponents?.has(templateKey)
    } else {
      const parts = to.split('.')
      const cpath = parts.slice(0, -3).join('.')
      const aname = parts[parts.length - 2]
      const tkey = get<ComponentData>($editorStore.page.data, cpath).templateKey
      return !!templateRegistry.getTemplate(tkey)?.areas.get(aname)?.availableComponents?.has(templateKey)
    }
  }

  function pasteDisabled (selectedPath: string) {
    if (!$editorStore.selectedDroppable || !$actionsStore.clipboardActive) return true
    if ($actionsStore.clipboardPath) return !validMove($actionsStore.clipboardPath, selectedPath)
    if ($actionsStore.clipboardData) return !validCopy($actionsStore.clipboardData.templateKey, selectedPath)
    return true
  }

  function getActions (selectedPath?: string): ActionPanelAction[] {
    if (!selectedPath) {
      // nothing selected
      return [
        { label: 'Edit Page Properties', disabled: !editable, icon: pencilIcon, onClick: () => pageEditorStore.editPropertiesShowModal() },
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
        { label: `Paste${printIf($actionsStore.clipboardPath ?? $actionsStore.clipboardData, ` (${$actionsStore.clipboardLabel})`)}`, icon: clipboardTextLight, disabled: pasteDisabled(selectedPath), onClick: () => pageEditorStore.pasteComponent(selectedPath).then(refreshIframe) }
      ]
    } else {
      // new bar selected
      const actions: ActionPanelAction[] = []
      if ($actionsStore.clipboardActive) actions.push({ label: `Cancel ${$actionsStore.clipboardPath ? 'Cut' : 'Copy'}`, onClick: () => pageEditorStore.clearClipboard() })
      actions.push({ label: `Paste${printIf($actionsStore.clipboardPath ?? $actionsStore.clipboardData, ` (${$actionsStore.clipboardLabel})`)}`, icon: clipboardTextLight, disabled: pasteDisabled(selectedPath), onClick: () => pageEditorStore.pasteComponent(selectedPath).then(refreshIframe) })
      return actions
    }
  }

  function onMessage (message: { action: string, path: string, allpaths?: string[], from?: string, to?: string, scrollTop?: number, pageId?: string, label?: string, maxreached?: boolean }) {
    if (message.action === 'scroll') {
      $editorStore.scrollY = message.scrollTop!
      return
    }
    console.log('received message', message)
    if (message.action === 'drag') {
      const validdrops = new Set<string>()
      for (const p of message.allpaths ?? []) {
        if (validMove(message.path, p)) validdrops.add(p)
      }
      iframe.contentWindow?.postMessage({ validdrops }, '*')
    } else if (message.action === 'select') {
      pageEditorStore.select(message.path, message.label, message.maxreached)
    } else if (message.action === 'edit') {
      pageEditorStore.editComponentShowModal(message.path)
    } else if (message.action === 'create') {
      pageEditorStore.addComponentShowModal(message.path)
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
    if (resp?.success) await refreshIframe()
    return resp!
  }

  async function onEditComponentValidate (data: any) {
    const resp = await pageEditorStore.editComponentSubmit(data, true)
    return resp?.messages ?? []
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
    iframe.contentWindow?.postMessage({ scrollTop: $editorStore.scrollY ?? 0, selectedPath: $editorStore.selectedPath }, '*')
    temptoken = await getTempToken($editorStore.page)
  }

  $: iframesrc = editable
    ? `${environmentConfig.renderBase}/.edit/${$pageStore.pagetree.id}${$pageStore.path}?token=${data.temptoken}`
    : `${environmentConfig.renderBase}/.preview/${$pageStore.pagetree.id}/latest${$pageStore.path}?token=${data.temptoken}`
</script>

<ActionPanel bind:panelelement actionsTitle={$editorStore.selectedPath ? $editorStore.selectedLabel ?? '' : 'Page Actions'} actions={getActions($actionsStore.selectedPath)} on:returnfocus={onReturnFocus}>
  <div class="page-bar"><span>{$editorStore.page.path}</span>
    {#each pagetemplate.pageBarButtons ?? [] as button}
      <button class="user-button" on:click={onUserButtonClick(button)}>
        <Icon icon={button.icon} hiddenLabel={button.hideLabel ? button.label : undefined} />
        {#if !button.hideLabel}{button.label}{/if}
      </button>
    {/each}
  </div>
  <!-- this iframe should NEVER get allow-same-origin in its sandbox, it would give editors the ability
  to steal credentials from other editors! -->
  <iframe use:messages sandbox="allow-scripts" src={iframesrc} title="page preview for editing" on:load={iframeload}></iframe>
</ActionPanel>

{#if $editorStore.modal === 'edit' && $editorStore.editing}
  {@const template = templateRegistry.getTemplate($editorStore.editing.templateKey)}
  {#if template && template.dialog}
    <FormDialog title={template.name} preload={$editorStore.editing.data} submit={onEditComponentSubmit} validate={onEditComponentValidate} on:escape={cancelModal} let:data>
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
        <FormDialog title={template.name} preload={$editorStore.creating.data} submit={onAddComponentSubmit} validate={onAddComponentValidate} on:escape={cancelModal}>
          <svelte:component this={template.dialog} creating={true} page={$editorStore.page} path={$editorStore.creating.componentEventualPath} templateProperties={pagetemplate.templateProperties} {environmentConfig} />
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
  <Dialog title="Delete {template?.name ?? 'Content'}" cancelText="Cancel" continueText="Delete" on:escape={cancelModal} on:continue={onDeleteComponentSubmit}>
    Are you sure you want to delete the {template?.name ?? 'unrecognized'}?
  </Dialog>
{:else if $editorStore.modal === 'properties' && $editorStore.editing}
  <FormDialog title="Edit Page Properties" submit={onEditPagePropertiesSubmit} validate={onEditPagePropertiesValidate} on:escape={cancelModal} preload={$editorStore.editing.data} let:data>
    {@const template = templateRegistry.getTemplate($editorStore.editing.templateKey)}
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
