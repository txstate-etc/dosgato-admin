<script lang="ts">
  import applicationOutline from '@iconify-icons/mdi/application-outline'
  import deleteEmtpy from '@iconify-icons/mdi/delete-empty'
  import deleteRestore from '@iconify-icons/mdi/delete-restore'
  import archiveLight from '@iconify-icons/ph/archive-light'
  import sandboxIcon from '@iconify-icons/file-icons/sandbox'
  import circleIcon from '@iconify-icons/mdi/circle'
  import layoutLight from '@iconify-icons/ph/layout-light'
  import pencilIcon from '@iconify-icons/mdi/pencil'
  import plusIcon from '@iconify-icons/mdi/plus'
  import publishIcon from '@iconify-icons/mdi/publish'
  import publishOffIcon from '@iconify-icons/mdi/publish-off'
  import squareIcon from '@iconify-icons/mdi/square'
  import triangleIcon from '@iconify-icons/mdi/triangle'
  import duplicateIcon from '@iconify-icons/mdi/content-duplicate'
  import cursorMove from '@iconify-icons/mdi/cursor-move'
  import contentCopy from '@iconify-icons/mdi/content-copy'
  import contentPaste from '@iconify-icons/mdi/content-paste'
  import exportIcon from '@iconify-icons/mdi/export'
  import importIcon from '@iconify-icons/mdi/import'
  import deleteOutline from '@iconify-icons/mdi/delete-outline'
  import trashSimpleFill from '@iconify-icons/ph/trash-simple-fill'
  import type { PopupMenuItem } from '@txstate-mws/svelte-components'
  import { goto } from '$app/navigation'
  import { base } from '$app/paths'
  import { api, ActionPanel, Tree, FormDialog, messageForDialog, Dialog, dateStamp, type ActionPanelAction, DeleteState, environmentConfig, UploadUI, dateStampShort } from '$lib'
  import CreateWithPageDialog from '$lib/components/dialogs/CreateWithPageDialog.svelte'
  import { store, type TypedPageItem } from './+page'
  import './index.css'
  import { FieldSelect, FieldText } from '@dosgato/dialog'
  import { isNull } from 'txstate-utils'

  let modal: 'addpage' | 'deletepage' | 'renamepage' | 'changetemplate' | 'duplicatepage' | 'copiedpage' | 'publishpages' | 'publishwithsubpages' | 'unpublishpages' | 'publishdelete' | 'undeletepage' | 'undeletewithsubpages' | 'import' | undefined = undefined

  const statusIcon = {
    published: triangleIcon,
    modified: circleIcon,
    unpublished: squareIcon
  }

  const siteIcon = {
    PRIMARY: applicationOutline,
    SANDBOX: sandboxIcon,
    ARCHIVE: archiveLight
  }

  function singlepageactions (page: TypedPageItem) {
    const actions: ActionPanelAction[] = [{ label: 'Add Page', icon: plusIcon, disabled: !page.permissions.create, onClick: onClickAddPage }]
    if (page.deleteState === DeleteState.NOTDELETED) actions.push({ label: 'Delete Page', icon: deleteOutline, disabled: !page.permissions.delete, onClick: () => { modal = 'deletepage' } })
    else if (page.deleteState === DeleteState.MARKEDFORDELETE) {
      actions.push(
        { label: 'Restore Page', icon: deleteRestore, disabled: !page.permissions.undelete, onClick: () => { modal = 'undeletepage' } },
        { label: 'Restore incl. Subpages', icon: deleteRestore, disabled: !page.permissions.undelete || !page.hasChildren, onClick: () => { modal = 'undeletewithsubpages' } })
    }
    actions.push(
      { label: 'Edit', icon: pencilIcon, disabled: !page.permissions.update, onClick: () => goto(base + '/pages/' + page.id) },
      { label: 'Change Template', icon: layoutLight, disabled: !page.permissions.update, onClick: onClickTemplateChange },
      { label: 'Rename', icon: pencilIcon, disabled: !page.permissions.move, onClick: () => { modal = 'renamepage' } },
      { label: 'Duplicate', icon: duplicateIcon, disabled: !page.parent?.permissions.create, onClick: () => { modal = 'duplicatepage' } },
      { label: 'Move', icon: cursorMove, disabled: !page.permissions.move, onClick: () => {} },
      { label: 'Copy', icon: contentCopy, disabled: false, onClick: onCopyPage },
      { label: 'Paste', icon: contentPaste, disabled: !page.permissions.create || isNull(copiedPageId), onClick: onPastePage }
    )
    if (page.deleteState === DeleteState.NOTDELETED) actions.push({ label: 'Publish', icon: publishIcon, disabled: !page.permissions.publish, onClick: () => { modal = 'publishpages' } })
    else if (page.deleteState === DeleteState.MARKEDFORDELETE) actions.push({ label: 'Publish Deletion', icon: deleteOutline, disabled: !page.permissions.delete, onClick: () => { modal = 'publishdelete' } })
    actions.push(
      { label: 'Publish w/ Subpages', icon: publishIcon, disabled: !page.permissions.publish || !page.hasChildren, onClick: () => { modal = 'publishwithsubpages' } },
      { label: 'Unpublish', icon: publishOffIcon, disabled: !page.permissions.unpublish, onClick: () => { modal = 'unpublishpages' } },
      { label: 'Export', icon: exportIcon, disabled: false, onClick: () => goto(`${environmentConfig.apiBase}/pages/${page.id}`) },
      { label: 'Import', icon: importIcon, disabled: !page.permissions.create, onClick: () => { modal = 'import' } })
    return actions
  }
  function multipageactions (pages: TypedPageItem[]) {
    if (!pages?.length) return []
    return [
      { label: 'Move', icon: cursorMove, disabled: pages.some(p => !p.permissions.move), onClick: () => {} },
      { label: 'Publish', icon: publishIcon, disabled: pages.some(p => !p.permissions.publish), onClick: () => { modal = 'publishpages' } },
      { label: 'Unpublish', icon: publishOffIcon, disabled: pages.some(p => !p.permissions.unpublish), onClick: () => { modal = 'unpublishpages' } }
    ]
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
    const resp = await api.createPage(state.name, state.templateKey, state.data, $store.selectedItems[0].id, false)
    return {
      success: resp.success,
      messages: resp.messages.map(m => ({ ...m, path: m.arg })),
      data: state
    }
  }

  function onAddPageComplete () {
    availableTemplates = []
    store.openAndRefresh($store.selectedItems[0])
    modal = undefined
  }

  async function validateRename (state) {
    const resp = await api.renamePage($store.selectedItems[0].id, state.name, true)
    return messageForDialog(resp.messages, '')
  }

  async function onRenamePage (state) {
    const resp = await api.renamePage($store.selectedItems[0].id, state.name)
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
    if (resp.success) {
      store.refresh()
      modal = undefined
    }
  }

  let copiedPageId: string | undefined = undefined

  function onCopyPage () {
    copiedPageId = $store.selectedItems[0].id
    modal = 'copiedpage'
  }

  async function onPastePage () {
    if (!copiedPageId) return
    const resp = await api.pastePage(copiedPageId, $store.selectedItems[0].id)
    if (resp.success) {
      store.openAndRefresh($store.selectedItems[0])
    }
  }

  async function onPublishPages () {
    const resp = await api.publishPages($store.selectedItems.map(d => d.id), false)
    if (resp.success) store.refresh()
    modal = undefined
  }

  async function onPublishPagesWithSubpages () {
    const resp = await api.publishPages($store.selectedItems.map(d => d.id), true)
    if (resp.success) store.refresh()
    modal = undefined
  }

  async function onUnpublishPages () {
    const resp = await api.unpublishPages($store.selectedItems.map(d => d.id))
    if (resp.success) store.refresh()
    modal = undefined
  }

  async function onDeletePage () {
    const resp = await api.deletePages([$store.selectedItems[0].id])
    if (resp.success) store.refresh()
    modal = undefined
  }

  async function onPublishDeletion () {
    const resp = await api.publishDeletion([$store.selectedItems[0].id])
    if (resp.success) store.refresh()
    modal = undefined
  }

  async function onUndeletePage () {
    const resp = await api.undeletePages([$store.selectedItems[0].id])
    if (resp.success) store.refresh()
    modal = undefined
  }

  async function onUndeletePageWithChildren () {
    const resp = await api.undeletePages([$store.selectedItems[0].id], true)
    if (resp.success) store.refresh()
    modal = undefined
  }

  async function onImportSaved () {
    store.openAndRefresh($store.selectedItems[0])
    modal = undefined
  }

  async function onClickTemplateChange () {
    availableTemplates = await api.getTemplatesByPage($store.selectedItems[0].id)
    modal = 'changetemplate'
  }
  async function onChangeTemplateSubmit (data: { templateKey: string }) {
    return await api.changeTemplate($store.selectedItems[0].id, data.templateKey)
  }
  async function validateChangeTemplate (data: { templateKey: string }) {
    const resp = await api.changeTemplate($store.selectedItems[0].id, data.templateKey, true)
    return resp.messages
  }
  function onChangeTemplateSaved () {
    store.refresh($store.selectedItems[0].parent)
    modal = undefined
  }
</script>

<ActionPanel actionsTitle={$store.selected.size === 1 ? $store.selectedItems[0].name : 'Pages'} actions={$store.selected.size === 1 ? singlepageactions($store.selectedItems[0]) : multipageactions($store.selectedItems)}>
  <Tree {store} on:choose={({ detail }) => { if (detail.deleteState === DeleteState.NOTDELETED) goto(base + '/pages/' + detail.id) }}
    headers={[
      { label: 'Path', id: 'name', defaultWidth: 'calc(60% - 16.15em)', icon: item => item.deleteState === DeleteState.MARKEDFORDELETE ? deleteEmtpy : item.parent ? applicationOutline : siteIcon[item.type], get: 'name' },
      { label: 'Title', id: 'title', defaultWidth: 'calc(40% - 10.75em)', get: 'title' },
      { label: 'Template', id: 'template', defaultWidth: '8.5em', get: 'template.name' },
      { label: 'Status', id: 'status', defaultWidth: '4em', icon: item => item.deleteState === DeleteState.NOTDELETED ? statusIcon[item.status] : trashSimpleFill, class: item => item.deleteState === DeleteState.NOTDELETED ? item.status : 'deleted' },
      { label: 'Modified', id: 'modified', defaultWidth: '10em', render: item => `<span class="full">${dateStamp(item.modifiedAt)}</span><span class="short">${dateStampShort(item.modifiedAt)}</span>` },
      { label: 'By', id: 'modifiedBy', defaultWidth: '3em', get: 'modifiedBy.id' }
    ]}
  />
</ActionPanel>
{#if modal === 'addpage'}
  <CreateWithPageDialog
    submit={onAddPage}
    validate={validateAddPage}
    title="Add New Page"
    templateChoices={availableTemplates}
    on:escape={() => { modal = undefined }}
    on:saved={onAddPageComplete}/>
{:else if modal === 'renamepage'}
  <FormDialog
    submit={onRenamePage}
    validate={validateRename}
    name='renamepage'
    title='Rename Page'
    preload={{ name: $store.selectedItems[0].name }}
    on:escape={() => { modal = undefined }}
    on:saved={onRenamePageComplete}>
    <FieldText path='name' label='Name' required />
  </FormDialog>
{:else if modal === 'changetemplate'}
  <FormDialog
    submit={onChangeTemplateSubmit}
    validate={validateChangeTemplate}
    title='Change Page Template'
    preload={{ templateKey: $store.selectedItems[0].template?.key }}
    on:escape={() => { modal = undefined }}
    on:saved={onChangeTemplateSaved}>
    <FieldSelect notNull path="templateKey" choices={availableTemplates} />
  </FormDialog>
{:else if modal === 'duplicatepage'}
  <Dialog
    title={`Duplicate Page${$store.selectedItems[0].hasChildren ? 's' : ''}`}
    continueText='Duplicate'
    cancelText='Cancel'
    on:continue={onDuplicatePage}
    on:escape={() => { modal = undefined }}>
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
    on:escape={() => { modal = undefined }}>
    Publish {`${$store.selectedItems.length} page${$store.selectedItems.length > 1 ? 's' : ''}?`}
  </Dialog>
{:else if modal === 'publishwithsubpages'}
  <Dialog
    title='Publish With Subpages'
    continueText='Publish'
    cancelText='Cancel'
    on:continue={onPublishPagesWithSubpages}
    on:escape={() => { modal = undefined }}>
    Publish {`${$store.selectedItems.length} page${$store.selectedItems.length > 1 ? 's' : ''} and ${$store.selectedItems.length > 1 ? 'their' : 'its'} subpages?`}
  </Dialog>
{:else if modal === 'unpublishpages'}
  <Dialog
    title='Unpublish'
    continueText='Unpublish'
    cancelText='Cancel'
    on:continue={onUnpublishPages}
    on:escape={() => { modal = undefined }}>
    Unpublish {`${$store.selectedItems.length} page${$store.selectedItems.length > 1 ? 's' : ''}?`}
  </Dialog>
{:else if modal === 'deletepage'}
  <Dialog
    title='Delete'
    continueText='Delete'
    cancelText='Cancel'
    on:continue={onDeletePage}
    on:escape={() => { modal = undefined }}>
    Delete this page and all its subpages? Deleted pages will no longer be visible on your live site.
  </Dialog>
{:else if modal === 'publishdelete'}
  <Dialog
    title='Publish Deletion'
    continueText='Delete'
    cancelText='Cancel'
    on:continue={onPublishDeletion}
    on:escape={() => { modal = undefined }}>
    Publish this deletion? The selected pages will no longer appear in your site.
  </Dialog>
{:else if modal === 'undeletepage'}
  <Dialog
    title='Restore Deleted Page'
    continueText='Restore'
    cancelText='Cancel'
    on:continue={onUndeletePage}
    on:escape={() => { modal = undefined }}>
    Restore this deleted page?
  </Dialog>
{:else if modal === 'undeletewithsubpages'}
  <Dialog
    title='Restore Deleted Pages'
    continueText='Restore'
    cancelText='Cancel'
    on:continue={onUndeletePageWithChildren}
    on:escape={() => { modal = undefined }}>
    Restore this deleted page and its child pages?
  </Dialog>
{:else if modal === 'import' && $store.selectedItems[0]}
  <UploadUI
    title="Import page into {$store.selectedItems[0].path}"
    uploadPath="{environmentConfig.apiBase}/pages/{$store.selectedItems[0].id}"
    mimeWhitelist={['application/json']}
    maxFiles={1}
    on:escape={() => { modal = undefined }}
    on:saved={onImportSaved} />
{/if}
