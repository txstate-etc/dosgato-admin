<script lang="ts">
  import { iconForMime, bytesToHuman, FieldText, FormDialog, Tree, Dialog, humanFileType } from '@dosgato/dialog'
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
  import { goto } from '$app/navigation'
  import { base } from '$app/paths'
  import { api, ActionPanel, environmentConfig, type CreateAssetFolderInput, messageForDialog, UploadUI, mutationForDialog, type ActionPanelAction, dateStamp, dateStampShort, DeleteState, uiLog, ModalContextStore } from '$lib'
  import { _store as store, type AssetFolderItem, type AssetItem, type TypedAnyAssetItem, type TypedAssetFolderItem, type TypedAssetItem } from './+page'
  import { setContext } from 'svelte'

  const actionPanelTarget: { target: string | undefined } = { target: undefined }
  setContext('ActionPanelTarget', { getTarget: () => actionPanelTarget.target })

  type Modals = 'upload' | 'create' | 'rename' | 'renameAsset' | 'delete' | 'finalizeDelete' | 'restore'
  const modalContext = new ModalContextStore<Modals>(undefined, () => actionPanelTarget.target)

  let selectedFolder: TypedAssetFolderItem | undefined
  let selectedAsset: TypedAssetItem | undefined
  $: selectedItem = $store.selected.size === 1 ? $store.selectedItems[0] : undefined

  function singlepageactions (item: TypedAnyAssetItem) {
    const actions: ActionPanelAction[] = item.kind === 'asset'
      ? [
          { label: 'Edit', icon: pencilIcon, disabled: !item.permissions.update, onClick: () => goto(base + '/assets/' + item.id) },
          { label: 'Download', icon: download, onClick: () => { api.download(`${environmentConfig.renderBase}/.asset/${item.id}/${item.filename}`) } },
          { label: 'Rename Asset', icon: renameIcon, disabled: !item.permissions.update, onClick: () => { selectedAsset = item as TypedAssetItem; modalContext.setModal('renameAsset') } }
        ]
      : [
          { label: 'Upload', icon: uploadIcon, disabled: !item.permissions.create, onClick: () => { modalContext.setModal('upload'); selectedFolder = item as TypedAssetFolderItem } },
          { label: 'Download', icon: download, onClick: () => api.download(`${environmentConfig.renderBase}/.asset/zip/${item.gqlId}/${item.name}.zip`) },
          { label: 'Rename Folder', icon: renameIcon, disabled: !item.permissions.update || !item.parent, onClick: () => { modalContext.setModal('rename'); selectedFolder = item as TypedAssetFolderItem } },
          { label: 'Create Folder', icon: folderPlus, disabled: !item.permissions.create, onClick: () => { modalContext.setModal('create'); selectedFolder = item as TypedAssetFolderItem } }
        ]
    if ($store.copied.size) {
      actions.push({ label: `Cancel ${$store.cut ? 'Move' : 'Copy'}`, icon: fileX, onClick: () => { store.cancelCopy() } })
    } else {
      actions.push(
        { label: 'Move', icon: cursorMove, disabled: !item.permissions.move || !store.cutEligible(), onClick: () => store.cut() },
        { label: 'Copy', icon: contentCopy, disabled: !store.copyEligible(), onClick: () => store.copy() }
      )
    }// TODO: Do we want to log these store based actions here or log from the TreeStore API(store.paste())?
    actions.push(
      { label: $store.cut ? 'Move Into' : 'Paste', hiddenLabel: `${$store.cut ? '' : 'into '}${item.name}`, icon: contentPaste, disabled: !store.pasteEligible(), onClick: () => { store.paste() } }
    )
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

  function multipageactions (pages: TypedAnyAssetItem[]) {
    if (!pages?.length) return []
    const actions: ActionPanelAction[] = []
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
    if (detail.kind === 'asset' && detail.permissions.update) goto(base + '/assets/' + detail.id)
  }

  async function onDelete () {
    let resp
    if ($store.selectedItems[0].kind === 'asset') {
      resp = await api.deleteAsset($store.selectedItems[0].id)
      modalContext.logModalResponse(resp, $store.selectedItems[0].path)
    } else {
      resp = await api.deleteAssetFolder($store.selectedItems[0].gqlId)
      modalContext.logModalResponse(resp, $store.selectedItems[0].path)
    }
    if (resp.success) {
      store.refresh()
    }
    modalContext.reset()
  }

  async function onFinalizeDelete () {
    let resp
    if ($store.selectedItems[0].kind === 'asset') {
      resp = await api.finalizeDeleteAsset($store.selectedItems[0].id)
      modalContext.logModalResponse(resp, $store.selectedItems[0].id)
    } else {
      resp = await api.finalizeDeleteAssetFolder($store.selectedItems[0].gqlId)
      modalContext.logModalResponse(resp, $store.selectedItems[0].gqlId)
    }
    if (resp.success) {
      store.refresh()
    }
    modalContext.reset()
  }

  async function onRestore () {
    let resp
    if ($store.selectedItems[0].kind === 'asset') {
      resp = await api.undeleteAsset($store.selectedItems[0].id)
      modalContext.logModalResponse(resp, $store.selectedItems[0].id)
    } else {
      resp = await api.undeleteAssetFolder($store.selectedItems[0].gqlId)
      modalContext.logModalResponse(resp, $store.selectedItems[0].gqlId)
    }
    if (resp.success) {
      store.refresh()
    }
    modalContext.reset()
  }

  $: actionPanelTarget.target = uiLog.targetFromTreeStore($store, 'path')
</script>

<ActionPanel actionsTitle={$store.selected.size === 1 ? $store.selectedItems[0].name : 'Assets'} actions={$store.selected.size === 1 ? singlepageactions($store.selectedItems[0]) : multipageactions($store.selectedItems)}>
  <Tree {store} on:choose={onChoose}
    headers={[
      { label: 'Path', id: 'name', grow: 5, icon: item => ({ icon: item.deleteState === DeleteState.MARKEDFORDELETE ? deleteEmpty : (item.kind === 'asset' ? iconForMime(item.mime) : (item.open ? folderNotchOpen : folderIcon)) }), render: itm => 'filename' in itm ? itm.filename : itm.name },
      { label: 'Size', id: 'size', fixed: '6em', render: itm => itm.kind === 'asset' ? bytesToHuman(itm.size) : '' },
      { label: 'Type', id: 'type', fixed: '10em', render: itm => itm.kind === 'asset' ? humanFileType(itm.mime, itm.extension) : '' },
      { label: 'Modified', id: 'modified', fixed: '10em', render: item => item.kind === 'asset' ? `<span class="full">${dateStamp(item.modifiedAt)}</span><span class="short">${dateStampShort(item.modifiedAt)}</span>` : '' },
      { label: 'By', id: 'modifiedBy', fixed: '5em', get: 'modifiedBy.id' }
    ]} searchable='name'
  />
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
  <Dialog title={`Delete ${$store.selectedItems[0].kind === 'asset' ? 'Asset' : 'Folder'}`} continueText='Delete' cancelText='Cancel' on:continue={onDelete} on:escape={onModalEscape}>
    {#if $store.selectedItems[0].kind === 'asset'}
      Delete this asset?
    {:else}
      Delete this asset folder? All contents will be marked for deletion.
    {/if}
  </Dialog>
{:else if $modalContext.modal === 'finalizeDelete'}
  <Dialog title={`Delete ${$store.selectedItems[0].kind === 'asset' ? 'Asset' : 'Folder'}`} continueText='Delete' cancelText='Cancel' on:continue={onFinalizeDelete} on:escape={onModalEscape}>
    {#if $store.selectedItems[0].kind === 'asset'}
      Delete this asset?
    {:else}
      Delete this asset folder and its contents?
    {/if}
  </Dialog>
{:else if $modalContext.modal === 'restore'}
  <Dialog title={`Restore ${$store.selectedItems[0].kind === 'asset' ? 'Asset' : 'Folder'}`} continueText='Restore' cancelText='Cancel' on:continue={onRestore} on:escape={onModalEscape}>
    {#if $store.selectedItems[0].kind === 'asset'}
      Restore this asset?
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
</style>
