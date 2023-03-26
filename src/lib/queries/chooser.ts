import { environmentConfig } from '$lib/stores'
import type { Asset, Folder, Page } from '@dosgato/dialog'
import type { AssetFolderLink } from '@dosgato/templating'
import { omit, pick, stringify } from 'txstate-utils'
import type { PagetreeTypes } from './pages_index'

const chooserPageDetails = `
id
linkId
name
path
title
children { id }
site { id name }
`
export interface ChooserPageDetails {
  id: string
  linkId: string
  name: string
  path: string
  title?: string
  children: { id: string }[]
  site: { id: string, name: string }
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

const chooserFolderDetails = `
id
name
path
site { id }
assets { id }
folders { id }
permissions {
  create
}
`
export interface ChooserFolderDetails {
  id: string
  name: string
  path: string
  site: { id: string }
  assets: { id: string }[]
  folders: { id: string }[]
  permissions: {
    create: boolean
  }
}

export const CHOOSER_SUBPAGES_BY_PATH = `
  query chooserSubpagesByPath ($path: UrlSafePath!) {
    pages (filter: { parentPaths: [$path] }) {
      ${chooserPageDetails}
    }
  }
`

export interface ChooserSubPagesByPath {
  pages: ChooserPageDetails[]
}

export const CHOOSER_ROOT_PAGES = `
  query chooserRootPages {
    sites {
      pagetrees {
        type
        name
        rootPage {
          ${chooserPageDetails}
        }
      }
    }
  }
`

export interface ChooserRootPages {
  sites: {
    pagetrees: {
      type: PagetreeTypes
      name: string
      rootPage: ChooserPageDetails
    }[]
  }[]
}

export const CHOOSER_SUBFOLDERS_AND_ASSETS_BY_PATH = `
  query chooserSubfoldersAndAssetsByPath ($path: UrlSafePath!) {
    assets (filter: { parentPaths: [$path] }) {
      ${chooserAssetDetails}
    }
    assetfolders (filter: { parentPaths: [$path] }) {
      ${chooserFolderDetails}
    }
  }
`
export interface GetSubFoldersAndAssetsByPath {
  assets: ChooserAssetDetails[]
  assetfolders: ChooserFolderDetails[]
}

export const CHOOSER_PAGE_BY_LINK = `
  query chooserPageByLink ($pageLink: PageLinkInput!) {
    pages (filter: { links: [$pageLink] }) {
      ${chooserPageDetails}
    }
  }
`

export interface ChooserPageByLink {
  pages: [ChooserPageDetails]
}

export const CHOOSER_PAGE_BY_PATH = `
  query chooserPageByPath ($path: UrlSafePath!) {
    pages (filter: { paths: [$path] }) {
      ${chooserPageDetails}
    }
  }
`

export interface ChooserPageByPath {
  pages: ChooserPageDetails[]
}

export const CHOOSER_PAGE_BY_URL = `
  query chooserPageByUrl ($url: String!) {
    pages (filter: { launchedUrls: [$url] }) {
      ${chooserPageDetails}
    }
  }
`

export const CHOOSER_ASSET_BY_LINK = `
  query chooserAssetByLink ($link: AssetLinkInput!) {
    assets (filter: { links: [$link] }) {
      ${chooserAssetDetails}
    }
  }
`

export interface ChooserAssetByLink {
  assets: [ChooserAssetDetails]
}

export const CHOOSER_ASSET_BY_ID = `
  query chooserAssetByPath ($id: ID!) {
    assets (filter: { ids: [$id] }) {
      ${chooserAssetDetails}
    }
  }
`

export interface ChooserAssetById {
  assets: [ChooserAssetDetails]
}

export const CHOOSER_ASSET_FOLDER_BY_LINK = `
  query chooserAssetByLink ($link: AssetFolderLinkInput!) {
    assetfolders (filter: { links: [$link] }) {
      ${chooserFolderDetails}
    }
  }
`

export interface ChooserAssetFolderByLink {
  assetfolders: [ChooserFolderDetails]
}

export function apiPageToChooserPage (page: undefined): undefined
export function apiPageToChooserPage (page: ChooserPageDetails): Page
export function apiPageToChooserPage (page: ChooserPageDetails | undefined): Page | undefined {
  if (!page) return undefined
  return {
    type: 'page',
    source: 'pages',
    ...pick(page, 'name', 'path', 'title'),
    id: stringify({ type: 'page', source: 'pages', linkId: page.linkId, siteId: page.site.id, path: page.path.replace(/^\/[^/]+/, `/${page.site.name}`) }),
    hasChildren: page.children.length > 0,
    url: page.path
  }
}

export function apiAssetToChooserAsset (asset: ChooserAssetDetails | undefined): Asset | undefined {
  if (!asset) return undefined
  return {
    type: 'asset',
    source: 'assets',
    ...pick(asset, 'name', 'path', 'mime'),
    id: stringify({ id: asset.id, source: 'assets', type: 'asset', checksum: asset.checksum, siteId: asset.site.id, path: asset.path }),
    bytes: asset.size,
    url: `/assets/${asset.id}/${asset.name}.${asset.extension}`,
    image: asset.box
      ? {
          ...asset.box,
          thumbnailUrl: `${environmentConfig.apiBase}/assets/${asset.id}/w/150/${asset.checksum}/${asset.name}.${asset.extension}?admin=1`,
          previewUrl: `${environmentConfig.apiBase}/assets/${asset.id}/w/600/${asset.checksum}/${asset.name}.${asset.extension}?admin=1`
        }
      : undefined
  }
}

export function apiAssetFolderToChooserFolder (f: ChooserFolderDetails): Folder {
  const assetFolderLink: AssetFolderLink = { id: f.id, siteId: f.site.id, path: f.path, source: 'assets', type: 'assetfolder' }
  return {
    type: 'folder' as const,
    source: 'assets',
    ...omit(f, 'permissions', 'id'),
    url: `/assets${f.path}`,
    id: stringify(assetFolderLink),
    acceptsUpload: f.permissions.create,
    hasChildren: (f.assets.length + f.folders.length) > 0,
    childCount: f.assets.length + f.folders.length
  }
}
