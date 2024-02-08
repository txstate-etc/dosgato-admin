<script lang="ts">
  import { Dialog, FieldSelect, FieldText, FormDialog, expandTreePath, Tree } from '@dosgato/dialog'
  import cursorMove from '@iconify-icons/mdi/cursor-move'
  import contentCopy from '@iconify-icons/mdi/content-copy'
  import contentPaste from '@iconify-icons/mdi/content-paste'
  import copySimple from '@iconify-icons/ph/copy-simple'
  import deleteEmpty from '@iconify-icons/mdi/delete-empty'
  import deleteOutline from '@iconify-icons/mdi/delete-outline'
  import deleteRestore from '@iconify-icons/mdi/delete-restore'
  import duplicateIcon from '@iconify-icons/mdi/content-duplicate'
  import exportIcon from '@iconify-icons/mdi/export'
  import fileX from '@iconify-icons/ph/file-x'
  import historyIcon from '@iconify-icons/mdi/history'
  import importIcon from '@iconify-icons/mdi/import'
  import layout from '@iconify-icons/ph/layout'
  import pencilIcon from '@iconify-icons/mdi/pencil'
  import plusIcon from '@iconify-icons/mdi/plus'
  import publishIcon from '@iconify-icons/mdi/publish'
  import publishOffIcon from '@iconify-icons/mdi/publish-off'
  import renameIcon from '@iconify-icons/material-symbols/format-color-text-rounded'
  import treeStructure from '@iconify-icons/ph/tree-structure'
  import type { PopupMenuItem } from '@txstate-mws/svelte-components'
  import type { SubmitResponse } from '@txstate-mws/svelte-forms'
  import { setContext, tick } from 'svelte'
  import { htmlEncode, isBlank, isNotBlank } from 'txstate-utils'
  import { goto } from '$app/navigation'
  import { base } from '$app/paths'
  import {
    api, ActionPanel, messageForDialog, dateStamp, type ActionPanelAction, DeleteState, environmentConfig,
    UploadUI, dateStampShort, type ActionPanelGroup, type CreateWithPageState, DialogWarning, uiLog,
    ModalContextStore, getSiteIcon, SearchInput, CreateWithPageDialog, findInTreeIconSVG
  } from '$lib'
  import { _store as store, _searchStore as searchStore, _pagesStore as pagesStore, type TypedPageItem } from './+page'
  import { publishWithSubpagesIcon } from './publishwithsubpagesicon'
  import { copyWithSubpagesIcon } from './copywithsubpagesicon'
  import { moveIntoIcon } from './moveintoicon'
  import { moveAboveIcon } from './moveaboveicon'
  import { statusIcon } from './[id]/helpers'
  import { hidden } from '$lib/components/ActionPanel.svelte'

  $: activeStore = $pagesStore.showsearch ? searchStore : store

  const actionPanelTarget: { target: string | undefined } = { target: undefined }
  setContext('ActionPanelTarget', { getTarget: () => actionPanelTarget.target })

  type Modals = 'addpage' | 'deletepage' | 'renamepage' | 'changetemplate' | 'duplicatepage' | 'copiedpage' | 'publishpages' | 'publishwithsubpages' | 'unpublishpages' | 'publishdelete' | 'undeletepage' | 'undeletewithsubpages' | 'import'
  const modalContext = new ModalContextStore<Modals>(undefined, () => actionPanelTarget.target)

  function onFilter (e: CustomEvent<string>) {
    if (isBlank(e.detail)) {
      $pagesStore = { showsearch: false, search: '' }
    } else {
      $pagesStore = { showsearch: true, search: e.detail }
    }
    searchStore.refresh().catch(console.error)
  }
  let searchInput: HTMLInputElement
  async function onClickMinifiedSearch () {
    $hidden = false
    await tick()
    searchInput?.focus()
  }

  function findInPageTree (path: string) {
    return async () => {
      const itm = await expandTreePath(store, path.split('/').filter(isNotBlank))
      if (itm) store.select(itm, { clear: true, notify: true })
      $pagesStore = { ...$pagesStore, showsearch: false }
    }
  }
  (window as any).dgPagesFindInPageTree = (button: HTMLButtonElement, event: PointerEvent) => {
    event.stopPropagation()
    const path = button.getAttribute('data-path')!
    findInPageTree(path)().catch(console.error)
  }

  function singlepageactions (page: TypedPageItem, ..._: any) {
    const editAction = { label: 'Edit', icon: pencilIcon, disabled: !page.permissions.update, onClick: async () => await goto(base + '/pages/' + page.id) }
    const previewAction = { label: 'Preview in new window', icon: copySimple, onClick: () => { window.open(base + '/preview?url=' + encodeURIComponent(`${environmentConfig.renderBase}/.preview/latest${page.path}.html`), '_blank') } }
    const showVersionsAction = { label: 'Show Versions', icon: historyIcon, onClick: async () => await goto(base + '/pages/' + page.id + '#versions') }
    const publishAction = { label: 'Publish', icon: publishIcon, disabled: !page.permissions.publish, onClick: () => modalContext.setModal('publishpages') }
    const unpublishAction = { label: 'Unpublish', icon: publishOffIcon, disabled: !page.permissions.unpublish, onClick: () => modalContext.setModal('unpublishpages') }
    const exportAction = { label: 'Export', icon: exportIcon, disabled: false, onClick: async () => await api.download(`${environmentConfig.renderBase}/.page/${page.id}`) }
    if ($pagesStore.showsearch) {
      return [{
        id: 'findintree',
        actions: [{ label: 'Find in Page Tree', icon: treeStructure, onClick: findInPageTree(page.path) }]
      }, {
        id: 'basic',
        actions: [editAction, previewAction, showVersionsAction]
      }, {
        id: 'export',
        actions: [exportAction]
      }]
    }

    const createDestroy: ActionPanelGroup = {
      id: 'createdestroy',
      actions: []
    }
    createDestroy.actions.push({ label: 'Add Page', icon: plusIcon, disabled: !page.permissions.create, onClick: onClickAddPage })
    if (page.deleteState === DeleteState.NOTDELETED) createDestroy.actions.push({ label: 'Delete Page', icon: deleteOutline, disabled: !page.permissions.delete, onClick: () => { void countPages('deletepage') } })
    else if (page.deleteState === DeleteState.MARKEDFORDELETE) {
      createDestroy.actions.push(
        { label: 'Restore Page', icon: deleteRestore, disabled: !page.permissions.undelete, onClick: () => modalContext.setModal('undeletepage') },
        { label: 'Restore incl. Subpages', icon: deleteRestore, disabled: !page.permissions.undelete || !page.hasChildren, onClick: () => modalContext.setModal('undeletewithsubpages') },
        { label: 'Finalize Deletion', icon: deleteOutline, disabled: !page.permissions.delete, onClick: () => { void countPages('publishdelete') } }
      )
    }

    const simple: ActionPanelGroup = {
      id: 'simple',
      actions: [
        editAction,
        { label: 'Rename', icon: renameIcon, disabled: !page.permissions.move, onClick: () => modalContext.setModal('renamepage') },
        { label: 'Change Template', icon: layout, disabled: !page.permissions.update, onClick: onClickTemplateChange },
        previewAction,
        showVersionsAction
      ]
    }

    const movement: ActionPanelGroup = {
      id: 'movement',
      actions: [
        { label: 'Duplicate', icon: duplicateIcon, disabled: !page.parent?.permissions.create, onClick: () => modalContext.setModal('duplicatepage') }
      ]
    }

    if ($store.copied.size) {
      movement.actions.push(
        { label: `Cancel ${$store.cut ? 'Move' : 'Copy'}`, icon: fileX, onClick: () => { store.cancelCopy() } },
        { label: $store.cut ? 'Move Into' : 'Paste', hiddenLabel: `${$store.cut ? '' : 'into '}${page.name}`, icon: $store.cut ? moveIntoIcon : contentPaste, disabled: !store.pasteEligible(), onClick: () => { void store.paste(undefined, $store.copyRecursive) } }
      )
      if ($store.cut) {
        movement.actions.push({ label: 'Move Above', disabled: !$store.cut || !store.pasteEligible(true), hiddenLabel: `Move above ${page.name}`, onClick: () => { void store.paste(true, $store.copyRecursive) }, icon: moveAboveIcon })
      }
    } else {
      movement.actions.push(
        { label: 'Move', icon: cursorMove, disabled: !store.cutEligible(), onClick: () => store.cut() },
        { label: 'Copy', icon: contentCopy, disabled: !store.copyEligible(), onClick: () => store.copy() },
        { label: 'Copy w/ Subpages', icon: copyWithSubpagesIcon, disabled: !store.copyEligible() || !page.hasChildren, onClick: () => store.copy(true) }
      )
    }

    const publishing: ActionPanelGroup = {
      id: 'publishing',
      actions: []
    }

    publishing.actions.push(
      publishAction,
      { label: 'Publish w/ Subpages', icon: publishWithSubpagesIcon, disabled: !page.permissions.publish || !page.hasChildren, onClick: () => modalContext.setModal('publishwithsubpages'), class: 'pubsubpages' },
      unpublishAction
    )

    const exportimport: ActionPanelGroup = {
      id: 'exportimport',
      actions: [
        exportAction,
        { label: 'Export w/ Subpages', icon: exportIcon, disabled: false, onClick: async () => await api.download(`${environmentConfig.renderBase}/.page/${page.id}?withSubpages=1`) },
        { label: 'Import', icon: importIcon, disabled: !page.permissions.create, onClick: () => modalContext.setModal('import') }
      ]
    }
    return [createDestroy, simple, movement, publishing, exportimport]
  }
  function multipageactions (pages: TypedPageItem[]) {
    if (!pages?.length) return []
    const actions: ActionPanelAction[] = []
    if (pages.every(p => p.deleteState === DeleteState.NOTDELETED)) {
      actions.push({ label: 'Delete Pages', icon: deleteOutline, disabled: pages.some(p => !p.permissions.delete), onClick: () => { void countPages('deletepage') } })
    }
    if (pages.every(p => p.deleteState === DeleteState.MARKEDFORDELETE)) {
      actions.push({ label: 'Restore Pages', icon: deleteRestore, disabled: pages.some(p => !p.permissions.undelete), onClick: () => { void countPages('undeletewithsubpages') } })
      actions.push({ label: 'Finalize Deletion', icon: deleteOutline, disabled: pages.some(p => !p.permissions.delete), onClick: () => { void countPages('publishdelete') } })
    }
    const publishActions: ActionPanelAction[] = [
      { label: 'Publish', icon: publishIcon, disabled: pages.some(p => !p.permissions.publish), onClick: () => modalContext.setModal('publishpages') },
      { label: 'Unpublish', icon: publishOffIcon, disabled: pages.some(p => !p.permissions.unpublish), onClick: () => modalContext.setModal('unpublishpages') }
    ]
    actions.push(...publishActions)
    if ($store.copied.size) {
      actions.push({ label: `Cancel ${$store.cut ? 'Move' : 'Copy'}`, icon: fileX, onClick: () => { store.cancelCopy() } })
    } else {
      actions.push(
        { label: 'Move', icon: cursorMove, disabled: !store.cutEligible(), onClick: () => store.cut() },
        { label: 'Copy', icon: contentCopy, disabled: !store.copyEligible(), onClick: () => store.copy() }
      )
    }
    return actions
  }

  let availableTemplates: PopupMenuItem[] = []

  async function onClickAddPage () {
    availableTemplates = await api.getTemplatesByPage($activeStore.selectedItems[0].id)
    modalContext.setModal('addpage')
  }

  async function validateAddPage (state) {
    const resp = await api.createPage(state.name, state.templateKey, state.data, $activeStore.selectedItems[0].id, false, true)
    return resp.messages.map(m => ({ ...m, path: (m.arg === 'name' || m.arg === 'templateKey') ? m.arg : `data.${m.arg}` }))
  }

  async function onAddPage (state) {
    const resp = await api.createPage(state.name, state.templateKey, state.data, $activeStore.selectedItems[0].id, false, false)
    modalContext.logModalResponse(resp, actionPanelTarget.target, { name: state.name, templateKey: state.templateKey })
    return {
      success: resp.success,
      messages: resp.messages.map(m => ({ ...m, path: m.arg })),
      data: state
    } as SubmitResponse<CreateWithPageState>
  }

  async function onAddPageComplete () {
    availableTemplates = []
    modalContext.reset()
    await store.openAndRefresh($activeStore.selectedItems[0])
  }

  async function validateRename (state) {
    const resp = await api.renamePage($activeStore.selectedItems[0].id, state.name, true)
    return messageForDialog(resp.messages, '')
  }

  async function onRenamePage (state) {
    const resp = await api.renamePage($activeStore.selectedItems[0].id, state.name)
    modalContext.logModalResponse(resp, $activeStore.selectedItems[0].id, { oldName: $activeStore.selectedItems[0].name, newName: state.name })
    return {
      success: resp.success,
      messages: messageForDialog(resp.messages, ''),
      data: resp.success ? resp.page!.name : state
    }
  }

  function onRenamePageComplete () {
    void store.refresh()
    modalContext.reset()
  }

  async function onDuplicatePage () {
    const resp = await api.duplicatePage($activeStore.selectedItems[0].id, $activeStore.selectedItems[0].parent!.id)
    modalContext.logModalResponse(resp, $activeStore.selectedItems[0].id, { parentId: $activeStore.selectedItems[0].parent!.id })
    if (resp.success) {
      void store.refresh()
      modalContext.reset()
    }
  }

  async function onPublishPages () {
    const resp = await api.publishPages($activeStore.selectedItems.map(d => d.id), false)
    modalContext.logModalResponse(resp, actionPanelTarget.target)
    modalContext.reset()
    if (resp.success) await store.refresh()
  }

  async function onPublishPagesWithSubpages () {
    const resp = await api.publishPages($activeStore.selectedItems.map(d => d.id), true)
    modalContext.logModalResponse(resp, actionPanelTarget.target)
    modalContext.reset()
    if (resp.success) await store.refresh()
  }

  async function onUnpublishPages () {
    const resp = await api.unpublishPages($activeStore.selectedItems.map(d => d.id))
    modalContext.logModalResponse(resp, actionPanelTarget.target)
    modalContext.reset()
    if (resp.success) await store.refresh()
  }

  let pagesToDeleteCount: number | undefined = undefined
  async function countPages (modal: Modals) {
    pagesToDeleteCount = await api.getDeletePageCount($activeStore.selectedItems.map(page => page.id))
    console.log('setting modal to ' + modal)
    modalContext.setModal(modal)
  }

  async function onDeletePage () {
    const resp = await api.deletePages($activeStore.selectedItems.map(page => page.id))
    modalContext.logModalResponse(resp, actionPanelTarget.target)
    modalContext.reset()
    pagesToDeleteCount = undefined
    if (resp.success) await store.refresh()
  }

  async function onPublishDeletion () {
    const resp = await api.publishDeletion($activeStore.selectedItems.map(page => page.id))
    modalContext.logModalResponse(resp, actionPanelTarget.target)
    modalContext.reset()
    pagesToDeleteCount = undefined
    if (resp.success) await store.refresh()
  }

  async function onUndeletePage () {
    const resp = await api.undeletePages([$activeStore.selectedItems[0].id])
    modalContext.logModalResponse(resp, actionPanelTarget.target)
    modalContext.reset()
    if (resp.success) await store.refresh()
  }

  async function onUndeletePageWithChildren () {
    const resp = await api.undeletePages($activeStore.selectedItems.map(page => page.id), true)
    modalContext.logModalResponse(resp, actionPanelTarget.target)
    modalContext.reset()
    pagesToDeleteCount = undefined
    if (resp.success) await store.refresh()
  }

  async function onImportSaved () {
    modalContext.logModalResponse({ success: true }, actionPanelTarget.target)
    modalContext.reset()
    await store.openAndRefresh($activeStore.selectedItems[0])
  }

  async function onClickTemplateChange () {
    availableTemplates = await api.getTemplatesByPage($activeStore.selectedItems[0].id)
    modalContext.setModal('changetemplate')
  }
  async function onChangeTemplateSubmit (data: { templateKey: string }) {
    const resp = await api.changeTemplate($activeStore.selectedItems[0].id, data.templateKey)
    modalContext.logModalResponse(resp, actionPanelTarget.target, { templateKey: data.templateKey })
    return resp
  }
  async function validateChangeTemplate (data: { templateKey: string }) {
    const resp = await api.changeTemplate($activeStore.selectedItems[0].id, data.templateKey, { validateOnly: true })
    return resp.messages
  }
  async function onChangeTemplateSaved () {
    modalContext.reset()
    await store.refresh($activeStore.selectedItems[0].parent)
  }

  $: actionPanelTarget.target = uiLog.targetFromTreeStore($store, 'path')

  function handleResponsiveHeaders (treeWidth: number) {
    if (treeWidth > 900) {
      return ['name', 'title', 'template', 'status', 'modified', 'modifiedBy']
    } else if (treeWidth > 600) {
      return ['name', 'title', 'status', 'template']
    } else if (treeWidth > 500) {
      return ['name', 'status', 'title']
    } else {
      return ['name', 'status']
    }
  }
</script>

{#if $pagesStore.showsearch}
  <div class="searching">Search results for "{$pagesStore.search}"...</div>
{/if}
<ActionPanel actionsTitle={$activeStore.selected.size === 1 ? $activeStore.selectedItems[0].name : 'Pages'} actions={$activeStore.selected.size === 1 ? singlepageactions($activeStore.selectedItems[0]) : multipageactions($activeStore.selectedItems)}>
  <svelte:fragment slot="abovePanel" let:panelHidden>
    <SearchInput bind:searchInput value={$pagesStore.search} on:search={onFilter} on:maximize={onClickMinifiedSearch} minimized={panelHidden} />
  </svelte:fragment>
  {#if $pagesStore.showsearch}
    {#if $searchStore.loading || $searchStore.rootItems?.length}
      <Tree store={searchStore} singleSelect nodeClass={() => 'tree-search'} on:choose={({ detail }) => { if (detail.deleteState === DeleteState.NOTDELETED) void goto(base + '/pages/' + detail.id) }} responsiveHeaders={handleResponsiveHeaders}
        headers={[
          { label: 'Name', id: 'name', grow: 4.5, icon: item => ({ icon: item.deleteState === DeleteState.MARKEDFORDELETE ? deleteEmpty : getSiteIcon(item.site.launchState, item.type) }), render: item => `<div class="page-name">${item.name}<div class="page-path">${item.path.split('/').slice(0, -1).join('/')}</div></div><button class="reset search-find-in-tree" type="button" tabindex="-1" onclick="window.dgPagesFindInPageTree(this, event)" data-path="${htmlEncode(item.path)}">${findInTreeIconSVG}<span>Find in page tree</span></button>` },
          { label: 'Title', id: 'title', grow: 3, get: 'title' },
          { label: 'Template', id: 'template', fixed: '8.5em', get: 'template.name' },
          { label: 'Status', id: 'status', fixed: '4em', icon: item => ({ icon: item.deleteState === DeleteState.NOTDELETED ? statusIcon[item.status] : deleteOutline, label: item.deleteState === DeleteState.NOTDELETED ? item.status : 'deleted' }), class: item => item.deleteState === DeleteState.NOTDELETED ? item.status : 'deleted' },
          { label: 'Modified', id: 'modified', fixed: '10em', render: item => `<span class="full">${dateStamp(item.modifiedAt)}</span><span class="short">${dateStampShort(item.modifiedAt)}</span>` },
          { label: 'By', id: 'modifiedBy', fixed: '5em', get: 'modifiedBy.id' }
        ]}
      />
    {:else}
      <div class="emptysearch">
        <h2>Looks like we don't have any matches for "{$pagesStore.search}"</h2>
        <ul>
          <li>Keywords you enter may match anywhere in a page's name and/or title, including in the middle of a word.<br>For instance, "grad" will find pages with "undergraduate" or "graduate" in their name/title.</li>
          <li>Non alphanumeric characters are treated as spaces, so "high-chair" is treated as the two keywords "high" and "chair".</li>
          <li>Keywords you enter that are less than 4 characters are ignored.</li>
          <li>If you don't enter any keywords 4 characters or larger, your search will return no results.</li>
          <li>If you search for multiple words over 4 characters, all words must be present in either the name or title of the page. Pages missing any of the words will not show up in your search.</li>
        </ul>
      </div>
    {/if}
  {:else}
  <Tree {store} on:choose={({ detail }) => { if (detail.deleteState === DeleteState.NOTDELETED) void goto(base + '/pages/' + detail.id) }} responsiveHeaders={handleResponsiveHeaders}
    headers={[
      { label: 'Path', id: 'name', grow: 4, icon: item => ({ icon: item.deleteState === DeleteState.MARKEDFORDELETE ? deleteEmpty : getSiteIcon(item.site.launchState, item.type) }), render: item => `<div class="page-name">${item.name}</div>` },
      { label: 'Title', id: 'title', grow: 3, get: 'title' },
      { label: 'Template', id: 'template', fixed: '8.5em', get: 'template.name' },
      { label: 'Status', id: 'status', fixed: '4em', icon: item => ({ icon: item.deleteState === DeleteState.NOTDELETED ? statusIcon[item.status] : deleteOutline, label: item.deleteState === DeleteState.NOTDELETED ? item.status : 'deleted' }), class: item => item.deleteState === DeleteState.NOTDELETED ? item.status : 'deleted' },
      { label: 'Modified', id: 'modified', fixed: '10em', render: item => `<span class="full">${dateStamp(item.modifiedAt)}</span><span class="short">${dateStampShort(item.modifiedAt)}</span>` },
      { label: 'By', id: 'modifiedBy', fixed: '5em', get: 'modifiedBy.id' }
    ]} searchable='name' enableResize
  />
  {/if}
</ActionPanel>
{#if $modalContext.modal === 'addpage'}
  <CreateWithPageDialog
    submit={onAddPage}
    validate={validateAddPage}
    title="Add New Page"
    pagetreeId={$activeStore.selectedItems[0].pagetree.id}
    templateChoices={availableTemplates}
    on:escape={modalContext.onModalEscape}
    on:saved={onAddPageComplete}/>
{:else if $modalContext.modal === 'renamepage'}
  <FormDialog
    submit={onRenamePage}
    validate={validateRename}
    name='renamepage'
    title='Rename Page'
    preload={{ name: $activeStore.selectedItems[0].name }}
    on:escape={modalContext.onModalEscape}
    on:saved={onRenamePageComplete}>
    <FieldText path='name' label='Name' required />
  </FormDialog>
{:else if $modalContext.modal === 'changetemplate'}
  <FormDialog
    submit={onChangeTemplateSubmit}
    validate={validateChangeTemplate}
    title='Change Page Template'
    preload={{ templateKey: $activeStore.selectedItems[0].template?.key }}
    on:escape={modalContext.onModalEscape}
    on:saved={onChangeTemplateSaved}>
    <FieldSelect notNull path="templateKey" choices={availableTemplates} />
  </FormDialog>
{:else if $modalContext.modal === 'duplicatepage'}
  <Dialog
    title={`Duplicate Page${$activeStore.selectedItems[0].hasChildren ? 's' : ''}`}
    continueText='Duplicate'
    cancelText='Cancel'
    on:continue={onDuplicatePage}
    on:escape={modalContext.onModalEscape}>
    Duplicate this page and all of its subpages?
  </Dialog>
{:else if $modalContext.modal === 'copiedpage'}
  <Dialog
    title='Copy'
    on:continue={modalContext.onModalEscape}>
    Copied page {$activeStore.selectedItems[0].name}
  </Dialog>
{:else if $modalContext.modal === 'publishpages'}
  <Dialog
    title='Publish'
    continueText='Publish'
    cancelText='Cancel'
    on:continue={onPublishPages}
    on:escape={modalContext.onModalEscape}>
    Publish {`${$activeStore.selectedItems.length} page${$activeStore.selectedItems.length > 1 ? 's' : ''}?`}
  </Dialog>
{:else if $modalContext.modal === 'publishwithsubpages'}
  <Dialog
    title='Publish With Subpages'
    continueText='Publish'
    cancelText='Cancel'
    on:continue={onPublishPagesWithSubpages}
    on:escape={modalContext.onModalEscape}>
    Publish {`${$activeStore.selectedItems.length} page${$activeStore.selectedItems.length > 1 ? 's' : ''} and ${$activeStore.selectedItems.length > 1 ? 'their' : 'its'} subpages?`}
  </Dialog>
{:else if $modalContext.modal === 'unpublishpages'}
  <Dialog
    title='Unpublish'
    continueText='Unpublish'
    cancelText='Cancel'
    on:continue={onUnpublishPages}
    on:escape={modalContext.onModalEscape}>
    Unpublish {`${$activeStore.selectedItems.length} page${$activeStore.selectedItems.length > 1 ? 's' : ''} and ${$activeStore.selectedItems.length > 1 ? 'their' : 'its'} subpages?`}
  </Dialog>
{:else if $modalContext.modal === 'deletepage'}
  <Dialog
    title='Delete'
    continueText='Delete'
    cancelText='Cancel'
    on:continue={onDeletePage}
    on:escape={modalContext.onModalEscape}>
    <DialogWarning text={`You are about to delete ${pagesToDeleteCount} pages. Deleted pages will no longer be visible on your live site.`}/>
  </Dialog>
{:else if $modalContext.modal === 'publishdelete'}
  <Dialog
    title='Publish Deletion'
    continueText='Delete'
    cancelText='Cancel'
    on:continue={onPublishDeletion}
    on:escape={modalContext.onModalEscape}>
    <DialogWarning text={`You are about to finalize the deletion of ${pagesToDeleteCount} pages. You will no longer see these pages in your site.`}/>
  </Dialog>
{:else if $modalContext.modal === 'undeletepage'}
  <Dialog
    title='Restore Deleted Page'
    continueText='Restore'
    cancelText='Cancel'
    on:continue={onUndeletePage}
    on:escape={modalContext.onModalEscape}>
    Restore this deleted page?
  </Dialog>
{:else if $modalContext.modal === 'undeletewithsubpages'}
  <Dialog
    title='Restore Deleted Pages'
    continueText='Restore'
    cancelText='Cancel'
    on:continue={onUndeletePageWithChildren}
    on:escape={modalContext.onModalEscape}>
    Restore {pagesToDeleteCount} pages?
  </Dialog>
{:else if $modalContext.modal === 'import' && $activeStore.selectedItems[0]}
  <UploadUI
    title="Import page into {$activeStore.selectedItems[0].path}"
    uploadPath="{environmentConfig.apiBase}/pages/{$activeStore.selectedItems[0].id}"
    mimeWhitelist={['application/json', 'application/x-gzip']}
    maxFiles={1}
    helptext="Uploaded file must be a Gato .json or .json.gz export file."
    on:escape={modalContext.onModalEscape}
    on:saved={onImportSaved} />
{/if}

<style>
  :global(.tree-node[tabindex="0"]) :global(.page-name) {
    word-wrap: break-word;
    white-space: normal;
  }

  .searching {
    margin-bottom: 0.2em;
    font-weight: 500;
  }
  .emptysearch {
    padding: 1em;
  }
  .emptysearch li {
    padding: 0.5em;
  }
</style>
