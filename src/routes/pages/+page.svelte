<script lang="ts">
  import applicationOutline from '@iconify-icons/mdi/application-outline'
  import circleIcon from '@iconify-icons/mdi/circle'
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
  import type { PopupMenuItem } from '@txstate-mws/svelte-components'
  import { goto } from '$app/navigation'
  import { base } from '$app/paths'
  import { api, ActionPanel, Tree, FormDialog, messageForDialog, Dialog } from '$lib'
  import CreateWithPageDialog from '$lib/components/dialogs/CreateWithPageDialog.svelte'
  import { store, type TypedPageItem } from './+page'
  import './index.css'
  import { FieldText } from '@dosgato/dialog'
  import { isNull } from 'txstate-utils'

  let modal: 'addpage' | 'deletepage' | 'renamepage' | 'duplicatepage' | 'copiedpage' | 'publishpages' | 'publishwithsubpages' | 'unpublishpages' | undefined = undefined

  const statusIcon = {
    published: triangleIcon,
    modified: circleIcon,
    unpublished: squareIcon
  }

  function singlepageactions (page: TypedPageItem) {
    return [
      { label: 'Add Page', icon: plusIcon, disabled: !page.permissions.create, onClick: () => { onClickAddPage() } },
      { label: 'Delete Page', icon: deleteOutline, disabled: !page.permissions.delete || !page.parent, onClick: () => { modal = 'deletepage' } },
      { label: 'Edit', icon: pencilIcon, disabled: !page.permissions.update, onClick: () => goto(base + '/pages/' + page.id) },
      { label: 'Rename', icon: pencilIcon, disabled: !page.permissions.move || !page.parent, onClick: () => { modal = 'renamepage' } },
      { label: 'Duplicate', icon: duplicateIcon, disabled: !page.permissions.create || !page.parent, onClick: () => { modal = 'duplicatepage' } },
      { label: 'Move', icon: cursorMove, disabled: !page.permissions.move || !page.parent, onClick: () => {} },
      { label: 'Copy', icon: contentCopy, disabled: false, onClick: onCopyPage },
      { label: 'Paste', icon: contentPaste, disabled: !page.permissions.create || isNull(copiedPageId), onClick: onPastePage },
      { label: 'Publish', icon: publishIcon, disabled: !page.permissions.publish || (page.parent && !page.parent.published), onClick: () => { modal = 'publishpages' } },
      { label: 'Publish w/ Subpages', icon: publishIcon, disabled: !page.permissions.publish || (page.parent && !page.parent.published) || !page.hasChildren, onClick: () => { modal = 'publishwithsubpages'} },
      { label: 'Unpublish', icon: publishOffIcon, disabled: !page.permissions.unpublish, onClick: () => { modal = 'unpublishpages' } },
      { label: 'Export', icon: exportIcon, disabled: false, onClick: () => {} },
      { label: 'Import', icon: importIcon, disabled: !page.permissions.create, onClick: () => {} }
    ]
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
</script>

<ActionPanel actions={$store.selected.size === 1 ? singlepageactions($store.selectedItems[0]) : multipageactions($store.selectedItems)}>
  <Tree {store} on:choose={({ detail }) => goto(base + '/pages/' + detail.id)}
    headers={[
      { label: 'Path', id: 'name', defaultWidth: 'calc(60% - 16.15em)', icon: item => applicationOutline, get: 'name' },
      { label: 'Title', id: 'title', defaultWidth: 'calc(40% - 10.75em)', get: 'title' },
      { label: 'Template', id: 'template', defaultWidth: '8.5em', get: 'template.name' },
      { label: 'Status', id: 'status', defaultWidth: '4em', icon: item => statusIcon[item.status], class: item => item.status },
      { label: 'Modified', id: 'modified', defaultWidth: '10em', render: item => `<span>${item.modifiedAt.toFormat('LLL d yyyy h:mma').replace(/(AM|PM)$/, v => v.toLocaleLowerCase())}</span>` },
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
    Delete this page and all its subpages?
  </Dialog>
{/if}
