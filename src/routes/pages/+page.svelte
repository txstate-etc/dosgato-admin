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
  import { api, ActionPanel, messageForDialog, dateStamp, type ActionPanelAction, DeleteState, environmentConfig, UploadUI, dateStampShort, type ActionPanelGroup, type CreateWithPageState, DialogWarning, uiLog } from '$lib'
  import CreateWithPageDialog from '$lib/components/dialogs/CreateWithPageDialog.svelte'
  import { _store as store, type TypedPageItem } from './+page'
  import { sandboxIcon } from './sandboxicon'
  import { publishWithSubpagesIcon } from './publishwithsubpagesicon'
  import { copyWithSubpagesIcon } from './copywithsubpagesicon'
  import { statusIcon } from './[id]/helpers'
  import { setContext } from 'svelte'

  let modal: 'addpage' | 'deletepage' | 'renamepage' | 'changetemplate' | 'duplicatepage' | 'copiedpage' | 'publishpages' | 'publishwithsubpages' | 'unpublishpages' | 'publishdelete' | 'undeletepage' | 'undeletewithsubpages' | 'import' | undefined = undefined

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
        { label: 'Restore Page', icon: deleteRestore, disabled: !page.permissions.undelete, onClick: () => { modal = 'undeletepage' } },
        { label: 'Restore incl. Subpages', icon: deleteRestore, disabled: !page.permissions.undelete || !page.hasChildren, onClick: () => { modal = 'undeletewithsubpages' } },
        { label: 'Finalize Deletion', icon: deleteOutline, disabled: !page.permissions.delete, onClick: () => { onClickPublishDeletion() } }
      )
    }

    const simple: ActionPanelGroup = {
      id: 'simple',
      actions: [
        { label: 'Edit', icon: pencilIcon, disabled: !page.permissions.update, onClick: () => goto(base + '/pages/' + page.id) },
        { label: 'Rename', icon: renameIcon, disabled: !page.permissions.move, onClick: () => { modal = 'renamepage' } },
        { label: 'Change Template', icon: layout, disabled: !page.permissions.update, onClick: onClickTemplateChange },
        { label: 'Preview in new window', icon: copySimple, onClick: () => { window.open(base + '/preview?url=' + encodeURIComponent(`${environmentConfig.renderBase}/.preview/latest${page.path}.html`), '_blank') } },
        { label: 'Show Versions', icon: historyIcon, onClick: () => goto(base + '/pages/' + page.id + '#versions') }
      ]
    }

    const movement: ActionPanelGroup = {
      id: 'movement',
      actions: [
        { label: 'Duplicate', icon: duplicateIcon, disabled: !page.parent?.permissions.create, onClick: () => { modal = 'duplicatepage' } }
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
      { label: $store.cut ? 'Move Into' : 'Paste', hiddenLabel: `${$store.cut ? '' : 'into '}${page.name}`, icon: contentPaste, disabled: !store.pasteEligible(), onClick: () => { store.paste(undefined, $store.copyRecursive) } },
      { label: 'Move Above', disabled: !$store.cut || !store.pasteEligible(true), hiddenLabel: `Move above ${page.name}`, onClick: () => { store.paste(true, $store.copyRecursive) }, icon: contentPaste }
    )

    const publishing: ActionPanelGroup = {
      id: 'publishing',
      actions: []
    }

    publishing.actions.push(
      { label: 'Publish', icon: publishIcon, disabled: !page.permissions.publish, onClick: () => { modal = 'publishpages' } },
      { label: 'Publish w/ Subpages', icon: publishWithSubpagesIcon, iconWidth: 1, disabled: !page.permissions.publish || !page.hasChildren, onClick: () => { modal = 'publishwithsubpages' }, class: 'pubsubpages' },
      { label: 'Unpublish', icon: publishOffIcon, disabled: !page.permissions.unpublish, onClick: () => { modal = 'unpublishpages' } }
    )

    const exportimport: ActionPanelGroup = {
      id: 'exportimport',
      actions: [
        { label: 'Export', icon: exportIcon, disabled: false, onClick: () => api.download(`${environmentConfig.renderBase}/.page/${page.id}`) },
        { label: 'Export w/Subpages', icon: exportIcon, disabled: false, onClick: () => api.download(`${environmentConfig.renderBase}/.page/${page.id}?withSubpages=1`) },
        { label: 'Import', icon: importIcon, disabled: !page.permissions.create, onClick: () => { modal = 'import' } }
      ]
    }
    return [createDestroy, simple, movement, publishing, exportimport]
  }
  function multipageactions (pages: TypedPageItem[]) {
    if (!pages?.length) return []
    const actions: ActionPanelAction[] = [
      { label: 'Publish', icon: publishIcon, disabled: pages.some(p => !p.permissions.publish), onClick: () => { modal = 'publishpages' } },
      { label: 'Unpublish', icon: publishOffIcon, disabled: pages.some(p => !p.permissions.unpublish), onClick: () => { modal = 'unpublishpages' } }
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
    modal = 'addpage'
  }

  async function validateAddPage (state) {
    const resp = await api.createPage(state.name, state.templateKey, state.data, $store.selectedItems[0].id, false, true)
    return resp.messages.map(m => ({ ...m, path: (m.arg === 'name' || m.arg === 'templateKey') ? m.arg : `data.${m.arg}` }))
  }

  async function onAddPage (state) {
    const resp = await api.createPage(state.name, state.templateKey, state.data, $store.selectedItems[0].id, false, false)
    uiLog.log({ eventType: `${modal}-modal`, action: resp.success ? 'Success' : 'Failed', additionalProperties: { name: state.name, template: state.templateKey } }, actionPanelTarget.target)
    return {
      success: resp.success,
      messages: resp.messages.map(m => ({ ...m, path: m.arg })),
      data: state
    } as SubmitResponse<CreateWithPageState>
  }

  async function onAddPageComplete () {
    availableTemplates = []
    modal = undefined
    await store.openAndRefresh($store.selectedItems[0])
  }

  async function validateRename (state) {
    const resp = await api.renamePage($store.selectedItems[0].id, state.name, true)
    return messageForDialog(resp.messages, '')
  }

  async function onRenamePage (state) {
    const resp = await api.renamePage($store.selectedItems[0].id, state.name)
    uiLog.log({ eventType: `${modal}-modal`, action: resp.success ? 'Success' : 'Failed' }, actionPanelTarget.target)
    return {
      success: resp.success,
      messages: messageForDialog(resp.messages, ''),
      data: resp.success ? resp.page!.name : state
    }
  }

  function onRenamePageComplete () {
    store.refresh()
    modal = undefined
  }

  async function onDuplicatePage () {
    const resp = await api.duplicatePage($store.selectedItems[0].id, $store.selectedItems[0].parent!.id)
    uiLog.log({ eventType: `${modal}-modal`, action: resp.success ? 'Success' : 'Failed' }, actionPanelTarget.target)
    if (resp.success) {
      store.refresh()
      modal = undefined
    }
  }

  async function onPublishPages () {
    const resp = await api.publishPages($store.selectedItems.map(d => d.id), false)
    uiLog.log({ eventType: `${modal}-modal`, action: resp.success ? 'Success' : 'Failed' }, actionPanelTarget.target)
    modal = undefined
    if (resp.success) await store.refresh()
  }

  async function onPublishPagesWithSubpages () {
    const resp = await api.publishPages($store.selectedItems.map(d => d.id), true)
    uiLog.log({ eventType: `${modal}-modal`, action: resp.success ? 'Success' : 'Failed' }, actionPanelTarget.target)
    modal = undefined
    if (resp.success) await store.refresh()
  }

  async function onUnpublishPages () {
    const resp = await api.unpublishPages($store.selectedItems.map(d => d.id))
    uiLog.log({ eventType: `${modal}-modal`, action: resp.success ? 'Success' : 'Failed' }, actionPanelTarget.target)
    modal = undefined
    if (resp.success) await store.refresh()
  }

  let pagesToDeleteCount: number | undefined = undefined
  async function onClickDelete () {
    // get the number of pages to be deleted
    const page = await api.getDeletePageCount($store.selectedItems[0].id)
    pagesToDeleteCount = 1 + page.children.length
    modal = 'deletepage'
  }

  async function onDeletePage () {
    const resp = await api.deletePages([$store.selectedItems[0].id])
    uiLog.log({ eventType: `${modal}-modal`, action: resp.success ? 'Success' : 'Failed' }, actionPanelTarget.target)
    modal = undefined
    pagesToDeleteCount = undefined
    if (resp.success) await store.refresh()
  }

  async function onClickPublishDeletion () {
    const page = await api.getDeletePageCount($store.selectedItems[0].id)
    pagesToDeleteCount = 1 + page.children.length
    modal = 'publishdelete'
  }

  async function onPublishDeletion () {
    const resp = await api.publishDeletion([$store.selectedItems[0].id])
    uiLog.log({ eventType: `${modal}-modal`, action: resp.success ? 'Success' : 'Failed' }, actionPanelTarget.target)
    modal = undefined
    pagesToDeleteCount = undefined
    if (resp.success) await store.refresh()
  }

  async function onUndeletePage () {
    const resp = await api.undeletePages([$store.selectedItems[0].id])
    uiLog.log({ eventType: `${modal}-modal`, action: resp.success ? 'Success' : 'Failed' }, actionPanelTarget.target)
    modal = undefined
    if (resp.success) await store.refresh()
  }

  async function onUndeletePageWithChildren () {
    const resp = await api.undeletePages([$store.selectedItems[0].id], true)
    uiLog.log({ eventType: `${modal}-modal`, action: resp.success ? 'Success' : 'Failed' }, actionPanelTarget.target)
    modal = undefined
    if (resp.success) await store.refresh()
  }

  async function onImportSaved () {
    uiLog.log({ eventType: `${modal}-modal`, action: 'Success' }, actionPanelTarget.target)
    modal = undefined
    await store.openAndRefresh($store.selectedItems[0])
  }

  async function onClickTemplateChange () {
    availableTemplates = await api.getTemplatesByPage($store.selectedItems[0].id)
    modal = 'changetemplate'
  }
  async function onChangeTemplateSubmit (data: { templateKey: string }) {
    const resp = await api.changeTemplate($store.selectedItems[0].id, data.templateKey)
    uiLog.log({ eventType: `${modal}-modal`, action: resp.success ? 'Success' : 'Failed', additionalProperties: { templateKey: data.templateKey } }, actionPanelTarget.target)
    return resp
  }
  async function validateChangeTemplate (data: { templateKey: string }) {
    const resp = await api.changeTemplate($store.selectedItems[0].id, data.templateKey, { validateOnly: true })
    return resp.messages
  }
  async function onChangeTemplateSaved () {
    modal = undefined
    await store.refresh($store.selectedItems[0].parent)
  }

  const actionPanelTarget: { target: string | undefined } = { target: undefined }
  setContext('ActionPanelTarget', { getTarget: () => actionPanelTarget.target })
  $: actionPanelTarget.target = uiLog.targetFromTreeStore($store, 'path')

  const onEscapeModal = () => {
    uiLog.log({ eventType: `${modal}-modal`, action: 'Cancel' }, actionPanelTarget.target)
    modal = undefined
  }
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
{#if modal === 'addpage'}
  <CreateWithPageDialog
    submit={onAddPage}
    validate={validateAddPage}
    title="Add New Page"
    pagetreeId={$store.selectedItems[0].pagetree.id}
    templateChoices={availableTemplates}
    on:escape={onEscapeModal}
    on:saved={onAddPageComplete}/>
{:else if modal === 'renamepage'}
  <FormDialog
    submit={onRenamePage}
    validate={validateRename}
    name='renamepage'
    title='Rename Page'
    preload={{ name: $store.selectedItems[0].name }}
    on:escape={onEscapeModal}
    on:saved={onRenamePageComplete}>
    <FieldText path='name' label='Name' required />
  </FormDialog>
{:else if modal === 'changetemplate'}
  <FormDialog
    submit={onChangeTemplateSubmit}
    validate={validateChangeTemplate}
    title='Change Page Template'
    preload={{ templateKey: $store.selectedItems[0].template?.key }}
    on:escape={onEscapeModal}
    on:saved={onChangeTemplateSaved}>
    <FieldSelect notNull path="templateKey" choices={availableTemplates} />
  </FormDialog>
{:else if modal === 'duplicatepage'}
  <Dialog
    title={`Duplicate Page${$store.selectedItems[0].hasChildren ? 's' : ''}`}
    continueText='Duplicate'
    cancelText='Cancel'
    on:continue={onDuplicatePage}
    on:escape={onEscapeModal}>
    Duplicate this page and all of its subpages?
  </Dialog>
{:else if modal === 'copiedpage'}
  <Dialog
    title='Copy'
    on:continue={() => { modal = undefined }}>
    Copied page {$store.selectedItems[0].name}
  </Dialog>
{:else if modal === 'publishpages'}
  <Dialog
    title='Publish'
    continueText='Publish'
    cancelText='Cancel'
    on:continue={onPublishPages}
    on:escape={onEscapeModal}>
    Publish {`${$store.selectedItems.length} page${$store.selectedItems.length > 1 ? 's' : ''}?`}
  </Dialog>
{:else if modal === 'publishwithsubpages'}
  <Dialog
    title='Publish With Subpages'
    continueText='Publish'
    cancelText='Cancel'
    on:continue={onPublishPagesWithSubpages}
    on:escape={onEscapeModal}>
    Publish {`${$store.selectedItems.length} page${$store.selectedItems.length > 1 ? 's' : ''} and ${$store.selectedItems.length > 1 ? 'their' : 'its'} subpages?`}
  </Dialog>
{:else if modal === 'unpublishpages'}
  <Dialog
    title='Unpublish'
    continueText='Unpublish'
    cancelText='Cancel'
    on:continue={onUnpublishPages}
    on:escape={onEscapeModal}>
    Unpublish {`${$store.selectedItems.length} page${$store.selectedItems.length > 1 ? 's' : ''}?`}
  </Dialog>
{:else if modal === 'deletepage'}
  <Dialog
    title='Delete'
    continueText='Delete'
    cancelText='Cancel'
    on:continue={onDeletePage}
    on:escape={onEscapeModal}>
    <DialogWarning text={`You are about to delete ${pagesToDeleteCount} pages. Deleted pages will no longer be visible on your live site.`}/>
  </Dialog>
{:else if modal === 'publishdelete'}
  <Dialog
    title='Publish Deletion'
    continueText='Delete'
    cancelText='Cancel'
    on:continue={onPublishDeletion}
    on:escape={onEscapeModal}>
    <DialogWarning text={`You are about to finalize the deletion of ${pagesToDeleteCount} pages. You will no longer see these pages in your site.`}/>
  </Dialog>
{:else if modal === 'undeletepage'}
  <Dialog
    title='Restore Deleted Page'
    continueText='Restore'
    cancelText='Cancel'
    on:continue={onUndeletePage}
    on:escape={onEscapeModal}>
    Restore this deleted page?
  </Dialog>
{:else if modal === 'undeletewithsubpages'}
  <Dialog
    title='Restore Deleted Pages'
    continueText='Restore'
    cancelText='Cancel'
    on:continue={onUndeletePageWithChildren}
    on:escape={onEscapeModal}>
    Restore this deleted page and its child pages?
  </Dialog>
{:else if modal === 'import' && $store.selectedItems[0]}
  <UploadUI
    title="Import page into {$store.selectedItems[0].path}"
    uploadPath="{environmentConfig.apiBase}/pages/{$store.selectedItems[0].id}"
    mimeWhitelist={['application/json', 'application/x-gzip']}
    maxFiles={1}
    on:escape={onEscapeModal}
    on:saved={onImportSaved} />
{/if}

<style>
  :global(.pubsubpages svg){
    margin-left: 0.2em;
  }
</style>
