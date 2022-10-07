import { DateTime } from 'luxon'
import { sortby } from 'txstate-utils'
import { type TreeAsset, type TypedTreeItem, type TreeAssetFolder, api, TreeStore } from '$lib'

export interface AssetItem extends Omit<TreeAsset, 'modifiedAt'> {
  kind: 'asset'
  modifiedAt: DateTime
  hasChildren: false
}
export type TypedAssetItem = TypedTreeItem<AssetItem>
export interface AssetFolderItem extends TreeAssetFolder {
  kind: 'folder'
  hasChildren: boolean
}
export type TypedAssetFolderItem = TypedTreeItem<AssetFolderItem>
export type TypedAnyAssetItem = TypedTreeItem<AssetItem | AssetFolderItem>

async function fetchChildren (item?: TypedAssetFolderItem) {
  const { folders, assets } = item ? (await api.getSubFoldersAndAssets(item.id))! : { folders: await api.getRootAssetFolders(), assets: [] }
  const typedfolders = folders.map<AssetFolderItem>(f => ({
    ...f,
    kind: 'folder',
    hasChildren: !!(f.folders.length + f.assets.length)
  }))
  const typedassets = assets.map<AssetItem>(a => ({
    ...a,
    kind: 'asset',
    modifiedAt: DateTime.fromISO(a.modifiedAt),
    hasChildren: false
  }))
  return [...sortby(typedfolders, 'name'), ...sortby(typedassets, 'name')]
}

async function dropHandler (selectedItems: TypedAnyAssetItem[], dropTarget: TypedAnyAssetItem, above: boolean) {
  return true
}

function dragEligible (items: (TypedAssetFolderItem | TypedAssetItem)[]) {
  // sites cannot be dragged: they are ordered alphabetically and should not be copied wholesale into other sites
  return items.every(item => !!item.parent)
}

function dropEligible (selectedItems: (TypedAssetFolderItem | TypedAssetItem)[], dropTarget: TypedAnyAssetItem, above: boolean) {
  // cannot place an item at the root: instead create a new site in the site management UI
  if (!dropTarget.parent && above) return false
  if (dropTarget.kind === 'asset' && !above) return false
  return above ? (dropTarget.parent! as TypedAssetFolderItem).permissions.create : (dropTarget as TypedAssetFolderItem).permissions.create
}

function dropEffect (selectedItems: (TypedAssetFolderItem | TypedAssetItem)[], dropTarget: TypedAnyAssetItem, above: boolean) {
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

export const store: TreeStore<AssetItem | AssetFolderItem> = new TreeStore(fetchChildren, { dropHandler, dragEligible, dropEligible, dropEffect })
