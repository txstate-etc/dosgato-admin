<script lang="ts">
  import { iconForMime, Icon, bytesToHuman, FieldText } from '@dosgato/dialog'
  import arrowsOutCardinalLight from '@iconify-icons/ph/arrows-out-cardinal-light'
  import downloadLight from '@iconify-icons/ph/download-light'
  import folderLight from '@iconify-icons/ph/folder-light'
  import folderPlusLight from '@iconify-icons/ph/folder-plus-light'
  import folderNotchOpenLight from '@iconify-icons/ph/folder-notch-open-light'
  import pencilIcon from '@iconify-icons/mdi/pencil'
  import uploadLight from '@iconify-icons/ph/upload-light'
  import { DateTime } from 'luxon'
  import { roundTo, unique } from 'txstate-utils'
  import { goto } from '$app/navigation'
  import { api, ActionPanel, Dialog, Tree, TreeStore, type TypedTreeItem, type TreeAsset, type TreeAssetFolder, environmentConfig, uploadWithProgress, FormDialog, type CreateAssetFolderInput, messageForDialog } from '$lib'
  import { base } from '$app/paths'

  interface AssetItem extends Omit<TreeAsset, 'modifiedAt'> {
    kind: 'asset'
    modifiedAt: DateTime
    hasChildren: false
  }
  type TypedAssetItem = TypedTreeItem<AssetItem>
  interface AssetFolderItem extends TreeAssetFolder {
    kind: 'folder'
    hasChildren: boolean
  }
  type TypedAssetFolderItem = TypedTreeItem<AssetFolderItem>
  type TypedAnyAssetItem = TypedTreeItem<AssetItem | AssetFolderItem>

  let modal: 'upload' | 'create' | undefined
  let selectedFolder: TypedAssetFolderItem | undefined
  let dragover = 0
  let uploadList: File[] = []
  let uploadForm: HTMLFormElement
  let uploadLocked = false
  let uploadProgress = 0
  let uploadError: string | undefined

  async function fetchChildren (item?: TypedAssetFolderItem) {
    const { folders, assets } = item ? (await api.getSubFoldersAndAssets(item.id))! : { folders: await api.getRootAssetFolders(), assets: [] }
    const typedfolders = folders.map(f => ({
      ...f,
      kind: 'folder',
      hasChildren: !!(f.folders.length + f.assets.length)
    } as AssetFolderItem))
    const typedassets = assets.map(a => ({
      ...a,
      kind: 'asset',
      modifiedAt: DateTime.fromISO(a.modifiedAt),
      hasChildren: false
    } as AssetItem))
    return [...typedfolders, ...typedassets]
  }

  function singlepageactions (item: TypedAnyAssetItem) {
    return item.kind === 'asset'
      ? [
          { label: 'Edit', icon: pencilIcon, disabled: !item.permissions.update, onClick: () => goto(base + '/assets/' + item.id) },
          { label: 'Download', icon: downloadLight, onClick: () => { goto(`${environmentConfig.apiBase}/assets/${item.id}/${item.filename}`) } },
          { label: 'Move', icon: arrowsOutCardinalLight, onClick: () => { /* TODO */ } }
        ]
      : [
          { label: 'Upload', icon: uploadLight, disabled: !item.permissions.create, onClick: () => { modal = 'upload'; selectedFolder = item as TypedAssetFolderItem } },
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

  async function dropHandler (selectedItems: TypedAnyAssetItem[], dropTarget: TypedAnyAssetItem, above: boolean) {
    return true
  }

  function dragEligible (items: (TypedAssetFolderItem|TypedAssetItem)[]) {
    // sites cannot be dragged: they are ordered alphabetically and should not be copied wholesale into other sites
    return items.every(item => !!item.parent)
  }

  function dropEligible (selectedItems: (TypedAssetFolderItem|TypedAssetItem)[], dropTarget: TypedAnyAssetItem, above: boolean) {
    // cannot place an item at the root: instead create a new site in the site management UI
    if (!dropTarget.parent && above) return false
    if (dropTarget.kind === 'asset' && !above) return false
    return above ? (dropTarget.parent! as TypedAssetFolderItem).permissions.create : (dropTarget as TypedAssetFolderItem).permissions.create
  }

  function dropEffect (selectedItems: (TypedAssetFolderItem|TypedAssetItem)[], dropTarget: TypedAnyAssetItem, above: boolean) {
    const selectedSites = new Set<string>()
    let noMovePerm = false
    for (const slctd of selectedItems) {
      const ancestors = store.collectAncestors(slctd)
      selectedSites.add((ancestors[ancestors.length - 1] ?? slctd).id)
      if (!slctd.permissions.move) noMovePerm = true
    }
    if (selectedSites.size > 1 || noMovePerm) return 'copy'
    const anc = store.collectAncestors(dropTarget)
    const targetSite = (anc[anc.length - 1] ?? dropTarget).id
    return selectedSites.has(targetSite) ? 'move' : 'copy'
  }

  function onUploadDrop (e: DragEvent) {
    e.preventDefault()
    dragover = 0
    if (!uploadLocked && e.dataTransfer?.items?.length) {
      uploadList = unique(uploadList.concat(Array.from(e.dataTransfer.files)), 'name')
    }
  }

  function onUploadEnter (e: DragEvent) {
    if (e.dataTransfer?.items.length) dragover++
  }

  function onUploadLeave (e: DragEvent) {
    if (e.dataTransfer?.items.length) dragover--
  }

  function onUploadChange (e: InputEvent & { currentTarget: HTMLInputElement }) {
    const files = e.currentTarget.files
    if (files?.length) uploadList = unique(uploadList.concat(Array.from(files)), 'name')
    e.currentTarget.value = ''
  }

  async function onUploadSubmit () {
    if (!selectedFolder || uploadLocked) return
    uploadLocked = true
    try {
      const data = new FormData()
      for (let i = 0; i < uploadList.length; i++) {
        data.append('file' + i, uploadList[i])
      }

      await uploadWithProgress(
        uploadForm.action,
        { Authorization: `Bearer ${api.token}` },
        data,
        ratio => { uploadProgress = ratio }
      )
      await store.openAndRefresh(selectedFolder)
      modal = undefined
      selectedFolder = undefined
      uploadList = []
      uploadError = undefined
    } catch (e: any) {
      uploadError = e.message
    } finally {
      uploadLocked = false
    }
  }

  function onUploadEscape () {
    if (!uploadLocked) {
      modal = undefined
      selectedFolder = undefined
      uploadList = []
      uploadError = undefined
    }
  }

  async function onCreateSubmit (data: CreateAssetFolderInput) {
    const { success, messages } = await api.createAssetFolder({ ...data, parentId: selectedFolder!.id })
    if (success) store.refresh(selectedFolder)
    return { success, messages: messageForDialog(messages, 'args'), data }
  }

  async function onCreateValidate (data: CreateAssetFolderInput) {
    if (!selectedFolder) return []
    const { success, messages } = await api.createAssetFolder({ ...data, parentId: selectedFolder!.id }, true)
    return messageForDialog(messages, 'args')
  }

  function onCreateEscape () {
    modal = undefined
    selectedFolder = undefined
  }

  const store: TreeStore<AssetItem | AssetFolderItem> = new TreeStore(fetchChildren, { dropHandler, dragEligible, dropEligible, dropEffect })
</script>

<ActionPanel actions={$store.selected.size === 1 ? singlepageactions($store.selectedItems[0]) : multipageactions($store.selectedItems)}>
  <Tree {store} on:choose={({ detail }) => detail.kind === 'asset' && goto(base + '/assets/' + detail.id)}
    headers={[
      { label: 'Path', id: 'name', defaultWidth: 'calc(60% - 16.15em)', icon: item => item.kind === 'asset' ? iconForMime(item.mime) : (item.open ? folderNotchOpenLight : folderLight), render: itm => 'filename' in itm ? itm.filename : itm.name },
      { label: 'Size', id: 'template', defaultWidth: '8.5em', render: itm => itm.kind === 'asset' ? bytesToHuman(itm.size) : '' },
      { label: 'Type', id: 'title', defaultWidth: 'calc(40% - 10.75em)', get: 'mime' },
      { label: 'Modified', id: 'modified', defaultWidth: '10em', render: item => item.kind === 'asset' ? `<span>${item.modifiedAt.toFormat('LLL d yyyy h:mma').replace(/(AM|PM)$/, v => v.toLocaleLowerCase())}</span>` : '' },
      { label: 'By', id: 'modifiedBy', defaultWidth: '3em', get: 'modifiedBy.id' }
    ]}
  />
</ActionPanel>
{#if modal === 'upload' && selectedFolder}
  <Dialog title="Upload Files to {selectedFolder.path}" cancelText="Cancel" continueText="Upload" on:escape={onUploadEscape} on:continue={onUploadSubmit}>
    {#if uploadLocked}
      <progress value={uploadProgress} aria-label="Assets Uploading">{roundTo(100 * uploadProgress)}%</progress>
    {:else}
      {#if uploadError}<div class="error">{uploadError}</div>{/if}
      <form bind:this={uploadForm} method="POST" enctype="multipart/form-data"
        action="{environmentConfig.apiBase}/assets/{selectedFolder.id}"
        on:submit|preventDefault|stopPropagation={onUploadSubmit}
        class="uploader" class:dragover={dragover > 0}
        on:dragenter={onUploadEnter} on:dragleave={onUploadLeave}
        on:dragover|preventDefault on:drop={onUploadDrop}
      >
        <input type="file" id="uploader_input" multiple on:change={onUploadChange}>
        <label for="uploader_input">Choose or drag files</label>
        <ul>
          {#each uploadList as file}
            <li><Icon icon={iconForMime(file.type)} inline />{file.name}</li>
          {/each}
        </ul>
      </form>
    {/if}
  </Dialog>
{:else if modal === 'create' && selectedFolder}
  <FormDialog title="Create Folder beneath {selectedFolder.path}" on:escape={onCreateEscape} submit={onCreateSubmit} validate={onCreateValidate} on:saved={onCreateEscape}>
    <FieldText path="name" label="Name" required />
  </FormDialog>
{/if}

<style>
  :global(.modified span) {
    font-size: 0.9em;
  }
  .uploader {
    border: 2px dashed #666666;
    border-radius: 0.5em;
    text-align: center;
    padding: 1em;
    min-height: 10em;
  }
  .uploader.dragover {
    border-color: #333333;
  }
  .uploader ul {
    padding: 0;
    margin: 0;
    list-style: none;
    text-align: left;
  }
  progress {
    width: 80%;
    margin-left: 10%;
  }
  input[type="file"] {
    opacity: 0;
  }
  label {
    display: inline-block;
    width: 50%;
    padding: 1em;
    background: #ccc;
    cursor: pointer;
    border-radius: 5px;
    border: 1px solid #ccc;
    margin-bottom: 1em;
  }
  input:focus + label {
    outline: 2px solid blue;
  }
  .error {
    color: red;
  }
</style>
