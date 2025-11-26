import { environmentConfig } from '$lib/stores'
import { getSiteIcon } from '$lib'
import type { Asset, Folder, Page } from '@dosgato/dialog'
import type { AssetFolderLink } from '@dosgato/templating'
import { isNotBlank, omit, pick, stringify } from 'txstate-utils'
import type { RootAssetFolder } from './assets_index'
import type { PagetreeTypes, RootTreePage } from './pages_index'

const chooserPageDetails = `
id
linkId
name
path
title
children { id }
site { id name launchState }
pagetree { type }
`
export interface ChooserPageDetails {
  id: string
  linkId: string
  name: string
  path: string
  title?: string
  children: { id: string }[]
  site: { id: string, name: string, launchState: number }
  pagetree: { type: PagetreeTypes }
}

const chooserAssetDetails = `
id
linkId
name
extension
path
size
mime
checksum
site { id }
box { width height }
thumbnail { id extension }
data
`
export interface ChooserAssetDetails {
  id: string
  linkId: string
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
  data?: {
    meta?: Record<string, any>
  }
}

const chooserFolderDetails = `
id
linkId
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
  linkId: string
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

export const CHOOSER_ASSET_BY_PATH = `
  query chooserAssetByPath ($assetPath: FilenameSafePath!, $folderPath: UrlSafePath!) {
    assets (filter: { paths: [$assetPath] }) {
      ${chooserAssetDetails}
    }
    assetfolders (filter: { paths: [$folderPath] }) {
      ${chooserFolderDetails}
    }
  }
`

export interface ChooserAssetByPath {
  assets: [ChooserAssetDetails]
  assetfolders: [ChooserFolderDetails]
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

export function apiPageToChooserPage (page: undefined, hash?: string, query?: string): undefined
export function apiPageToChooserPage (page: ChooserPageDetails | RootTreePage, hash?: string, query?: string): Page
export function apiPageToChooserPage (page: ChooserPageDetails | RootTreePage | undefined, hash?: string, query?: string): Page | undefined {
  if (!page) return undefined
  return {
    type: 'page',
    source: 'pages',
    ...pick(page, 'name', 'path', 'title'),
    id: stringify({ type: 'page', source: 'pages', linkId: page.linkId, siteId: page.site.id, path: page.path.replace(/^\/[^/]+/, `/${page.site.name}`), hash, query }),
    hasChildren: page.children.length > 0,
    url: page.path + (isNotBlank(query) ? '?' + query : '') + (isNotBlank(hash) ? '#' + hash : ''),
    icon: { icon: getSiteIcon(page.site.launchState, page.pagetree.type) }
  }
}

export function apiAssetToChooserAsset (asset: ChooserAssetDetails | undefined): Asset | undefined {
  if (!asset) return undefined
  return {
    type: 'asset',
    source: 'assets',
    ...pick(asset, 'name', 'path', 'mime', 'extension'),
    // assets use linkId in their internal links but we call it `id` for compatibility with other sources that don't have a linkId concept
    id: stringify({ id: asset.linkId, source: 'assets', type: 'asset', checksum: asset.checksum, siteId: asset.site.id, path: asset.path }),
    bytes: asset.size,
    url: `/.assets${asset.path}`,
    image: asset.box
      ? {
          ...asset.box,
          thumbnailUrl: `${environmentConfig.renderBase}/.asset/${asset.id}/w/150/${asset.checksum.substring(0, 12)}/${asset.name}.${asset.extension}`,
          previewUrl: `${environmentConfig.renderBase}/.asset/${asset.id}/w/700/${asset.checksum.substring(0, 12)}/${asset.name}.${asset.extension}`,
          altText: asset.data?.meta?.altText || undefined
        }
      : undefined
  }
}

export function apiAssetFolderToChooserFolder (f: ChooserFolderDetails | RootAssetFolder): (Folder & { originalId: string }) | undefined {
  if (!f) return
  const assetFolderLink: AssetFolderLink = { id: f.linkId, siteId: f.site.id, path: f.path, source: 'assets', type: 'assetfolder' }
  return {
    type: 'folder' as const,
    source: 'assets',
    ...omit(f, 'permissions', 'id'),
    url: `/.assets${f.path}`,
    id: stringify(assetFolderLink),
    acceptsUpload: f.permissions.create,
    hasChildren: (f.assets.length + f.folders.length) > 0,
    childCount: f.assets.length + f.folders.length,
    originalId: f.id
  }
}
