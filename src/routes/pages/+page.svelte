<script lang="ts">
  import { Dialog, FieldSelect, FieldText, FormDialog, Tree } from '@dosgato/dialog'
  import browserIcon from '@iconify-icons/ph/browser'
  import copySimple from '@iconify-icons/ph/copy-simple'
  import deleteEmpty from '@iconify-icons/mdi/delete-empty'
  import deleteRestore from '@iconify-icons/mdi/delete-restore'
  import archive from '@iconify-icons/ph/archive'
  import fileX from '@iconify-icons/ph/file-x'
  import historyIcon from '@iconify-icons/mdi/history'
  import layout from '@iconify-icons/ph/layout'
  import pencilIcon from '@iconify-icons/mdi/pencil'
  import plusIcon from '@iconify-icons/mdi/plus'
  import publishIcon from '@iconify-icons/mdi/publish'
  import publishOffIcon from '@iconify-icons/mdi/publish-off'
  import duplicateIcon from '@iconify-icons/mdi/content-duplicate'
  import cursorMove from '@iconify-icons/mdi/cursor-move'
  import contentCopy from '@iconify-icons/mdi/content-copy'
  import contentPaste from '@iconify-icons/mdi/content-paste'
  import exportIcon from '@iconify-icons/mdi/export'
  import importIcon from '@iconify-icons/mdi/import'
  import deleteOutline from '@iconify-icons/mdi/delete-outline'
  import renameIcon from '@iconify-icons/material-symbols/format-color-text-rounded'
  import type { PopupMenuItem } from '@txstate-mws/svelte-components'
  import type { SubmitResponse } from '@txstate-mws/svelte-forms'
  import { goto } from '$app/navigation'
  import { base } from '$app/paths'
  import { api, ActionPanel, messageForDialog, dateStamp, type ActionPanelAction, DeleteState, environmentConfig, UploadUI, dateStampShort, type ActionPanelGroup, type CreateWithPageState, DialogWarning, uiLog, ModalContextStore } from '$lib'
  import CreateWithPageDialog from '$lib/components/dialogs/CreateWithPageDialog.svelte'
  import { _store as store, type TypedPageItem } from './+page'
  import { sandboxIcon } from './sandboxicon'
  import { publishWithSubpagesIcon } from './publishwithsubpagesicon'
  import { copyWithSubpagesIcon } from './copywithsubpagesicon'
  import { moveIntoIcon } from './moveintoicon'
  import { moveAboveIcon } from './moveaboveicon'
  import { statusIcon } from './[id]/helpers'
  import { setContext } from 'svelte'

  const actionPanelTarget: { target: string | undefined } = { target: undefined }
  setContext('ActionPanelTarget', { getTarget: () => actionPanelTarget.target })

  type Modals = 'addpage' | 'deletepage' | 'renamepage' | 'changetemplate' | 'duplicatepage' | 'copiedpage' | 'publishpages' | 'publishwithsubpages' | 'unpublishpages' | 'publishdelete' | 'undeletepage' | 'undeletewithsubpages' | 'import'
  const modalContext = new ModalContextStore<Modals>(undefined, () => actionPanelTarget.target)

  const siteIcon = {
    PRIMARY: browserIcon,
    SANDBOX: sandboxIcon,
    ARCHIVE: archive
  }

  function singlepageactions (page: TypedPageItem, ..._: any) {
    const createDestroy: ActionPanelGroup = {
      id: 'createdestroy',
      actions: []
    }
    createDestroy.actions.push({ label: 'Add Page', icon: plusIcon, disabled: !page.permissions.create, onClick: onClickAddPage })
    if (page.deleteState === DeleteState.NOTDELETED) createDestroy.actions.push({ label: 'Delete Page', icon: deleteOutline, disabled: !page.permissions.delete, onClick: () => { onClickDelete() } })
    else if (page.deleteState === DeleteState.MARKEDFORDELETE) {
      createDestroy.actions.push(
        { label: 'Restore Page', icon: deleteRestore, disabled: !page.permissions.undelete, onClick: () => modalContext.setModal('undeletepage') },
        { label: 'Restore incl. Subpages', icon: deleteRestore, disabled: !page.permissions.undelete || !page.hasChildren, onClick: () => modalContext.setModal('undeletewithsubpages') },
        { label: 'Finalize Deletion', icon: deleteOutline, disabled: !page.permissions.delete, onClick: () => { onClickPublishDeletion() } }
      )
    }

    const simple: ActionPanelGroup = {
      id: 'simple',
      actions: [
        { label: 'Edit', icon: pencilIcon, disabled: !page.permissions.update, onClick: () => goto(base + '/pages/' + page.id) },
        { label: 'Rename', icon: renameIcon, disabled: !page.permissions.move, onClick: () => modalContext.setModal('renamepage') },
        { label: 'Change Template', icon: layout, disabled: !page.permissions.update, onClick: onClickTemplateChange },
        { label: 'Preview in new window', icon: copySimple, onClick: () => { window.open(base + '/preview?url=' + encodeURIComponent(`${environmentConfig.renderBase}/.preview/latest${page.path}.html`), '_blank') } },
        { label: 'Show Versions', icon: historyIcon, onClick: () => goto(base + '/pages/' + page.id + '#versions') }
      ]
    }

    const movement: ActionPanelGroup = {
      id: 'movement',
      actions: [
        { label: 'Duplicate', icon: duplicateIcon, disabled: !page.parent?.permissions.create, onClick: () => modalContext.setModal('duplicatepage') }
      ]
    }

    if ($store.copied.size) {
      movement.actions.push({ label: `Cancel ${$store.cut ? 'Move' : 'Copy'}`, icon: fileX, onClick: () => { store.cancelCopy() } })
    } else {
      movement.actions.push(
        { label: 'Move', icon: cursorMove, disabled: !store.cutEligible(), onClick: () => store.cut() },
        { label: 'Copy', icon: contentCopy, disabled: !store.copyEligible(), onClick: () => store.copy() },
        { label: 'Copy w/ Subpages', icon: copyWithSubpagesIcon, disabled: !store.copyEligible() || !page.hasChildren, onClick: () => store.copy(true) }
      )
    }
    movement.actions.push(
      { label: $store.cut ? 'Move Into' : 'Paste', hiddenLabel: `${$store.cut ? '' : 'into '}${page.name}`, icon: $store.cut ? moveIntoIcon : contentPaste, disabled: !store.pasteEligible(), onClick: () => { store.paste(undefined, $store.copyRecursive) } },
      { label: 'Move Above', disabled: !$store.cut || !store.pasteEligible(true), hiddenLabel: `Move above ${page.name}`, onClick: () => { store.paste(true, $store.copyRecursive) }, icon: moveAboveIcon }
    )

    const publishing: ActionPanelGroup = {
      id: 'publishing',
      actions: []
    }

    publishing.actions.push(
      { label: 'Publish', icon: publishIcon, disabled: !page.permissions.publish, onClick: () => modalContext.setModal('publishpages') },
      { label: 'Publish w/ Subpages', icon: publishWithSubpagesIcon, iconWidth: 1, disabled: !page.permissions.publish || !page.hasChildren, onClick: () => modalContext.setModal('publishwithsubpages'), class: 'pubsubpages' },
      { label: 'Unpublish', icon: publishOffIcon, disabled: !page.permissions.unpublish, onClick: () => modalContext.setModal('unpublishpages') }
    )

    const exportimport: ActionPanelGroup = {
      id: 'exportimport',
      actions: [
        { label: 'Export', icon: exportIcon, disabled: false, onClick: () => api.download(`${environmentConfig.renderBase}/.page/${page.id}`) },
        { label: 'Export w/Subpages', icon: exportIcon, disabled: false, onClick: () => api.download(`${environmentConfig.renderBase}/.page/${page.id}?withSubpages=1`) },
        { label: 'Import', icon: importIcon, disabled: !page.permissions.create, onClick: () => modalContext.setModal('import') }
      ]
    }
    return [createDestroy, simple, movement, publishing, exportimport]
  }
  function multipageactions (pages: TypedPageItem[]) {
    if (!pages?.length) return []
    const actions: ActionPanelAction[] = [
      { label: 'Publish', icon: publishIcon, disabled: pages.some(p => !p.permissions.publish), onClick: () => modalContext.setModal('publishpages') },
      { label: 'Unpublish', icon: publishOffIcon, disabled: pages.some(p => !p.permissions.unpublish), onClick: () => modalContext.setModal('unpublishpages') }
    ]
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
    availableTemplates = await api.getTemplatesByPage($store.selectedItems[0].id)
    modalContext.setModal('addpage')
  }

  async function validateAddPage (state) {
    const resp = await api.createPage(state.name, state.templateKey, state.data, $store.selectedItems[0].id, false, true)
    return resp.messages.map(m => ({ ...m, path: (m.arg === 'name' || m.arg === 'templateKey') ? m.arg : `data.${m.arg}` }))
  }

  async function onAddPage (state) {
    const resp = await api.createPage(state.name, state.templateKey, state.data, $store.selectedItems[0].id, false, false)
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
    await store.openAndRefresh($store.selectedItems[0])
  }

  async function validateRename (state) {
    const resp = await api.renamePage($store.selectedItems[0].id, state.name, true)
    return messageForDialog(resp.messages, '')
  }

  async function onRenamePage (state) {
    const resp = await api.renamePage($store.selectedItems[0].id, state.name)
    modalContext.logModalResponse(resp, $store.selectedItems[0].id, { oldName: $store.selectedItems[0].name, newName: state.name })
    return {
      success: resp.success,
      messages: messageForDialog(resp.messages, ''),
      data: resp.success ? resp.page!.name : state
    }
  }

  function onRenamePageComplete () {
    store.refresh()
    modalContext.reset()
  }

  async function onDuplicatePage () {
    const resp = await api.duplicatePage($store.selectedItems[0].id, $store.selectedItems[0].parent!.id)
    modalContext.logModalResponse(resp, $store.selectedItems[0].id, { parentId: $store.selectedItems[0].parent!.id })
    if (resp.success) {
      store.refresh()
      modalContext.reset()
    }
  }

  async function onPublishPages () {
    const resp = await api.publishPages($store.selectedItems.map(d => d.id), false)
    modalContext.logModalResponse(resp, actionPanelTarget.target)
    modalContext.reset()
    if (resp.success) await store.refresh()
  }

  async function onPublishPagesWithSubpages () {
    const resp = await api.publishPages($store.selectedItems.map(d => d.id), true)
    modalContext.logModalResponse(resp, actionPanelTarget.target)
    modalContext.reset()
    if (resp.success) await store.refresh()
  }

  async function onUnpublishPages () {
    const resp = await api.unpublishPages($store.selectedItems.map(d => d.id))
    modalContext.logModalResponse(resp, actionPanelTarget.target)
    modalContext.reset()
    if (resp.success) await store.refresh()
  }

  let pagesToDeleteCount: number | undefined = undefined
  async function onClickDelete () {
    // get the number of pages to be deleted
    const page = await api.getDeletePageCount($store.selectedItems[0].id)
    pagesToDeleteCount = 1 + page.children.length
    modalContext.setModal('deletepage')
  }

  async function onDeletePage () {
    const resp = await api.deletePages([$store.selectedItems[0].id])
    modalContext.logModalResponse(resp, actionPanelTarget.target)
    modalContext.reset()
    pagesToDeleteCount = undefined
    if (resp.success) await store.refresh()
  }

  async function onClickPublishDeletion () {
    const page = await api.getDeletePageCount($store.selectedItems[0].id)
    pagesToDeleteCount = 1 + page.children.length
    modalContext.setModal('publishdelete')
  }

  async function onPublishDeletion () {
    const resp = await api.publishDeletion([$store.selectedItems[0].id])
    modalContext.logModalResponse(resp, actionPanelTarget.target)
    modalContext.reset()
    pagesToDeleteCount = undefined
    if (resp.success) await store.refresh()
  }

  async function onUndeletePage () {
    const resp = await api.undeletePages([$store.selectedItems[0].id])
    modalContext.logModalResponse(resp, actionPanelTarget.target)
    modalContext.reset()
    if (resp.success) await store.refresh()
  }

  async function onUndeletePageWithChildren () {
    const resp = await api.undeletePages([$store.selectedItems[0].id], true)
    modalContext.logModalResponse(resp, actionPanelTarget.target)
    modalContext.reset()
    if (resp.success) await store.refresh()
  }

  async function onImportSaved () {
    modalContext.logModalResponse({ success: true }, actionPanelTarget.target)
    modalContext.reset()
    await store.openAndRefresh($store.selectedItems[0])
  }

  async function onClickTemplateChange () {
    availableTemplates = await api.getTemplatesByPage($store.selectedItems[0].id)
    modalContext.setModal('changetemplate')
  }
  async function onChangeTemplateSubmit (data: { templateKey: string }) {
    const resp = await api.changeTemplate($store.selectedItems[0].id, data.templateKey)
    modalContext.logModalResponse(resp, actionPanelTarget.target, { templateKey: data.templateKey })
    return resp
  }
  async function validateChangeTemplate (data: { templateKey: string }) {
    const resp = await api.changeTemplate($store.selectedItems[0].id, data.templateKey, { validateOnly: true })
    return resp.messages
  }
  async function onChangeTemplateSaved () {
    modalContext.reset()
    await store.refresh($store.selectedItems[0].parent)
  }

  $: actionPanelTarget.target = uiLog.targetFromTreeStore($store, 'path')
</script>

<ActionPanel actionsTitle={$store.selected.size === 1 ? $store.selectedItems[0].name : 'Pages'} actions={$store.selected.size === 1 ? singlepageactions($store.selectedItems[0]) : multipageactions($store.selectedItems)}>
  <Tree {store} on:choose={({ detail }) => { if (detail.deleteState === DeleteState.NOTDELETED) goto(base + '/pages/' + detail.id) }}
    headers={[
      { label: 'Path', id: 'name', grow: 4, icon: item => ({ icon: item.deleteState === DeleteState.MARKEDFORDELETE ? deleteEmpty : item.parent ? browserIcon : siteIcon[item.type] }), get: 'name' },
      { label: 'Title', id: 'title', grow: 3, get: 'title' },
      { label: 'Template', id: 'template', fixed: '8.5em', get: 'template.name' },
      { label: 'Status', id: 'status', fixed: '4em', icon: item => ({ icon: item.deleteState === DeleteState.NOTDELETED ? statusIcon[item.status] : deleteOutline, label: item.deleteState === DeleteState.NOTDELETED ? item.status : 'deleted' }), class: item => item.deleteState === DeleteState.NOTDELETED ? item.status : 'deleted' },
      { label: 'Modified', id: 'modified', fixed: '10em', render: item => `<span class="full">${dateStamp(item.modifiedAt)}</span><span class="short">${dateStampShort(item.modifiedAt)}</span>` },
      { label: 'By', id: 'modifiedBy', fixed: '5em', get: 'modifiedBy.id' }
    ]} searchable='name'
  />
</ActionPanel>
{#if $modalContext.modal === 'addpage'}
  <CreateWithPageDialog
    submit={onAddPage}
    validate={validateAddPage}
    title="Add New Page"
    pagetreeId={$store.selectedItems[0].pagetree.id}
    templateChoices={availableTemplates}
    on:escape={modalContext.onModalEscape}
    on:saved={onAddPageComplete}/>
{:else if $modalContext.modal === 'renamepage'}
  <FormDialog
    submit={onRenamePage}
    validate={validateRename}
    name='renamepage'
    title='Rename Page'
    preload={{ name: $store.selectedItems[0].name }}
    on:escape={modalContext.onModalEscape}
    on:saved={onRenamePageComplete}>
    <FieldText path='name' label='Name' required />
  </FormDialog>
{:else if $modalContext.modal === 'changetemplate'}
  <FormDialog
    submit={onChangeTemplateSubmit}
    validate={validateChangeTemplate}
    title='Change Page Template'
    preload={{ templateKey: $store.selectedItems[0].template?.key }}
    on:escape={modalContext.onModalEscape}
    on:saved={onChangeTemplateSaved}>
    <FieldSelect notNull path="templateKey" choices={availableTemplates} />
  </FormDialog>
{:else if $modalContext.modal === 'duplicatepage'}
  <Dialog
    title={`Duplicate Page${$store.selectedItems[0].hasChildren ? 's' : ''}`}
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
    Copied page {$store.selectedItems[0].name}
  </Dialog>
{:else if $modalContext.modal === 'publishpages'}
  <Dialog
    title='Publish'
    continueText='Publish'
    cancelText='Cancel'
    on:continue={onPublishPages}
    on:escape={modalContext.onModalEscape}>
    Publish {`${$store.selectedItems.length} page${$store.selectedItems.length > 1 ? 's' : ''}?`}
  </Dialog>
{:else if $modalContext.modal === 'publishwithsubpages'}
  <Dialog
    title='Publish With Subpages'
    continueText='Publish'
    cancelText='Cancel'
    on:continue={onPublishPagesWithSubpages}
    on:escape={modalContext.onModalEscape}>
    Publish {`${$store.selectedItems.length} page${$store.selectedItems.length > 1 ? 's' : ''} and ${$store.selectedItems.length > 1 ? 'their' : 'its'} subpages?`}
  </Dialog>
{:else if $modalContext.modal === 'unpublishpages'}
  <Dialog
    title='Unpublish'
    continueText='Unpublish'
    cancelText='Cancel'
    on:continue={onUnpublishPages}
    on:escape={modalContext.onModalEscape}>
    Unpublish {`${$store.selectedItems.length} page${$store.selectedItems.length > 1 ? 's' : ''}?`}
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
    Restore this deleted page and its child pages?
  </Dialog>
{:else if $modalContext.modal === 'import' && $store.selectedItems[0]}
  <UploadUI
    title="Import page into {$store.selectedItems[0].path}"
    uploadPath="{environmentConfig.apiBase}/pages/{$store.selectedItems[0].id}"
    mimeWhitelist={['application/json', 'application/x-gzip']}
    maxFiles={1}
    on:escape={modalContext.onModalEscape}
    on:saved={onImportSaved} />
{/if}

<style>
  :global(.pubsubpages svg){
    margin-left: 0.2em;
  }
</style>
