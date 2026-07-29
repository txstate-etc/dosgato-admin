import { environmentConfig } from '$lib/stores'
import { getSiteIcon, templateRegistry, type LaunchState } from '$lib'
import folderOutline from '@iconify-icons/mdi/folder-outline'
import cube from '@iconify-icons/ph/cube'
import type { Asset, DataChooserItem, Folder, Page } from '@dosgato/dialog'
import type { AssetFolderLink, DataData, DataFolderLink, DataLink } from '@dosgato/templating'
import { DateTime } from 'luxon'
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
  site: { id: string, name: string, launchState: LaunchState }
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

const dataChooserDataDetails = `
id
name
path
data
published
publishedAt
modifiedAt
template { key }
site { id }
`
export interface DataChooserDataDetails {
  id: string
  name: string
  path: string
  data: DataData
  published: boolean
  publishedAt?: string
  modifiedAt: string
  template: { key: string }
  site?: { id: string }
}

const dataChooserFolderDetails = `
id
name
path
template { key }
site { id }
data { id }
`
export interface DataChooserFolderDetails {
  id: string
  name: string
  path: string
  template: { key: string }
  site?: { id: string }
  data: { id: string }[]
}

export const DATA_CHOOSER_ROOTS = `
  query dataChooserRoots ($templateKey: ID!) {
    dataroots (filter: { templateKeys: [$templateKey] }) {
      id
      site { id name }
      datafolders { id }
      data (filter: { root: true }) { id }
    }
  }
`

export interface DataChooserRoot {
  id: string
  site?: { id: string, name: string }
  datafolders: { id: string }[]
  data: { id: string }[]
}

export interface DataChooserRoots {
  dataroots: DataChooserRoot[]
}

export const DATA_CHOOSER_ROOT_CHILDREN = `
  query dataChooserRootChildren ($id: ID!) {
    dataroots (filter: { ids: [$id] }) {
      id
      datafolders {
        ${dataChooserFolderDetails}
      }
      data (filter: { root: true }) {
        ${dataChooserDataDetails}
      }
    }
  }
`

export interface DataChooserRootChildren {
  dataroots: {
    id: string
    datafolders: DataChooserFolderDetails[]
    data: DataChooserDataDetails[]
  }[]
}

export const DATA_CHOOSER_DATA_BY_PATH = `
  query dataChooserDataByPath ($templateKey: ID!, $path: UrlSafePath!) {
    data (filter: { templateKeys: [$templateKey], beneathOrAt: [$path] }) {
      ${dataChooserDataDetails}
    }
  }
`

export interface DataChooserDataByPath {
  data: DataChooserDataDetails[]
}

export const DATA_CHOOSER_DATA_BY_LINK = `
  query dataChooserDataByLink ($link: DataLinkInput!) {
    data (filter: { links: [$link] }) {
      ${dataChooserDataDetails}
    }
  }
`

export interface DataChooserDataByLink {
  data: DataChooserDataDetails[]
}

/** API data paths look like /global/folder/entry or /sitename/folder/entry; the
 * chooser's global source drops the /global prefix while the sites source keeps
 * site names in the path */
function apiDataPathToChooserPath (path: string) {
  if (!path.startsWith('/global/') && path !== '/global') return path
  const stripped = path.substring('/global'.length)
  return stripped === '' ? '/' : stripped
}

export function apiDataToChooserData (d: DataChooserDataDetails): DataChooserItem {
  const templateKey = d.template.key
  const tmpl = templateRegistry.getDataTemplate(templateKey)
  const modifiedAt = DateTime.fromISO(d.modifiedAt)
  const publishedAt = d.publishedAt ? DateTime.fromISO(d.publishedAt) : undefined
  const status = d.published ? (publishedAt! >= modifiedAt ? 'Published' : 'Has Unpublished Changes') : 'Unpublished'
  const link: DataLink = { type: 'data', id: d.id, siteId: d.site?.id, path: d.path, templateKey }
  const icon = tmpl?.nameColumn?.icon?.(d.data) ?? tmpl?.icon ?? cube
  return {
    id: stringify(link),
    name: d.name,
    path: apiDataPathToChooserPath(d.path),
    source: d.site ? 'sites' : 'global',
    templateKey,
    hasChildren: false,
    icon: { icon, label: tmpl?.name },
    details: [
      { label: 'Status', value: status },
      { label: 'Modified', value: modifiedAt.toLocaleString(DateTime.DATETIME_SHORT) }
    ]
  }
}

export function apiDataFolderToChooserFolder (f: DataChooserFolderDetails): DataChooserItem {
  const link: DataFolderLink = { type: 'datafolder', id: f.id, siteId: f.site?.id, path: f.path, templateKey: f.template.key }
  return {
    id: stringify(link),
    name: f.name,
    path: apiDataPathToChooserPath(f.path),
    source: f.site ? 'sites' : 'global',
    hasChildren: f.data.length > 0,
    childCount: f.data.length,
    icon: { icon: folderOutline, label: 'folder' }
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
