<script lang="ts" context="module">
  function formatDateTime (dt: DateTime) {
    return dt.toLocaleString(DateTime.DATETIME_SHORT)
  }
</script>
<script lang="ts">
  import { goto } from '$app/navigation'
  import { base } from '$app/paths'
  import { Button, Dialog, FormDialog, Icon, Tab, Tabs } from '@dosgato/dialog'
  import type { UITemplate, ValidationFeedback } from '@dosgato/templating'
  import clipboardText from '@iconify-icons/ph/clipboard-text'
  import copyIcon from '@iconify-icons/ph/copy'
  import copySimple from '@iconify-icons/ph/copy-simple'
  import eye from '@iconify-icons/ph/eye'
  import fileX from '@iconify-icons/ph/file-x'
  import historyIcon from '@iconify-icons/mdi/history'
  import pencilIcon from '@iconify-icons/mdi/pencil'
  import scissors from '@iconify-icons/ph/scissors'
  import trash from '@iconify-icons/ph/trash'
  import { OffsetStore, ResizeStore, offset, resize } from '@txstate-mws/svelte-components'
  import { DateTime } from 'luxon'
  import { printIf, titleCase } from 'txstate-utils'
  import { ActionPanel, actionsStore, editorStore, environmentConfig, pageStore, pageEditorStore, type ActionPanelAction, templateRegistry, type PageEditorPage, type EnhancedUITemplate, ChooserClient, type ActionPanelGroup, api, VersionHistory } from '$lib'
  import { statusIcon } from './helpers'

  export let data: { page: PageEditorPage, pagetemplate: EnhancedUITemplate }
  $: ({ page, pagetemplate } = data)
  $: pageEditorStore.open(page)
  $: chooserClient = new ChooserClient(page.pagetree.id)
  let iframe: HTMLIFrameElement
  let panelelement: HTMLElement
  $: editable = $editorStore.page.permissions.update

  function getActions (selectedPath?: string, ..._:any[]): (ActionPanelAction | ActionPanelGroup)[] {
    if ($editorStore.previewing) {
      // preview mode
      return [
        { label: 'Cancel Preview', icon: pencilIcon, onClick: () => pageEditorStore.cancelPreview() }
      ]
    } else if (!selectedPath) {
      // editing mode, nothing selected
      const editGroup: ActionPanelGroup = {
        id: 'editinggroup',
        actions: [
          { label: 'Edit Page Properties', disabled: !editable, icon: pencilIcon, onClick: () => pageEditorStore.editPropertiesShowModal() },
          { label: 'Show Versions', icon: historyIcon, onClick: () => pageEditorStore.versionsShowModal(), disabled: page.version.version === 0 }
        ]
      }
      const previewGroup: ActionPanelGroup = {
        id: 'previewgroup',
        actions: [
          { label: 'Preview', icon: eye, onClick: () => pageEditorStore.previewVersion({ version: page.version.version, date: DateTime.fromISO(page.version.date), modifiedBy: page.version.user.name }) },
          { label: 'Preview in new window', icon: copySimple, onClick: () => { window.open(base + '/preview?url=' + encodeURIComponent(`${environmentConfig.renderBase}/.preview/latest${$editorStore.page.path}.html`), '_blank') } },
          { label: 'Show Difference From Public', icon: historyIcon, onClick: () => pageEditorStore.compareVersions({ version: page.versions[0]!.version, date: DateTime.fromISO(page.versions[0]!.date), modifiedBy: page.versions[0]!.user.name }, { version: page.version.version, date: DateTime.fromISO(page.version.date), modifiedBy: page.version.user.name }), disabled: !page.published || !page.hasUnpublishedChanges }
        ]
      }
      return [editGroup, previewGroup]
    } else if (/\.\d+$/.test(selectedPath)) {
      // editing mode, edit bar selected
      return [
        { label: 'Edit', icon: pencilIcon, onClick: () => pageEditorStore.editComponentShowModal(selectedPath) },
        { label: 'Delete', icon: trash, onClick: () => pageEditorStore.removeComponentShowModal(selectedPath) },
        ...($actionsStore.clipboardActive
          ? [
              { label: `Cancel ${$actionsStore.clipboardPath ? 'Cut' : 'Copy'}`, icon: fileX, onClick: () => pageEditorStore.clearClipboard() }
            ]
          : [
              { label: 'Cut', icon: scissors, onClick: () => pageEditorStore.cutComponent(selectedPath) },
              { label: 'Copy', icon: copyIcon, onClick: () => pageEditorStore.copyComponent(selectedPath) }
            ]),
        { label: `Paste${printIf($actionsStore.clipboardPath ?? $actionsStore.clipboardData, ` (${$actionsStore.clipboardLabel})`)}`, icon: clipboardText, disabled: !$editorStore.pasteAllowed, onClick: () => pageEditorStore.pasteComponent(selectedPath).then(refreshIframe) }
      ]
    } else {
      // new bar selected
      const actions: ActionPanelAction[] = []
      if ($actionsStore.clipboardActive) actions.push({ label: `Cancel ${$actionsStore.clipboardPath ? 'Cut' : 'Copy'}`, onClick: () => pageEditorStore.clearClipboard() })
      actions.push({ label: `Paste${printIf($actionsStore.clipboardPath ?? $actionsStore.clipboardData, ` (${$actionsStore.clipboardLabel})`)}`, icon: clipboardText, disabled: !$editorStore.pasteAllowed, onClick: () => pageEditorStore.pasteComponent(selectedPath).then(refreshIframe) })
      return actions
    }
  }

  function onMessage (message: { action: string, path: string, allpaths?: string[], from?: string, to?: string, scrollTop?: number, pageId?: string, label?: string, maxreached?: boolean, state?: any }) {
    if (message.action === 'scroll') {
      $editorStore.scrollY = message.scrollTop!
      return
    }
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
    iframe.src = iframe.src // force refresh the iframe
    page = (await api.getEditorPage(page.id)) ?? page
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

  async function iframeload () {
    // notify the page about the last known scroll and bar selection state so it can load it up nicely
    iframe.contentWindow?.postMessage({ scrollTop: $editorStore.scrollY ?? 0, selectedPath: $editorStore.selectedPath, state: $editorStore.state }, '*')
  }
  $: status = $editorStore.page.published ? ($editorStore.page.hasUnpublishedChanges ? 'modified' as const : 'published' as const) : 'unpublished' as const
  $: iframesrc = editable && !$editorStore.previewing
    ? `${environmentConfig.renderBase}/.edit${$pageStore.path}?token=${api.token}`
    : (
        $editorStore.previewing?.fromVersion?.version
          ? `${environmentConfig.renderBase}/.compare/${$editorStore.previewing.fromVersion.version}/${$editorStore.previewing.version.version ?? 'latest'}${$pageStore.path}?token=${api.token}`
          : `${environmentConfig.renderBase}/.preview/${$editorStore.previewing?.version.version ?? 'latest'}${$pageStore.path}?token=${api.token}`
      )
  let previewDesc = ''
  $: {
    previewDesc = $editorStore.previewing?.version.version
      ? $editorStore.previewing?.version.version === $editorStore.page.version.version
        ? 'Latest'
        : $editorStore.previewing?.version.version === $editorStore.page.versions[0]?.version
          ? 'Published'
          : formatDateTime($editorStore.previewing?.version.date)
      : ''
  }
  const offsetStore = new OffsetStore()
  const footerSize = new ResizeStore()
  const headerSize = new ResizeStore()
  let restoreFeedback: ValidationFeedback[] = []
  let lastValidatedRestoreVersion: number | undefined
  async function reactToPreviewing (..._: any[]) {
    const saveVersion = $editorStore.previewing?.version.version
    if (saveVersion == null || lastValidatedRestoreVersion === saveVersion) return
    const response = await api.restorePage($editorStore.page.id, saveVersion, true)
    if ($editorStore.previewing?.version.version === saveVersion) {
      restoreFeedback = response.messages
      lastValidatedRestoreVersion = saveVersion
    }
  }
  $: reactToPreviewing($editorStore.previewing?.version.version)
</script>

{#if previewDesc && previewDesc !== 'Latest'}
  <section class="preview" use:offset={{ store: offsetStore }}>
    <header use:resize={{ store: headerSize }}>
      <div>Version: {previewDesc}</div>
      <div>Modified By: {$editorStore.previewing?.version.modifiedBy}</div>
    </header>
    <iframe style:height="calc(100dvh - {$offsetStore.top}px - {$footerSize.clientHeight}px - {$headerSize.clientHeight}px - 2em)" src={iframesrc} title="page preview for restoring"></iframe>
    <footer use:resize={{ store: footerSize }}>
      {#if restoreFeedback.length}
        <div class="restore-feedback">{#each restoreFeedback as msg}<div>{msg.message}</div>{/each}</div>
      {/if}
      <Button type="button" cancel on:click={() => { pageEditorStore.cancelPreview() }}>Cancel</Button>
      <Button type="button" on:click={() => { pageEditorStore.restoreVersion() }} disabled={restoreFeedback.filter(f => f.type === 'error').length > 0}>Restore this version</Button>
    </footer>
  </section>
{:else}
  <ActionPanel bind:panelelement actionsTitle={$editorStore.selectedPath ? $editorStore.selectedLabel ?? '' : 'Page Actions'} actions={getActions($actionsStore.selectedPath, $editorStore.previewing, page)} on:returnfocus={onReturnFocus}>
    <div class="page-bar"><span>{$editorStore.page.path}</span>
      {#if $editorStore.previewing}
        <select value={$editorStore.previewing.mode ?? 'desktop'} on:change={function () { pageEditorStore.setPreviewMode(this.value) }}>
          <option value="desktop">Desktop</option>
          <option value="mobile">Mobile</option>
        </select>
      {:else}
        {#each pagetemplate.pageBarButtons ?? [] as button}
          {#if !button.shouldAppear || button.shouldAppear($editorStore.page.data, $editorStore.page.path)}
            <button class="user-button" on:click={onUserButtonClick(button)}>
              <Icon icon={button.icon} hiddenLabel={button.hideLabel ? button.label : undefined} />
              {#if !button.hideLabel}{button.label}{/if}
            </button>
          {/if}
        {/each}
      {/if}
    </div>
    <iframe use:messages src={iframesrc} title="page preview for editing" on:load={iframeload} class:mobile={$editorStore.previewing?.mode === 'mobile'}></iframe>
    <div slot="bottom" class="status {status}"><Icon width="1.1em" inline icon={statusIcon[status]}/><span>{titleCase(status)}</span></div>
  </ActionPanel>
{/if}

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
    <Dialog title="What would you like to add?" cancelText="Cancel" continueText="" size="large" on:escape={cancelModal}>
      {#if $editorStore.creating.availableComponents.length}
        <Tabs tabs={$editorStore.creating.availableComponentsByCategory.map(cat => ({ name: cat.category }))}>
          {#each $editorStore.creating.availableComponentsByCategory as { category, templates } (category)}
            <Tab name={category}>
              <div class="component-chooser">
                {#each templates as availableComponent}
                  <button type="button" on:click={onAddComponentChooseTemplate(availableComponent.templateKey)}>
                    <Icon icon={availableComponent.preview ?? availableComponent.icon} width="60%" /><br>{availableComponent.name}
                  </button>
                {/each}
              </div>
            </Tab>
          {/each}
        </Tabs>
      {:else}
        No components to add.
      {/if}
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
  {@const page = $editorStore.page}
  <VersionHistory dataId={page.id} preview={v => pageEditorStore.previewVersion(v)} compare={(v1, v2) => pageEditorStore.compareVersions(v1, v2)} history={api.getPageVersions(page.id)} on:escape={cancelModal} />
{/if}


<style>
  iframe {
    display: block;
    border: 0;
    width: 100%;
    height: calc(100% - 2em);
  }
  iframe.mobile {
    border: 1px solid #757575;
    width: 400px;
    margin: 0 auto;
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
    background-color: var(--dg-page-bar-bg, #501214);
    color: var(--dg-page-bar-text, white);
    padding: 0.2em 0.5em;
    display: flex;
    align-items: center;
  }
  .page-bar > span {
    margin-right: auto;
  }
  .page-bar-version {
    font-size: 0.9em;
    margin-left: 0.5em;
  }
  .status {
    font-size: 0.9em;
  }
  .status span {
    color: var(--action-panel-text, white);
  }
  .status.published {
  color: var(--dosgato-green, #689600);
  }
  .status.modified {
    color: var(--dosgato-yellow, #ffbf28);
  }
  .status.unpublished {
    color: var(--dosgato-red, #9a3332);
  }

  .preview {
    width: 100%;
    max-width: 80em;
    margin: 0 auto;
  }
  .preview header {
    display: flex;
    justify-content: space-between;
    font-size: 1.1em;
    padding: 1em;
  }
  .preview iframe {
    border: 1px solid #666666;
  }
  .preview footer {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
  }
  .preview footer :global(button) {
    margin: 0 2em;
  }
  .restore-feedback {
    text-align: center;
    color: var(--dosgato-red, #9a3332);
    width: 100%;
    padding: 1em 0;
  }
</style>
