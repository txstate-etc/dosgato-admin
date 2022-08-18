<script lang="ts">
  import { iconForMime } from '@dosgato/dialog'
  import arrowsOutCardinalLight from '@iconify-icons/ph/arrows-out-cardinal-light'
  import downloadLight from '@iconify-icons/ph/download-light'
  import folderLight from '@iconify-icons/ph/folder-light'
  import folderNotchOpenLight from '@iconify-icons/ph/folder-notch-open-light'
  import pencilIcon from '@iconify-icons/mdi/pencil'
  import uploadLight from '@iconify-icons/ph/upload-light'
  import { goto } from '$app/navigation'
  import { DateTime } from 'luxon'
  import { api, ActionPanel, Tree, TreeStore, type TypedTreeItem, type TreePage, type TreeAsset, type TreeAssetFolder } from '$lib'
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
          { label: 'Download', icon: downloadLight, onClick: () => { /* goto(item.url) */ } },
          { label: 'Move', icon: arrowsOutCardinalLight, onClick: () => { /* TODO */ } }
        ]
      : [
          { label: 'Upload', icon: uploadLight, disabled: !item.permissions.create, onClick: () => { /* TODO */ } }
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

  const store: TreeStore<AssetItem | AssetFolderItem> = new TreeStore(fetchChildren, { dropHandler, dragEligible, dropEligible, dropEffect })
</script>

<ActionPanel actions={$store.selected.size === 1 ? singlepageactions($store.selectedItems[0]) : multipageactions($store.selectedItems)}>
  <Tree {store} let:item let:level let:isSelected on:choose={({ detail }) => goto(base + '/pages/' + detail.id)}
    headers={[
      { label: 'Path', id: 'name', defaultWidth: 'calc(60% - 16.15em)', icon: item => item.kind === 'asset' ? iconForMime(item.mime) : (item.open ? folderNotchOpenLight : folderLight), get: 'name' },
      { label: 'Size', id: 'template', defaultWidth: '8.5em', get: 'size' },
      { label: 'Type', id: 'title', defaultWidth: 'calc(40% - 10.75em)', get: 'mime' },
      { label: 'Modified', id: 'modified', defaultWidth: '10em', render: item => item.kind === 'asset' ? `<span>${item.modifiedAt.toFormat('LLL d yyyy h:mma').replace(/(AM|PM)$/, v => v.toLocaleLowerCase())}</span>` : '' },
      { label: 'By', id: 'modifiedBy', defaultWidth: '3em', get: 'modifiedBy.id' }
    ]}
  />
</ActionPanel>

<style>
  :global(.modified span) {
    font-size: 0.9em;
  }
</style>
