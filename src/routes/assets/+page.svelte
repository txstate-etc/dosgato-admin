<script lang="ts">
  import { iconForMime, bytesToHuman, FieldText } from '@dosgato/dialog'
  import arrowsOutCardinalLight from '@iconify-icons/ph/arrows-out-cardinal-light'
  import downloadLight from '@iconify-icons/ph/download-light'
  import folderLight from '@iconify-icons/ph/folder-light'
  import folderPlusLight from '@iconify-icons/ph/folder-plus-light'
  import folderNotchOpenLight from '@iconify-icons/ph/folder-notch-open-light'
  import pencilIcon from '@iconify-icons/mdi/pencil'
  import uploadLight from '@iconify-icons/ph/upload-light'
  import { goto } from '$app/navigation'
  import { api, ActionPanel, Tree, environmentConfig, FormDialog, type CreateAssetFolderInput, messageForDialog, UploadUI, mutationForDialog } from '$lib'
  import { base } from '$app/paths'
  import { store, type TypedAnyAssetItem, type TypedAssetFolderItem } from './+page'
  import './assets.css'

  let modal: 'upload' | 'create' | 'rename' | undefined
  let selectedFolder: TypedAssetFolderItem | undefined

  function singlepageactions (item: TypedAnyAssetItem) {
    return item.kind === 'asset'
      ? [
          { label: 'Edit', icon: pencilIcon, disabled: !item.permissions.update, onClick: () => goto(base + '/assets/' + item.id) },
          { label: 'Download', icon: downloadLight, onClick: () => { goto(`${environmentConfig.apiBase}/assets/${item.id}/${item.filename}`) } },
          { label: 'Move', icon: arrowsOutCardinalLight, onClick: () => { /* TODO */ } }
        ]
      : [
          { label: 'Upload', icon: uploadLight, disabled: !item.permissions.create, onClick: () => { modal = 'upload'; selectedFolder = item as TypedAssetFolderItem } },
          { label: 'Rename Folder', icon: pencilIcon, disabled: !item.permissions.update || !item.parent, onClick: () => { modal = 'rename'; selectedFolder = item as TypedAssetFolderItem } },
          { label: 'Create Folder', icon: folderPlusLight, disabled: !item.permissions.create, onClick: () => { modal = 'create'; selectedFolder = item as TypedAssetFolderItem } }
        ]
  }

  function multipageactions (pages: TypedAnyAssetItem[]) {
    if (!pages?.length) return []
    return [
      // { label: 'Move', disabled: pages.some(p => !p.permissions.move), onClick: () => {} },
      // { label: 'Publish', disabled: pages.some(p => !p.permissions.publish), onClick: () => {} }
    ]
  }

  async function onChildSaved () {
    modal = undefined
    await store.openAndRefresh(selectedFolder!)
    selectedFolder = undefined
  }
  async function onSelfSaved () {
    modal = undefined
    if (selectedFolder?.parent) await store.openAndRefresh(selectedFolder.parent)
    selectedFolder = undefined
  }
  function onModalEscape () {
    modal = undefined
    selectedFolder = undefined
  }

  async function onCreateSubmit (data: CreateAssetFolderInput) {
    if (!selectedFolder) return { success: false, messages: [], data }
    const resp = await api.createAssetFolder({ ...data, parentId: selectedFolder.id })
    return mutationForDialog(resp, { prefix: 'args', dataName: 'assetFolder' })
  }

  async function onCreateValidate (data: CreateAssetFolderInput) {
    if (!selectedFolder) return []
    const { success, messages } = await api.createAssetFolder({ ...data, parentId: selectedFolder.id }, true)
    return messageForDialog(messages, 'args')
  }

  async function onRenameSubmit (data: { name: string }) {
    if (!selectedFolder) return { success: false, messages: [], data }
    const resp = await api.renameAssetFolder(selectedFolder.id, data.name)
    return mutationForDialog(resp, { dataName: 'assetFolder' })
  }

  async function onRenameValidate (data: CreateAssetFolderInput) {
    if (!selectedFolder) return []
    const { success, messages } = await api.renameAssetFolder(selectedFolder.id, data.name, true)
    return messageForDialog(messages)
  }
</script>

<ActionPanel actions={$store.selected.size === 1 ? singlepageactions($store.selectedItems[0]) : multipageactions($store.selectedItems)}>
  <Tree {store} on:choose={({ detail }) => detail.kind === 'asset' && goto(base + '/assets/' + detail.id)}
    headers={[
      { label: 'Path', id: 'name', defaultWidth: 'calc(60% - 16.15em)', icon: item => item.kind === 'asset' ? iconForMime(item.mime) : (item.open ? folderNotchOpenLight : folderLight), render: itm => 'filename' in itm ? itm.filename : itm.name },
      { label: 'Size', id: 'template', defaultWidth: '8.5em', render: itm => itm.kind === 'asset' ? bytesToHuman(itm.size) : '' },
      { label: 'Type', id: 'title', defaultWidth: 'calc(40% - 10.75em)', render: itm => itm.kind === 'asset' ? itm.mime.split(';')[0] : '' },
      { label: 'Modified', id: 'modified', defaultWidth: '10em', render: item => item.kind === 'asset' ? `<span>${item.modifiedAt.toFormat('LLL d yyyy h:mma').replace(/(AM|PM)$/, v => v.toLocaleLowerCase())}</span>` : '' },
      { label: 'By', id: 'modifiedBy', defaultWidth: '3em', get: 'modifiedBy.id' }
    ]}
  />
</ActionPanel>
{#if modal === 'upload' && selectedFolder}
  <UploadUI title="Upload Files to {selectedFolder.path}" uploadPath="{environmentConfig.apiBase}/assets/{selectedFolder.id}" on:escape={onModalEscape} on:saved={onChildSaved} />
{:else if modal === 'create' && selectedFolder}
  <FormDialog title="Create Folder beneath {selectedFolder.path}" on:escape={onModalEscape} submit={onCreateSubmit} validate={onCreateValidate} on:saved={onChildSaved}>
    <FieldText path="name" label="Name" required />
  </FormDialog>
{:else if modal === 'rename' && selectedFolder}
  <FormDialog title="Rename Folder {selectedFolder.path}" preload={{ name: selectedFolder.name }} on:escape={onModalEscape} submit={onRenameSubmit} validate={onRenameValidate} on:saved={onSelfSaved}>
    <FieldText path="name" label="Name" required />
  </FormDialog>
{/if}
