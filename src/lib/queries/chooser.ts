import { environmentConfig } from '$lib/stores'
import type { Asset, Folder } from '@dosgato/dialog'
import { omit, pick, stringify } from 'txstate-utils'

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
checksum
site { id }
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
  checksum: string
  site: {
    id: string
  }
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
  query getPagesByPath ($path: UrlSafePath!) {
    pages (filter: { parentPaths: [$path] }) {
      ${chooserPageDetails}
    }
  }
`

export interface GetSubPagesByPath {
  pages: ChooserPageDetails[]
}

export const GET_SUBFOLDERS_AND_ASSETS_BY_PATH = `
  query getPagesByPath ($path: UrlSafePath!) {
    assets (filter: { parentPaths: [$path] }) {
      ${chooserAssetDetails}
    }
    assetfolders (filter: { parentPaths: [$path] }) {
      id
      name
      path
      site { id }
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
  site: { id: string }
  permissions: {
    create: boolean
  }
}
export interface GetSubFoldersAndAssetsByPath {
  assets: ChooserAssetDetails[]
  assetfolders: ChooserFolderDetails[]
}

export const GET_PAGE_BY_LINK = `
  query getPageByLink ($pageLink: PageLinkInput!) {
    pages (filter: { links: [$pageLink] }) {
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
    ...pick(asset, 'name', 'path', 'mime'),
    id: stringify({ id: asset.id, source: 'assets', type: 'asset', checksum: asset.checksum, siteId: asset.site.id, path: asset.path }),
    bytes: asset.size,
    url: `/assets/${asset.id}/${asset.name}.${asset.extension}`,
    image: asset.box ? { ...asset.box, thumbnailUrl: asset.thumbnail ? `${environmentConfig.apiBase}/resize/${asset.thumbnail.id}/${asset.name}.${asset.thumbnail.extension}` : undefined } : undefined
  }
}

export function apiAssetFolderToChooserFolder (f: ChooserFolderDetails): Folder {
  return {
    type: 'folder' as const,
    ...omit(f, 'permissions', 'id'),
    id: stringify({ id: f.id, siteId: f.site.id, path: f.path, source: 'assets', type: 'folder' }),
    acceptsUpload: f.permissions.create
  }
}
