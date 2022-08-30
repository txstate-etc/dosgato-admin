import type { Asset, Folder } from '@dosgato/dialog'
import { omit, pick } from 'txstate-utils'

const chooserPageDetails = `
id
name
path
title
`

export interface ChooserPageDetails {
  id: string
  name: string
  path: string
  title?: string
}

const chooserAssetDetails = `
id
name
extension
path
size
mime
box { width height }
thumbnail { id extension }
`

export interface ChooserAssetDetails {
  id: string
  name: string
  extension: string
  path: string
  size: number
  mime: string
  box?: {
    width: number
    height: number
  }
  thumbnail?: {
    id: string
    extension: string
  }
}

export const GET_SUBPAGES_BY_PATH = `
  query getPagesByPath ($path: String!) {
    pages (filter: { parentPaths: [$path] }) {
      ${chooserPageDetails}
    }
  }
`

export interface GetSubPagesByPath {
  pages: ChooserPageDetails[]
}

export const GET_SUBFOLDERS_AND_ASSETS_BY_PATH = `
  query getPagesByPath ($path: String!) {
    assets (filter: { parentPaths: [$path] }) {
      ${chooserAssetDetails}
    }
    assetfolders (filter: { parentPaths: [$path] }) {
      id
      name
      path
      permissions {
        create
      }
    }
  }
`
export interface ChooserFolderDetails {
  id: string
  name: string
  path: string
  permissions: {
    create: boolean
  }
}
export interface GetSubFoldersAndAssetsByPath {
  assets: ChooserAssetDetails[]
  assetfolders: ChooserFolderDetails[]
}

export const GET_PAGE_BY_LINK = `
  query getPageByLink ($linkId: String!, $path: String!) {
    pages (filter: { links: [{ linkId: $linkId, path: $path }] }) {
      ${chooserPageDetails}
    }
  }
`

export interface GetPageByLink {
  pages: [ChooserPageDetails]
}

export const GET_ASSET_BY_LINK = `
  query getAssetByLink ($link: AssetLinkInput!) {
    assets (filter: { links: [$link] }) {
      ${chooserAssetDetails}
    }
  }
`

export interface GetAssetByLink {
  assets: [ChooserAssetDetails]
}

export function apiAssetToChooserAsset (asset: ChooserAssetDetails | undefined): Asset | undefined {
  if (!asset) return undefined
  return {
    type: 'asset',
    ...pick(asset, 'id', 'name', 'path', 'mime'),
    bytes: asset.size,
    url: `/assets/${asset.id}/${asset.name}.${asset.extension}`,
    image: asset.box ? { ...asset.box, thumbnailUrl: asset.thumbnail ? `/resizes/${asset.thumbnail.id}/${asset.name}.${asset.thumbnail.extension}` : undefined } : undefined
  }
}

export function apiAssetFolderToChooserFolder (f: ChooserFolderDetails): Folder {
  return { ...omit(f, 'permissions'), type: 'folder' as 'folder', acceptsUpload: f.permissions.create }
}
