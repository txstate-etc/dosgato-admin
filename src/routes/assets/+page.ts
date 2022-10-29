import { DateTime } from 'luxon'
import { sortby } from 'txstate-utils'
import { type TreeAsset, type TypedTreeItem, type TreeAssetFolder, api, TreeStore, mutationResponse } from '$lib'

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

async function copyHandler (selectedItems: TypedAnyAssetItem[], dropTarget: TypedAnyAssetItem, above: boolean) {
  const resp = await api.query(`mutation copyAssetsAndFolders ($assetIds: [ID!]!, $folderIds: [ID!]!, $targetFolderId: ID!) {
    copyAssetsAndFolders (assetIds: $assetIds, folderIds: $folderIds, targetFolderId: $targetFolderId) {
      ${mutationResponse}
    }
  }`, {
    assetIds: selectedItems.filter(itm => itm.kind === 'asset').map(itm => itm.id),
    folderIds: selectedItems.filter(itm => itm.kind === 'folder').map(itm => itm.id),
    targetFolderId: dropTarget.id
  })
  return resp.success
}

async function moveHandler (selectedItems: TypedAnyAssetItem[], dropTarget: TypedAnyAssetItem, above: boolean) {
  const resp = await api.query(`mutation moveAssetsAndFolders ($assetIds: [ID!]!, $folderIds: [ID!]!, $targetFolderId: ID!) {
    moveAssetsAndFolders (assetIds: $assetIds, folderIds: $folderIds, targetFolderId: $targetFolderId) {
      ${mutationResponse}
    }
  }`, {
    assetIds: selectedItems.filter(itm => itm.kind === 'asset').map(itm => itm.id),
    folderIds: selectedItems.filter(itm => itm.kind === 'folder').map(itm => itm.id),
    targetFolderId: dropTarget.id
  })
  return resp.success
}

function dragEligible (items: (TypedAssetFolderItem | TypedAssetItem)[]) {
  // sites cannot be dragged: they are ordered alphabetically and should not be copied wholesale into other sites
  return items.every(item => !!item.parent)
}

function dropEffect (selectedItems: (TypedAssetFolderItem | TypedAssetItem)[], dropTarget: TypedAnyAssetItem, above: boolean, userWantsCopy: boolean) {
  // assets are alphabetical, so `above` isn't allowed since it's only for controlling ordering
  if (above) return 'none'
  if (dropTarget.kind === 'asset' || !dropTarget.permissions.create) return 'none'

  // if we don't have permission to move one of the selected items then the user needs to request a copy operation
  if (selectedItems.some(p => !p.permissions.move)) return userWantsCopy ? 'copy' : 'none'
  return userWantsCopy ? 'copy' : 'move'
}

export const store: TreeStore<AssetItem | AssetFolderItem> = new TreeStore(fetchChildren, { copyHandler, moveHandler, dragEligible, dropEffect })
