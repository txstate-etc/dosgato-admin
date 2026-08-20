import applicationOutline from '@iconify-icons/mdi/application-outline'
import { encodePreviewImage, encodePreviewLink, type DataChooserClient as DataChooserClientInterface, type DataChooserItem, type DataChooserSource } from '@dosgato/dialog'
import type { AssetLink, DataFolderLink, DataLink, LinkDefinition, PageLink } from '@dosgato/templating'
import { resolve } from '$app/paths'
import { Cache, isNotBlank, omit, rescue } from 'txstate-utils'
import { api } from '$lib'
import { environmentConfig } from '$lib/stores'

const datarootsCache = new Cache(
  async (templateKey: string) => await api.dataChooserRoots(templateKey),
  { freshseconds: 30, staleseconds: 300 }
)

// preview payloads often repeat a link (and sibling items often share targets),
// so link resolution is cached briefly; Cache stringifies object keys stably,
// and caching the rescued undefined keeps broken links from re-querying
const pageLinkCache = new Cache(
  async (link: PageLink) => await rescue(api.chooserPageByLink(link)),
  { freshseconds: 30, staleseconds: 300 }
)

const assetLinkCache = new Cache(
  async (link: AssetLink) => (await rescue(api.assetByLink(link)))?.[0],
  { freshseconds: 30, staleseconds: 300 }
)

function isLinkDefinition (obj: any): obj is LinkDefinition {
  if (obj == null || typeof obj !== 'object' || typeof obj.type !== 'string') return false
  if (obj.type === 'url') return typeof obj.url === 'string'
  if (obj.type === 'page') return typeof obj.linkId === 'string'
  return ['asset', 'assetfolder', 'data', 'datafolder'].includes(obj.type) && typeof obj.id === 'string'
}

function parseLinkString (value: string): LinkDefinition | undefined {
  if (!value.startsWith('{')) return undefined
  try {
    const parsed = JSON.parse(value)
    return isLinkDefinition(parsed) ? parsed : undefined
  } catch {
    return undefined
  }
}

async function resolveLinkForPreview (link: LinkDefinition): Promise<string> {
  if (link.type === 'url') return encodePreviewLink(link.url)
  if (link.type === 'page') {
    const page = await pageLinkCache.get(link)
    if (!page) return link.path
    const previewUrl = `${environmentConfig.renderBase}/.preview/latest${page.path}.html` + (isNotBlank(link.query) ? '?' + link.query : '') + (isNotBlank(link.hash) ? '#' + link.hash : '')
    return encodePreviewLink(resolve(`/preview?url=${encodeURIComponent(previewUrl)}`), page.title ?? page.name)
  }
  if (link.type === 'asset') {
    const asset = await assetLinkCache.get(link)
    if (!asset) return link.path ?? 'broken asset link'
    const filename = `${asset.name}.${asset.extension}`
    if (asset.box) return encodePreviewImage(`${environmentConfig.renderBase}/.asset/${asset.id}/w/150/${asset.checksum.substring(0, 12)}/${filename}`, asset.data?.meta?.altText || filename)
    return encodePreviewLink(`${environmentConfig.renderBase}/.asset/${asset.id}/${filename}`, filename)
  }
  // data, datafolder, and assetfolder links have no URL to open; show the target's path
  return link.path
}

/**
 * the preview pane renders strings, so any link stored in the data - either as a
 * stringified LinkDefinition (how chooser fields save their values) or as a raw
 * link object - gets resolved to a URL and encoded for display
 */
async function convertLinksForPreview (value: any): Promise<any> {
  if (typeof value === 'string') {
    const link = parseLinkString(value)
    return link ? await resolveLinkForPreview(link) : value
  }
  if (Array.isArray(value)) return await Promise.all(value.map(convertLinksForPreview))
  if (value != null && typeof value === 'object' && !(value instanceof Date)) {
    if (isLinkDefinition(value)) return await resolveLinkForPreview(value)
    return Object.fromEntries(await Promise.all(Object.entries(value).map(async ([k, v]) => [k, await convertLinksForPreview(v)])))
  }
  return value
}

export class DataChooserClient implements DataChooserClientInterface {
  async getSources (rootTemplateKey: string): Promise<DataChooserSource[]> {
    const dataroots = await datarootsCache.get(rootTemplateKey)
    const sources: DataChooserSource[] = []
    if (dataroots.some(dr => !dr.site)) sources.push({ name: 'global', label: 'Global Data' })
    if (dataroots.some(dr => dr.site)) sources.push({ name: 'sites', label: 'Sites' })
    return sources
  }

  async getChildren (rootTemplateKey: string, source: string, path: string): Promise<DataChooserItem[]> {
    const dataroots = await datarootsCache.get(rootTemplateKey)
    if (path === '/') {
      if (source === 'global') {
        const root = dataroots.find(dr => !dr.site)
        return root ? await api.dataChooserRootChildren(root.id) : []
      }
      return dataroots.filter(dr => dr.site).map(dr => ({
        // site containers may not be chosen (no templateKey), so this id is only
        // used for uniqueness within the tree
        id: dr.id,
        name: dr.site!.name,
        path: '/' + dr.site!.name,
        source,
        hasChildren: dr.datafolders.length + dr.data.length > 0,
        childCount: dr.datafolders.length + dr.data.length,
        icon: { icon: applicationOutline, label: 'site' }
      }))
    }
    const segments = path.split('/').filter(isNotBlank)
    if (source === 'sites' && segments.length === 1) {
      const root = dataroots.find(dr => dr.site?.name === segments[0])
      return root ? await api.dataChooserRootChildren(root.id) : []
    }
    const apiPath = source === 'global' ? '/global' + path : path
    return await api.dataChooserDataByPath(rootTemplateKey, apiPath)
  }

  async findById (rootTemplateKey: string, id: string): Promise<DataChooserItem | undefined> {
    try {
      const link = JSON.parse(id) as DataLink | DataFolderLink
      if (link.type === 'data') return await api.dataChooserDataByLink(link)
      if (link.type === 'datafolder') return await api.dataChooserFolderByLink(link)
      return undefined
    } catch {
      return undefined
    }
  }

  async getPreviewData (rootTemplateKey: string, item: DataChooserItem) {
    try {
      const link = JSON.parse(item.id) as DataLink | DataFolderLink
      if (link.type !== 'data') return undefined
      const data = await api.dataChooserPreviewData(link)
      if (!data) return undefined
      // templateKey and savedAtVersion are internal bookkeeping, not content
      return await convertLinksForPreview(omit(data, 'templateKey', 'savedAtVersion'))
    } catch {
      return undefined
    }
  }
}
