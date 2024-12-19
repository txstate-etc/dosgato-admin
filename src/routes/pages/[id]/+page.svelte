<script lang="ts">
  import { goto } from '$app/navigation'
  import { base } from '$app/paths'
  import { Checkbox, Dialog, FormDialog, Icon, Tab, Tabs } from '@dosgato/dialog'
  import type { UITemplate } from '@dosgato/templating'
  import clipboardText from '@iconify-icons/ph/clipboard-text'
  import copyIcon from '@iconify-icons/ph/copy'
  import copySimple from '@iconify-icons/ph/copy-simple'
  import eye from '@iconify-icons/ph/eye'
  import fileX from '@iconify-icons/ph/file-x'
  import historyIcon from '@iconify-icons/mdi/history'
  import pencilIcon from '@iconify-icons/mdi/pencil'
  import publishIcon from '@iconify-icons/mdi/publish'
  import scissors from '@iconify-icons/ph/scissors'
  import trash from '@iconify-icons/ph/trash'
  import { DateTime } from 'luxon'
  import { onMount, setContext } from 'svelte'
  import { get, isNotNull, keyby, printIf, titleCase } from 'txstate-utils'
  import { ActionPanel, actionsStore, editorStore, environmentConfig, pageStore, pageEditorStore, type ActionPanelAction, templateRegistry, type PageEditorPage, type EnhancedUITemplate, ChooserClient, type ActionPanelGroup, api, VersionHistory, TagClientByLink } from '$lib'
  import { statusIcon } from './helpers'
  import VersionView from './VersionView.svelte'

  export let data: { page: PageEditorPage, pagetemplate: EnhancedUITemplate }
  $: ({ page, pagetemplate } = data)
  $: pageEditorStore.open(page)
  $: chooserClient = new ChooserClient(page.pagetree.id)
  $: tagClient = new TagClientByLink(page.pagetree.id)
  let iframe: HTMLIFrameElement
  let panelelement: HTMLElement
  $: editable = $editorStore.page.permissions.update

  function getActions (selectedPath?: string, ..._: any[]): (ActionPanelAction | ActionPanelGroup)[] {
    const previewGroup: ActionPanelGroup = {
      id: 'previewgroup',
      actions: [
        { label: 'Preview', icon: eye, onClick: () => pageEditorStore.previewVersion({ version: page.version.version, date: DateTime.fromISO(page.version.date), modifiedBy: page.version.user.name }) },
        { label: 'Preview in new window', icon: copySimple, onClick: () => { window.open(base + '/preview?url=' + encodeURIComponent(`${environmentConfig.renderBase}/.preview/latest${$editorStore.page.path}.html`), '_blank') } },
        { label: 'Show Difference From Public', icon: historyIcon, onClick: () => pageEditorStore.compareVersions({ version: page.versions[0].version, date: DateTime.fromISO(page.versions[0].date), modifiedBy: page.versions[0].user.name }, { version: page.version.version, date: DateTime.fromISO(page.version.date), modifiedBy: page.version.user.name }), disabled: !page.published || !page.hasUnpublishedChanges }
      ]
    }

    if ($editorStore.previewing) {
      // preview mode
      return [
        { label: 'Cancel Preview', icon: pencilIcon, onClick: () => pageEditorStore.cancelPreview() },
        { label: 'Publish Page', icon: publishIcon, disabled: !$editorStore.page.permissions.publish, onClick: async () => { page = await pageEditorStore.publish() ?? page } }
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
      return [previewGroup, editGroup]
    } else if (/\.\d+$/.test(selectedPath)) {
      // editing mode, edit bar selected
      return [previewGroup,
        { label: 'Edit', icon: pencilIcon, disabled: !$editorStore.selectedMayEdit, onClick: () => pageEditorStore.editComponentShowModal(selectedPath) },
        { label: 'Delete', icon: trash, disabled: !$editorStore.selectedMayDelete, onClick: () => pageEditorStore.removeComponentShowModal(selectedPath) },
        ...($actionsStore.clipboardActive
          ? [
              { label: `Cancel ${$actionsStore.clipboardPath ? 'Cut' : 'Copy'}`, icon: fileX, onClick: () => { pageEditorStore.clearClipboard(); iframe.contentWindow?.postMessage({ action: 'cancelcopy' }, '*') } }
            ]
          : [
              { label: 'Cut', icon: scissors, disabled: !$editorStore.selectedMayDelete, onClick: () => handleCopyAndCut(true) },
              { label: 'Copy', icon: copyIcon, onClick: () => handleCopyAndCut(false) }
            ]),
        { label: `Paste${printIf($actionsStore.clipboardPath ?? $actionsStore.clipboardData, ` (${$actionsStore.clipboardLabel})`)}`, icon: clipboardText, disabled: !$editorStore.pasteAllowed, onClick: async () => await pageEditorStore.pasteComponent(selectedPath).then(refreshIframe) }
      ]
    } else {
      // new bar selected
      const actions: ActionPanelAction[] = []
      if ($actionsStore.clipboardActive) actions.push({ label: `Cancel ${$actionsStore.clipboardPath ? 'Cut' : 'Copy'}`, onClick: () => pageEditorStore.clearClipboard() })
      actions.push({ label: `Paste${printIf($actionsStore.clipboardPath ?? $actionsStore.clipboardData, ` (${$actionsStore.clipboardLabel})`)}`, icon: clipboardText, disabled: !$editorStore.pasteAllowed, onClick: async () => await pageEditorStore.pasteComponent(selectedPath).then(refreshIframe) })
      return actions
    }
  }

  function onMessage (message: { action: string, path: string, allpaths?: string[], from?: string, to?: string, scrollTop?: number, pageId?: string, label?: string, maxreached?: boolean, state?: any, mayDelete?: boolean, mayEdit?: boolean, editbarpaths?: string[], buttonIndex?: number, disableAddToTop?: boolean, newbarpaths?: { path: string, maxreached: boolean }[] }) {
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
    } else if (message.action === 'maymove') {
      const movablePaths = new Set<string>()
      for (const p of message.editbarpaths ?? []) {
        for (const t of message.allpaths ?? []) {
          if (pageEditorStore.validMove($editorStore.page.data, p, t)) movablePaths.add(p)
        }
      }
      iframe.contentWindow?.postMessage({ movablePaths }, '*')
    } else if (message.action === 'select') {
      pageEditorStore.select(message.path, message.label, message.maxreached, message.mayDelete, message.mayEdit)
    } else if (message.action === 'edit') {
      pageEditorStore.editComponentShowModal(message.path)
    } else if (message.action === 'cut') {
      handleCopyAndCut(true)
    } else if (message.action === 'copy') {
      handleCopyAndCut(false)
    } else if (message.action === 'paste') {
      if ($editorStore.pasteAllowed) {
        pageEditorStore.pasteComponent($editorStore.selectedPath)
          .then(refreshIframe).catch(console.error)
      }
    } else if (message.action === 'pasteAtPath') {
      pageEditorStore.select(message.path)
      pageEditorStore.pasteComponent(message.path)
        .then(refreshIframe).catch(console.error)
    } else if (message.action === 'cancelCopy') {
      pageEditorStore.clearClipboard()
      iframe.contentWindow?.postMessage({ action: 'cancelcopy' }, '*')
    } else if (message.action === 'create') {
      void pageEditorStore.addComponentShowModal(message.path, refreshIframe, message.disableAddToTop ?? false, addToTop)
    } else if (message.action === 'del') {
      pageEditorStore.removeComponentShowModal(message.path)
    } else if (message.action === 'drop') {
      pageEditorStore.moveComponent(message.from!, message.to!)
        .then(refreshIframe).catch(console.error)
    } else if (message.action === 'deselect') {
      pageEditorStore.select(undefined)
    } else if (message.action === 'jump') {
      void goto(base + '/pages/' + message.pageId!)
    } else if (message.action === 'menu') {
      panelelement.querySelector<HTMLElement>('.actions li button')?.focus()
    } else if (message.action === 'save') {
      pageEditorStore.saveState(message.state)
    } else if (message.action === 'pagebarFocus') {
      if (isNotNull(message.buttonIndex)) {
        document.getElementById(`pagebar-button-${message.buttonIndex}`)?.focus()
      }
    } else if (message.action === 'maypaste') {
      // need to determine which of the newbarpaths allow the clipboard component to be pasted
      // then send them back so the buttons can be turned on.
      if ($actionsStore.clipboardActive) {
        const validPastePaths = new Set<string>()
        for (const p of message.newbarpaths ?? []) {
          if (pageEditorStore.allowPasteInArea(p.path, p.maxreached, $pageEditorStore)) validPastePaths.add(p.path)
        }
        iframe.contentWindow?.postMessage({ validPastePaths }, '*')
      }
    }
  }

  function cancelModal () {
    const returnPath = $editorStore.selectedPath
    pageEditorStore.cancelModal()
    iframe.contentWindow?.postMessage({ focus: returnPath }, '*')
  }

  function handleCopyAndCut (isCut) {
    if (isCut) {
      pageEditorStore.cutComponent($editorStore.selectedPath)
    } else {
      pageEditorStore.copyComponent($editorStore.selectedPath)
    }
    if ($actionsStore.clipboardActive) {
      iframe.contentWindow?.postMessage({ action: 'clipboardactive' }, '*')
    }
  }

  async function refreshIframe () {
    iframe.src = iframe.src // force refresh the iframe
    page = (await api.getEditorPage(page.id)) ?? page
  }

  function onAddComponentChooseTemplate (templateKey: string) {
    return async () => await pageEditorStore.addComponentChooseTemplate(templateKey, refreshIframe, addToTop)
  }

  async function onAddComponentValidate (data: any) {
    const resp = await pageEditorStore.addComponentSubmit(data, true, addToTop)
    return resp?.messages ?? []
  }

  async function onAddComponentSubmit (data: any) {
    const resp = await pageEditorStore.addComponentSubmit(data, false, addToTop)
    if (resp.success) {
      await refreshIframe()
    }
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

  function onUserButtonClick (button: NonNullable<UITemplate['pageBarButtons']>[0], buttonIndex: number) {
    return () => {
      iframe.contentWindow?.postMessage({ action: 'pagebar', label: button.label, buttonIndex }, '*')
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

  onMount(() => {
    if (location.hash === '#versions') {
      pageEditorStore.versionsShowModal()
      history.replaceState(null, '', ' ')
    }
  })

  async function iframeload () {
    // notify the page about the last known scroll and bar selection state so it can load it up nicely
    iframe.contentWindow?.postMessage({ scrollTop: $editorStore.scrollY ?? 0, selectedPath: `${$editorStore.selectedPath}${addToTop ? '.0' : ''}`, state: $editorStore.state }, '*')
    addToTop = false
  }
  $: status = $editorStore.page.published ? ($editorStore.page.hasUnpublishedChanges ? 'modified' as const : 'published' as const) : 'unpublished' as const
  $: iframesrc = editable && !$editorStore.previewing
    ? `${environmentConfig.renderBase}/.edit${$pageStore.path}`
    : (
        $editorStore.previewing?.fromVersion?.version
          ? `${environmentConfig.renderBase}/.compare/${$editorStore.previewing.fromVersion.version}/${$editorStore.previewing.version.version ?? 'latest'}${$pageStore.path}`
          : `${environmentConfig.renderBase}/.preview/${$editorStore.previewing?.version.version ?? 'latest'}${$pageStore.path}`
      )

  const actionPanelTarget: { target: string | undefined } = { target: undefined }
  setContext('ActionPanelTarget', { getTarget: () => actionPanelTarget.target })
  $: actionPanelTarget.target = $editorStore.page.path

  $: deviceWidths = keyby(pagetemplate.devicePreview?.sizes ?? [
    { label: 'Desktop' },
    { label: 'Tablet', width: 800 },
    { label: 'Mobile', width: 400 }
  ], 'label')
  $: deviceDefault = Object.values(deviceWidths).reduce((acc, curr) => !(acc.default) && ((curr.width ?? Number.MAX_SAFE_INTEGER) > (acc.width ?? Number.MAX_SAFE_INTEGER) || curr.default) ? curr : acc, Object.values(deviceWidths)[0])
  $: allowEditorMaxWidth = $editorStore.previewing || pagetemplate.devicePreview?.showWhileEditing
  $: resolvedDevice = $editorStore.device ?? deviceDefault.label
  $: editorMaxWidth = allowEditorMaxWidth ? ((deviceWidths[resolvedDevice]?.width ?? 0) > 0 ? deviceWidths[resolvedDevice]?.width + 'px' : undefined) : undefined

  let addToTop: boolean = false
</script>

{#if $editorStore.previewing && ($editorStore.previewing.version.version !== $editorStore.page.version.version || $editorStore.previewing?.fromVersion)}
  <div class="version-preview">
    {#if $editorStore.previewing?.fromVersion}
      <VersionView version={$editorStore.previewing.fromVersion} sidebyside={true} latestVersion={$editorStore.page.version.version} publishedVersion={$editorStore.page.versions[0]?.version} page={$editorStore.page} on:cancel={() => pageEditorStore.cancelPreview()} on:restore={e => pageEditorStore.initRestore(e.detail)}/>
    {/if}
    <VersionView version={$editorStore.previewing.version} sidebyside={!!$editorStore.previewing?.fromVersion} latestVersion={$editorStore.page.version.version} publishedVersion={$editorStore.page.versions[0]?.version} page={$editorStore.page} on:cancel={() => pageEditorStore.cancelPreview()} on:restore={e => pageEditorStore.initRestore(e.detail)}/>
  </div>
{:else}
  <ActionPanel bind:panelelement actionsTitle={$editorStore.selectedPath ? $editorStore.selectedLabel ?? '' : 'Page Actions'} actions={getActions($actionsStore.selectedPath, $editorStore.previewing, page)} on:returnfocus={onReturnFocus}>
    <div class="page-bar"><span>{$editorStore.page.path}</span>
      {#if !$editorStore.previewing || allowEditorMaxWidth}
        <div class="page-bar-controls">
          {#if !$editorStore.previewing}
            <div class="page-bar-buttons {pagetemplate.pageBarButtons ? 'has-buttons' : ''}">
              {#each pagetemplate.pageBarButtons ?? [] as button, idx}
                {#if !button.shouldAppear || button.shouldAppear($editorStore.page.data, $editorStore.page.path)}
                  <button id={`pagebar-button-${idx}`} type="button" class="user-button" on:click={onUserButtonClick(button, idx)}>
                    <Icon icon={button.icon} hiddenLabel={button.hideLabel ? button.label : undefined} />
                    {#if !button.hideLabel}{button.label}{/if}
                  </button>
                {/if}
              {/each}
            </div>
          {/if}
          {#if allowEditorMaxWidth}
            <select value={resolvedDevice} on:change={function () { pageEditorStore.setPreviewMode(this.value) }}>
              {#each Object.keys(deviceWidths) as device}
                <option value={device}>{deviceWidths[device].label}</option>
              {/each}
            </select>
          {/if}
        </div>
      {/if}
    </div>
    <iframe use:messages src={iframesrc} title="page preview for editing" on:load={iframeload} class:devicemode={editorMaxWidth != null} style:max-width={editorMaxWidth}></iframe>
    <div slot="bottom" class="status {status}" let:panelHidden><Icon width="1.1em" inline icon={statusIcon[status]} hiddenLabel={panelHidden ? titleCase(status) : undefined}/>{#if !panelHidden}<span>{titleCase(status)}</span>{/if}</div>
  </ActionPanel>
{/if}

{#if $editorStore.modal === 'edit' && $editorStore.editing}
  {@const template = templateRegistry.getTemplate($editorStore.editing.templateKey)}
  {#if template?.dialog}
    <FormDialog {chooserClient} {tagClient} icon={template.icon} title={template.name} preload={$editorStore.editing.data} submit={onEditComponentSubmit} validate={onEditComponentValidate} on:escape={cancelModal} let:data>
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
        <FormDialog {chooserClient} {tagClient} icon={template.icon} title={template.name} preload={$editorStore.creating.data} submit={onAddComponentSubmit} validate={onAddComponentValidate} on:escape={cancelModal} let:data>
          <svelte:component this={template.dialog} creating={true} page={$editorStore.page} path={$editorStore.creating.componentEventualPath} {data} templateProperties={pagetemplate.templateProperties} {environmentConfig} />
        </FormDialog>
      {/if}
    {:else}
      <Dialog title="Unrecognized Template" on:continue={cancelModal} on:escape={cancelModal}>This content uses an unrecognized template. Please contact support for assistance.</Dialog>
    {/if}
  {:else}
    <Dialog title="What would you like to add?" cancelText="Cancel" continueText="" size="large" on:escape={cancelModal}>
      {#if $editorStore.creating.availableComponents.length}
        <Tabs tabs={$editorStore.creating.availableComponentsByCategory.map(cat => ({ name: cat.category }))} accordionOnMobile={false}>
          {#each $editorStore.creating.availableComponentsByCategory as { category, templates } (category)}
            <Tab name={category}>
              {#if !$editorStore.creating.disableAddToTop && get($editorStore.page.data, $editorStore.creating.path)?.length}
              <form class="position-form">
                <div class="position-label">Positioning</div>
                <div id={`position-help-${category}`} class="position-help">By default your new element will be at the bottom of the area.</div>
                <label for={`position-${category}`}>
                  <Checkbox id={`position-${category}`} name="addtotop" value={addToTop} onChange={() => { addToTop = !addToTop }} descid={`position-help-${category}`}/>
                  Add this to the top of the area.
                </label>
              </form>
              {/if}
              <div class="chooser-container">
                <div class="component-chooser">
                  {#each templates as availableComponent}
                    {@const templateIcon = availableComponent.preview ?? availableComponent.icon}
                    <button type="button" on:click={onAddComponentChooseTemplate(availableComponent.templateKey)}>
                      {#if isNotNull(templateIcon)}
                        <div class="chooser-icon" class:iconify-icon={!templateIcon?.raw}>
                          <Icon icon={templateIcon} height="50%" />
                        </div>
                      {/if}
                      <span class="component-name">{availableComponent.name}</span>
                    </button>
                  {/each}
                </div>
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
  <FormDialog {chooserClient} {tagClient} icon={template?.icon} title="Edit Page Properties" submit={onEditPagePropertiesSubmit} validate={onEditPagePropertiesValidate} on:escape={cancelModal} preload={$editorStore.editing.data} let:data>
    {#if template?.dialog}
      <svelte:component this={template.dialog} creating={false} page={$editorStore.page} {data} templateProperties={template.templateProperties} {environmentConfig} />
    {:else}
      <span>This content uses an unrecognized template. Please contact support for assistance.</span>
    {/if}
  </FormDialog>
{:else if $editorStore.modal === 'versions'}
  {@const page = $editorStore.page}
  <VersionHistory dataId={page.id} preview={v => pageEditorStore.previewVersion(v)} compare={(v1, v2) => pageEditorStore.compareVersions(v1, v2)} history={api.getPageVersions(page.id)} on:escape={cancelModal} />
{:else if $editorStore.restoreVersion != null}
  <Dialog title="Are You Sure?" cancelText="Cancel" continueText="Restore" on:escape={() => pageEditorStore.cancelRestore()} on:continue={async () => await pageEditorStore.restoreVersion()}>
    Restoring will create a new "latest" version with all the content from this version. All existing versions will remain.
  </Dialog>
{/if}


<style>
  iframe {
    display: block;
    border: 0;
    width: 100%;
    height: calc(100% - 2em);
    margin: 0 auto;
  }
  iframe.devicemode {
    border: 1px solid #757575;
  }

  .position-form {
    margin-bottom: 1.5em;
  }

  .position-label {
    display: block;
    margin-bottom: 0.3em;
    font-weight: 500;
  }

  .position-help {
    font-size: 0.9em;
    color: #595959;
    line-height: 1.25em;
    margin-bottom: 0.4em;
  }

  .chooser-container {
    container-type: inline-size;
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
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    container-type: inline-size;
    container-name: chooser-button;
    color: black;
    border-radius: 0.25em;
    border: 1px solid #808080;
    background-color: #ebebeb;
  }
  .component-chooser button:hover {
    background-color: #d6d6d6;
  }
  .chooser-icon {
    height: 60%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    width: 100%;
  }
  .component-name {
    font-size: 1em;
  }
  @container (max-width: 600px) {
    .component-chooser {
      grid-template-columns: 1fr 1fr;
    }
  }
  @container (max-width: 250px) {
    .component-chooser {
      grid-template-columns: 1fr;
    }
  }
  @container chooser-button (max-width: 125px) {
    .chooser-icon {
      height: 50%;
    }
    .component-name {
      font-size: 0.8em;
    }
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
  .page-bar .user-button {
    color: black;
    border-radius: 2px;
    border: 1px solid #757575;
  }
  .page-bar .page-bar-controls {
    display: flex;
    gap: 1.5em;
  }
  .page-bar .page-bar-controls .page-bar-buttons {
    display: flex;
    gap: 0.5em;
  }
  @media screen and (max-width: 50em) {
    .page-bar {
      flex-direction: column;
    }
    .page-bar .page-bar-buttons.has-buttons {
      margin-top: 0.5em;
    }
    .page-bar .page-bar-controls {
      justify-content: space-between;
      width: 100%;
    }
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
  .version-preview {
    display: flex;
    flex-wrap: nowrap;
    justify-content: space-between;
    width: 100%;
    max-width: 100em;
    margin: 0 auto;
  }
</style>
