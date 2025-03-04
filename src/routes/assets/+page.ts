import { type TypedTreeItem, TreeStore } from '@dosgato/dialog'
import { Store } from '@txstate-mws/svelte-store'
import { DateTime } from 'luxon'
import { isBlank, sortby } from 'txstate-utils'
import { type TreeAsset, type TreeAssetFolder, api, mutationResponse, type RootAssetFolder } from '$lib'

export interface AssetItem extends Omit<TreeAsset, 'modifiedAt'> {
  kind: 'asset'
  modifiedAt: DateTime
  hasChildren: false
}
export type TypedAssetItem = TypedTreeItem<AssetItem>
export interface AssetFolderItem extends TreeAssetFolder {
  kind: 'folder'
  gqlId: string
  hasChildren: boolean
}
export type TypedAssetFolderItem = TypedTreeItem<AssetFolderItem>
export type TypedAnyAssetItem = TypedTreeItem<AssetItem | AssetFolderItem>

async function fetchChildren (item?: TypedAssetFolderItem) {
  const { folders, assets } = item ? (await api.getSubFoldersAndAssets(item.gqlId))! : { folders: await api.getRootAssetFolders(), assets: [] as TreeAsset[] }
  const typedfolders = folders.map<AssetFolderItem>((f: TreeAssetFolder) => ({
    ...f,
    id: 'folder-' + f.id,
    gqlId: f.id,
    kind: 'folder' as const,
    hasChildren: !!(f.folders.length + f.assets.length)
  }))
  const typedassets = assets.map<AssetItem>(a => ({
    ...a,
    kind: 'asset',
    modifiedAt: DateTime.fromISO(a.modifiedAt),
    hasChildren: false
  }))
  return sortby([...typedfolders, ...typedassets], 'name')
}

async function copyHandler (selectedItems: TypedAnyAssetItem[], dropTarget: TypedAssetFolderItem, above: boolean) {
  const resp = await api.query(`mutation copyAssetsAndFolders ($assetIds: [ID!]!, $folderIds: [ID!]!, $targetFolderId: ID!) {
    copyAssetsAndFolders (assetIds: $assetIds, folderIds: $folderIds, targetFolderId: $targetFolderId) {
      ${mutationResponse}
    }
  }`, {
    assetIds: selectedItems.filter(itm => itm.kind === 'asset').map(itm => itm.id),
    folderIds: selectedItems.filter(itm => itm.kind === 'folder').map((itm: TypedAssetFolderItem) => itm.gqlId),
    targetFolderId: dropTarget.gqlId
  })
  return resp.success
}

async function moveHandler (selectedItems: TypedAnyAssetItem[], dropTarget: TypedAssetFolderItem, above: boolean) {
  const resp = await api.query(`mutation moveAssetsAndFolders ($assetIds: [ID!]!, $folderIds: [ID!]!, $targetFolderId: ID!) {
    moveAssetsAndFolders (assetIds: $assetIds, folderIds: $folderIds, targetFolderId: $targetFolderId) {
      ${mutationResponse}
    }
  }`, {
    assetIds: selectedItems.filter(itm => itm.kind === 'asset').map(itm => itm.id),
    folderIds: selectedItems.filter(itm => itm.kind === 'folder').map((itm: TypedAssetFolderItem) => itm.gqlId),
    targetFolderId: dropTarget.gqlId
  })
  return resp.success
}

function dragEligible (items: (TypedAssetFolderItem | TypedAssetItem)[]) {
  // sites cannot be dragged: they are ordered alphabetically and should not be copied wholesale into other sites
  return items.every(item => !!item.parent && item.permissions.move)
}

function dropEffect (selectedItems: (TypedAssetFolderItem | TypedAssetItem)[], dropTarget: TypedAnyAssetItem, above: boolean, userWantsCopy: boolean) {
  // assets are alphabetical, so `above` isn't allowed since it's only for controlling ordering
  if (above) return 'none'
  if (dropTarget.kind === 'asset' || !dropTarget.permissions.create) return 'none'

  // if we don't have permission to move one of the selected items then the user needs to request a copy operation
  if (selectedItems.some(p => !p.permissions.move)) return userWantsCopy ? 'copy' : 'none'
  const dropRoot = _store.root(dropTarget)
  const selectedItemsInSameSiteAsTarget = selectedItems.filter(p => _store.root(p).id === dropRoot.id)
  if (selectedItemsInSameSiteAsTarget.length === selectedItems.length) {
    return userWantsCopy ? 'copy' : 'move' // if within the site the user can do whatever they are requesting
  } else if (selectedItemsInSameSiteAsTarget.length) {
    return 'none' // mixing assets/folders from target site and some other site - weird, how about no
  } else {
    return 'copy' // if dragging to another site the operation will be forced into a copy
  }
}

export const _store = new TreeStore<AssetItem | AssetFolderItem>(fetchChildren, { copyHandler, moveHandler, dragEligible, dropEffect })
export const _assetsStore = new Store({ showsearch: false, search: '' })
export const _searchStore = new TreeStore(async () => {
  const search = (_assetsStore as any).value.search
  if (isBlank(search)) return []
  else {
    const assets = await api.getSearchAssets(search)
    return assets.map<AssetItem>(a => ({
      ...a,
      kind: 'asset',
      modifiedAt: DateTime.fromISO(a.modifiedAt),
      hasChildren: false,
      children: undefined
    }))
  }
})
