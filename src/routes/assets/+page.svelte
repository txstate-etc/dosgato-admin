<script lang="ts">
  import { iconForMime, bytesToHuman, FieldText, FormDialog, Tree, Dialog, humanFileType, Icon, expandTreePath } from '@dosgato/dialog'
  import cursorMove from '@iconify-icons/mdi/cursor-move'
  import contentCopy from '@iconify-icons/mdi/content-copy'
  import contentPaste from '@iconify-icons/mdi/content-paste'
  import download from '@iconify-icons/ph/download'
  import fileX from '@iconify-icons/ph/file-x'
  import folderIcon from '@iconify-icons/ph/folder'
  import folderPlus from '@iconify-icons/ph/folder-plus'
  import folderNotchOpen from '@iconify-icons/ph/folder-notch-open'
  import pencilIcon from '@iconify-icons/mdi/pencil'
  import deleteOutline from '@iconify-icons/mdi/delete-outline'
  import deleteEmpty from '@iconify-icons/mdi/delete-empty'
  import deleteRestore from '@iconify-icons/mdi/delete-restore'
  import uploadIcon from '@iconify-icons/ph/upload'
  import renameIcon from '@iconify-icons/material-symbols/format-color-text-rounded'
  import treeStructure from '@iconify-icons/ph/tree-structure'
  import { goto } from '$app/navigation'
  import { base } from '$app/paths'
  import { api, ActionPanel, environmentConfig, type CreateAssetFolderInput, messageForDialog, UploadUI, mutationForDialog, type ActionPanelAction, actionPanelStore, dateStamp, dateStampShort, DeleteState, uiLog, ModalContextStore, SearchInput, DetailList, findInTreeIconSVG } from '$lib'
  import { _store as store, _searchStore as searchStore, _assetsStore as assetsStore, type AssetFolderItem, type AssetItem, type TypedAnyAssetItem, type TypedAssetFolderItem, type TypedAssetItem } from './+page'
  import { setContext, tick } from 'svelte'
  import { htmlEncode, isBlank, isNotBlank, isNotNull, isNull } from 'txstate-utils'

  $: activeStore = $assetsStore.showsearch ? searchStore : store

  const actionPanelTarget: { target: string | undefined } = { target: undefined }
  setContext('ActionPanelTarget', { getTarget: () => actionPanelTarget.target })

  type Modals = 'upload' | 'create' | 'rename' | 'renameAsset' | 'delete' | 'finalizeDelete' | 'restore'
  const modalContext = new ModalContextStore<Modals>(undefined, () => actionPanelTarget.target)

  let selectedFolder: TypedAssetFolderItem | undefined
  let selectedAsset: TypedAssetItem | undefined
  $: selectedItem = $activeStore.selected.size === 1 ? $activeStore.selectedItems[0] : undefined

  function onFilter (e: CustomEvent<string>) {
    if (isBlank(e.detail)) {
      $assetsStore = { showsearch: false, search: '' }
    } else {
      actionPanelStore.hide()
      $assetsStore = { showsearch: true, search: e.detail }
    }
    searchStore.refresh().catch(console.error)
  }
  let searchInput: HTMLInputElement
  async function onClickMinifiedSearch () {
    actionPanelStore.show()
    await tick()
    searchInput?.focus()
  }

  function findInAssetTree (path: string) {
    return async () => {
      const itm = await expandTreePath(store, path.split('/').filter(isNotBlank))
      if (itm) store.select(itm, { clear: true, notify: true })
      $assetsStore = { ...$assetsStore, showsearch: false }
    }
  }
  (window as any).dgAssetsFindInAssetTree = (button: HTMLButtonElement, event: PointerEvent) => {
    event.stopPropagation()
    const path = button.getAttribute('data-path')!
    findInAssetTree(path)().catch(console.error)
  }

  function singlepageactions (item: TypedAnyAssetItem) {
    if ($assetsStore.showsearch) {
      if (item.kind === 'folder') return [] // should not happen
      const actions: ActionPanelAction[] = [
        { label: 'Find in Asset Tree', icon: treeStructure, onClick: findInAssetTree(item.path) },
        { label: 'Edit', icon: pencilIcon, disabled: !item.permissions.update, onClick: async () => await goto(base + '/assets/' + item.id) },
        { label: 'Download', icon: download, onClick: () => { void api.download(`${environmentConfig.renderBase}/.asset/${item.id}/${item.filename}`) } }
      ]
      if (item.deleteState === DeleteState.NOTDELETED) {
        actions.push({ label: 'Delete', icon: deleteOutline, disabled: !item.permissions.delete, onClick: () => modalContext.setModal('delete') })
      } else {
        actions.push(
          { label: 'Restore', icon: deleteRestore, disabled: !item.permissions.undelete, onClick: () => modalContext.setModal('restore') },
          { label: 'Finalize Deletion', icon: deleteOutline, disabled: !item.permissions.delete, onClick: () => modalContext.setModal('finalizeDelete') }
        )
      }
      return actions
    }
    const actions: ActionPanelAction[] = item.kind === 'asset'
      ? [
          { label: 'Edit', icon: pencilIcon, disabled: !item.permissions.update, onClick: async () => await goto(base + '/assets/' + item.id) },
          { label: 'Download', icon: download, onClick: () => { void api.download(`${environmentConfig.renderBase}/.asset/${item.id}/${item.filename}`) } },
          { label: 'Rename Asset', icon: renameIcon, disabled: !item.permissions.update, onClick: () => { selectedAsset = item as TypedAssetItem; modalContext.setModal('renameAsset') } }
        ]
      : [
          { label: 'Upload', icon: uploadIcon, disabled: !item.permissions.create, onClick: () => { modalContext.setModal('upload'); selectedFolder = item as TypedAssetFolderItem } },
          { label: 'Download', icon: download, onClick: async () => await api.download(`${environmentConfig.renderBase}/.asset/zip/${item.gqlId}/${item.name}.zip`) },
          { label: 'Rename Folder', icon: renameIcon, disabled: !item.permissions.update || !item.parent, onClick: () => { modalContext.setModal('rename'); selectedFolder = item as TypedAssetFolderItem } },
          { label: 'Create Folder', icon: folderPlus, disabled: !item.permissions.create, onClick: () => { modalContext.setModal('create'); selectedFolder = item as TypedAssetFolderItem } }
        ]
    if ($store.copied.size) {
      actions.push(
        { label: `Cancel ${$store.cut ? 'Move' : 'Copy'}`, icon: fileX, onClick: () => { store.cancelCopy() } },
        { label: $store.cut ? 'Move Into' : 'Paste', hiddenLabel: `${$store.cut ? '' : 'into '}${item.name}`, icon: contentPaste, disabled: !store.pasteEligible(), onClick: () => { void store.paste() } }
      )
    } else {
      actions.push(
        { label: 'Move', icon: cursorMove, disabled: !item.permissions.move || !store.cutEligible(), onClick: () => store.cut() },
        { label: 'Copy', icon: contentCopy, disabled: !store.copyEligible(), onClick: () => store.copy() }
      )
    }
    // TODO: Do we want to log these store based actions here or log from the TreeStore API(store.paste())?
    if (item.deleteState === DeleteState.NOTDELETED) {
      actions.push({ label: 'Delete', icon: deleteOutline, disabled: !item.permissions.delete, onClick: () => modalContext.setModal('delete') })
    } else {
      actions.push(
        { label: 'Restore', icon: deleteRestore, disabled: !item.permissions.undelete, onClick: () => modalContext.setModal('restore') },
        { label: 'Finalize Deletion', icon: deleteOutline, disabled: !item.permissions.delete, onClick: () => modalContext.setModal('finalizeDelete') }
      )
    }
    return actions
  }

  function multipageactions (items: TypedAnyAssetItem[]) {
    if (!items?.length) return []
    const actions: ActionPanelAction[] = []
    if ($store.copied.size) {
      actions.push({ label: `Cancel ${$store.cut ? 'Move' : 'Copy'}`, icon: fileX, onClick: () => { store.cancelCopy() } })
    } else {
      actions.push(
        { label: 'Move', icon: cursorMove, disabled: !store.cutEligible(), onClick: () => store.cut() },
        { label: 'Copy', icon: contentCopy, disabled: !store.copyEligible(), onClick: () => store.copy() }
      )
    }
    actions.push({ label: 'Delete', icon: deleteOutline, onClick: () => modalContext.setModal('delete'), disabled: items.some(i => i.kind === 'folder' || i.deleteState !== DeleteState.NOTDELETED) })
    actions.push({ label: 'Restore', icon: deleteRestore, onClick: () => modalContext.setModal('restore'), disabled: items.some(i => i.kind === 'folder' || i.deleteState !== DeleteState.MARKEDFORDELETE) })
    actions.push({ label: 'Finalize Deletion', icon: deleteOutline, onClick: () => modalContext.setModal('finalizeDelete'), disabled: items.some(i => i.kind === 'folder' || i.deleteState !== DeleteState.MARKEDFORDELETE) })
    return actions
  }

  async function onChildSaved () {
    modalContext.reset()
    await store.openAndRefresh(selectedFolder!)
    selectedFolder = undefined
  }
  async function onSelfSaved () {
    modalContext.reset()
    if (selectedFolder?.parent) await store.openAndRefresh(selectedFolder.parent)
    selectedFolder = undefined
  }
  function onModalEscape () {
    modalContext.onModalEscape()
    selectedFolder = undefined
  }

  async function onCreateSubmit (data: CreateAssetFolderInput) {
    if (!selectedFolder) return { success: false, messages: [], data }
    const resp = await api.createAssetFolder({ ...data, parentId: selectedFolder.gqlId })
    modalContext.logModalResponse(resp, resp.assetFolder?.path, { parentId: selectedFolder.gqlId })
    return mutationForDialog(resp, { prefix: 'args', dataName: 'assetFolder' })
  }

  async function onCreateValidate (data: CreateAssetFolderInput) {
    if (!selectedFolder) return []
    const { success, messages } = await api.createAssetFolder({ ...data, parentId: selectedFolder.gqlId }, true)
    return messageForDialog(messages, 'args')
  }

  async function onRenameValidate (data: CreateAssetFolderInput) {
    if (!selectedFolder) return []
    const { success, messages } = await api.renameAssetFolder(selectedFolder.gqlId, data.name, true)
    return messageForDialog(messages)
  }
  async function onRenameSubmit (data: { name: string }) {
    if (!selectedFolder) return { success: false, messages: [], data }
    const resp = await api.renameAssetFolder(selectedFolder.gqlId, data.name)
    modalContext.logModalResponse(resp, selectedFolder.path, { oldName: selectedFolder.name, newName: resp.assetFolder?.name })
    return mutationForDialog(resp, { dataName: 'assetFolder' })
  }

  async function onRenameAssetValidate (data: CreateAssetFolderInput) {
    if (!selectedAsset) return []
    const { success, messages } = await api.renameAsset(selectedAsset.id, data.name, true)
    return messageForDialog(messages)
  }
  async function onRenameAssetSubmit (data: { name: string }) {
    if (!selectedAsset) return { success: false, messages: [], data }
    const resp = await api.renameAsset(selectedAsset.id, data.name)
    modalContext.logModalResponse(resp, selectedAsset.path, { oldName: selectedAsset.name, newName: resp.asset?.name })
    return mutationForDialog(resp, { dataName: 'asset' })
  }
  async function onRenameAssetSaved () {
    modalContext.reset()
    if (selectedAsset?.parent) await store.openAndRefresh(selectedAsset.parent)
    selectedAsset = undefined
  }

  function onChoose ({ detail }: CustomEvent<AssetItem | AssetFolderItem>) {
    if (detail.kind === 'asset' && detail.permissions.update) void goto(base + '/assets/' + detail.id)
  }

  async function onDelete () {
    let resp
    if ($activeStore.selectedItems[0].kind === 'asset') {
      resp = await api.deleteAssets($activeStore.selectedItems.map(a => a.id))
      modalContext.logModalResponse(resp, $activeStore.selectedItems.map(a => a.path).join(', '))
    } else {
      resp = await api.deleteAssetFolder($activeStore.selectedItems[0].gqlId)
      modalContext.logModalResponse(resp, $activeStore.selectedItems[0].path)
    }
    if (resp.success) {
      void activeStore.refresh()
    }
    modalContext.reset()
  }

  async function onFinalizeDelete () {
    let resp
    if ($activeStore.selectedItems[0].kind === 'asset') {
      resp = await api.finalizeDeleteAssets($activeStore.selectedItems.map(a => a.id))
      modalContext.logModalResponse(resp, $activeStore.selectedItems.map(a => a.id).join(', '))
    } else {
      resp = await api.finalizeDeleteAssetFolder($activeStore.selectedItems[0].gqlId)
      modalContext.logModalResponse(resp, $activeStore.selectedItems[0].gqlId)
    }
    if (resp.success) {
      void activeStore.refresh()
    }
    modalContext.reset()
  }

  async function onRestore () {
    let resp
    if ($activeStore.selectedItems[0].kind === 'asset') {
      resp = await api.undeleteAssets($activeStore.selectedItems.map(a => a.id))
      modalContext.logModalResponse(resp, $activeStore.selectedItems.map(a => a.id).join(', '))
    } else {
      resp = await api.undeleteAssetFolder($activeStore.selectedItems[0].gqlId)
      modalContext.logModalResponse(resp, $activeStore.selectedItems[0].gqlId)
    }
    if (resp.success) {
      void activeStore.refresh()
    }
    modalContext.reset()
  }

  $: actionPanelTarget.target = uiLog.targetFromTreeStore($store, 'path')

  function handleResponsiveHeaders (treeWidth: number) {
    if (treeWidth > 700) {
      return ['name', 'size', 'type', 'modified', 'modifiedBy']
    } else if (treeWidth > 400) {
      return ['name', 'type', 'size']
    } else {
      return ['name', 'type']
    }
  }

  function handleResponsiveSearchTreeHeaders (treeWidth: number) {
    if (treeWidth > 700) {
      return ['image', 'name', 'size', 'type', 'modified', 'modifiedBy']
    } else if (treeWidth > 500) {
      return ['image', 'name', 'size']
    } else {
      return ['image', 'name']
    }
  }
</script>

{#if $assetsStore.showsearch}
  <div class="searching">Search results for "{$assetsStore.search}"...</div>
{/if}
<ActionPanel actionsTitle={$activeStore.selected.size === 1 ? $activeStore.selectedItems[0].name : 'Assets'} actions={$activeStore.selected.size === 1 ? singlepageactions($activeStore.selectedItems[0]) : multipageactions($activeStore.selectedItems)}>
  <svelte:fragment slot="abovePanel" let:panelHidden>
    <SearchInput bind:searchInput value={$assetsStore.search} on:search={onFilter} on:maximize={onClickMinifiedSearch} minimized={panelHidden} searchLabel="Search Assets" />
  </svelte:fragment>
  {#if $assetsStore.showsearch}
    {#if $searchStore.loading || $searchStore.rootItems?.length}
      <Tree store={searchStore} singleSelect nodeClass={() => 'tree-search'} on:choose={({ detail }) => { if (detail.deleteState === DeleteState.NOTDELETED) void goto(base + '/assets/' + detail.id) }} responsiveHeaders={handleResponsiveSearchTreeHeaders}
        headers={[
          { label: 'Asset', id: 'image', fixed: '10em', class: item => { return 'image-column' }, render: item => { return isNotNull(item.box) ? `<div class="image-wrapper"><img src="${environmentConfig.renderBase}/.asset/${item.id}/w/400/${item.checksum.substring(0, 12)}/${encodeURIComponent(item.filename)}" width="${item.box.width}" height="${item.box.height}" alt="" style="object-fit: contain; max-height: 100px; max-width: 100%;"/>${item.deleteState === DeleteState.MARKEDFORDELETE ? '<span class="sr-only">asset marked for deletion</span><span class="deleted" aria-hidden="true">Deleted</span>' : ''}</div>` : '' }, icon: item => { if (isNull(item.box)) return { icon: item.deleteState === DeleteState.MARKEDFORDELETE ? deleteEmpty : iconForMime(item.mime), label: item.deleteState === DeleteState.MARKEDFORDELETE ? 'Deleted Asset' : undefined } } },
          { label: 'Path', id: 'name', render: item => `<div class="page-name">${item.filename}<div class="page-path">${item.path.split('/').slice(0, -1).join('/')}</div></div><button class="reset search-find-in-tree" type="button" tabindex="-1" onclick="window.dgAssetsFindInAssetTree(this, event)" data-path="${htmlEncode(item.path)}">${findInTreeIconSVG}<span>Find in asset tree</span></button>`, class: item => 'name-column' },
          { label: 'Size', id: 'size', fixed: '6em', render: itm => bytesToHuman(itm.size) },
          { label: 'Type', id: 'type', fixed: '10em', render: itm => humanFileType(itm.mime, itm.extension) },
          { label: 'Modified', id: 'modified', fixed: '10em', render: item => `<span class="full">${dateStamp(item.modifiedAt)}</span><span class="short">${dateStampShort(item.modifiedAt)}</span>` },
          { label: 'By', id: 'modifiedBy', fixed: '5em', get: 'modifiedBy.id' }
        ]}
      />
    {:else}
      <div class="emptysearch">
        <h2>Looks like we don't have any matches for "{$assetsStore.search}"</h2>
      </div>
    {/if}
  {:else}
    <Tree {store} on:choose={onChoose}
      headers={[
        { label: 'Path', id: 'name', grow: 5, icon: item => ({ icon: item.deleteState === DeleteState.MARKEDFORDELETE ? deleteEmpty : (item.kind === 'asset' ? iconForMime(item.mime) : (item.open ? folderNotchOpen : folderIcon)) }), render: itm => 'filename' in itm ? itm.filename : itm.name },
        { label: 'Size', id: 'size', fixed: '6em', render: itm => itm.kind === 'asset' ? bytesToHuman(itm.size) : '' },
        { label: 'Type', id: 'type', fixed: '10em', render: itm => itm.kind === 'asset' ? humanFileType(itm.mime, itm.extension) : '' },
        { label: 'Modified', id: 'modified', fixed: '10em', render: item => item.kind === 'asset' ? `<span class="full">${dateStamp(item.modifiedAt)}</span><span class="short">${dateStampShort(item.modifiedAt)}</span>` : '' },
        { label: 'By', id: 'modifiedBy', fixed: '5em', get: 'modifiedBy.id' }
      ]} searchable='name' enableResize responsiveHeaders={handleResponsiveHeaders}
    />
  {/if}
  <svelte:fragment slot="preview">
    {#if selectedItem?.kind === 'asset' && selectedItem.box}
      <img src="{environmentConfig.renderBase}/.asset/{selectedItem.id}/w/400/{selectedItem.checksum.substring(0, 12)}/{encodeURIComponent(selectedItem.filename)}" width={selectedItem.box.width} height={selectedItem.box.height} alt="">
    {/if}
  </svelte:fragment>
</ActionPanel>
{#if $modalContext.modal === 'upload' && selectedFolder}
  <UploadUI title="Upload Files to {selectedFolder.path}" uploadPath="{environmentConfig.apiBase}/assets/{selectedFolder.gqlId}" on:escape={onModalEscape} on:saved={onChildSaved} />
{:else if $modalContext.modal === 'create' && selectedFolder}
  <FormDialog title="Create Folder beneath {selectedFolder.path}" on:escape={onModalEscape} submit={onCreateSubmit} validate={onCreateValidate} on:saved={onChildSaved}>
    <FieldText path="name" label="Name" required />
  </FormDialog>
{:else if $modalContext.modal === 'rename' && selectedFolder}
  <FormDialog title="Rename Folder {selectedFolder.path}" preload={{ name: selectedFolder.name }} on:escape={onModalEscape} submit={onRenameSubmit} validate={onRenameValidate} on:saved={onSelfSaved}>
    <FieldText path="name" label="Name" required />
  </FormDialog>
{:else if $modalContext.modal === 'renameAsset' && selectedAsset}
  <FormDialog title="Rename Asset {selectedAsset.name}" preload={{ name: selectedAsset.name }} on:escape={onModalEscape} submit={onRenameAssetSubmit} validate={onRenameAssetValidate} on:saved={onRenameAssetSaved}>
    <FieldText path="name" label="Name" required />
  </FormDialog>
{:else if $modalContext.modal === 'delete' }
  <Dialog title={`Delete ${$activeStore.selectedItems[0].kind === 'asset' ? 'Assets' : 'Folder'}`} continueText='Delete' cancelText='Cancel' on:continue={onDelete} on:escape={onModalEscape}>
    {#if $activeStore.selectedItems[0].kind === 'asset'}
      {`Delete ${$activeStore.selectedItems.length} asset${$activeStore.selectedItems.length === 1 ? '' : 's'}?`}
    {:else}
      Delete this asset folder? All contents will be marked for deletion.
    {/if}
  </Dialog>
{:else if $modalContext.modal === 'finalizeDelete'}
  <Dialog title={`Delete ${$activeStore.selectedItems[0].kind === 'asset' ? 'Assets' : 'Folder'}`} continueText='Delete' cancelText='Cancel' on:continue={onFinalizeDelete} on:escape={onModalEscape}>
    {#if $activeStore.selectedItems[0].kind === 'asset'}
    {`Delete ${$activeStore.selectedItems.length} asset${$activeStore.selectedItems.length === 1 ? '' : 's'}?`}
    {:else}
      Delete this asset folder and its contents?
    {/if}
  </Dialog>
{:else if $modalContext.modal === 'restore'}
  <Dialog title={`Restore ${$activeStore.selectedItems[0].kind === 'asset' ? 'Assets' : 'Folder'}`} continueText='Restore' cancelText='Cancel' on:continue={onRestore} on:escape={onModalEscape}>
    {#if $activeStore.selectedItems[0].kind === 'asset'}
    {`Restore ${$activeStore.selectedItems.length} asset${$activeStore.selectedItems.length === 1 ? '' : 's'}?`}
    {:else}
      Restore this asset folder?
    {/if}
  </Dialog>
{/if}

<style>
  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  :global(.tree-search){
    height: 120px;
  }
  :global(.name-column) {
    display: flex;
  }
  :global(.tree-cell.image-column .icon) {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
  }
  :global(.tree-cell.image-column .icon svg) {
    width: 5em;
    height: 5em;
  }
  :global(.tree-cell.image-column .image-wrapper) {
    position: relative;
  }
  :global(.tree-cell.image-column .image-wrapper span.deleted) {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    padding: 0.2em;
    background-color: #fff;
    border: 1px solid black;
    border-radius: 2px;
  }
  .emptysearch {
    padding: 1em;
  }
</style>
