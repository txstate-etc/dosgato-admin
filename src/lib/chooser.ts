import type { AnyItem, ChooserType, Client, Folder, Page, Source } from '@dosgato/dialog'
import type { AssetFolderLink, LinkDefinition } from '@dosgato/templating'
import { Cache, isNotBlank, isNotNull, sortby, stringify } from 'txstate-utils'
import { api, environmentConfig, uploadWithProgress } from '$lib'
import { base } from '$app/paths'

const pagetreeInfoCache = new Cache(async (id: string) => {
  return await api.getPagetreeContext(id)
}, { freshseconds: 30, staleseconds: 300 })

export class ChooserClient implements Client {
  constructor (public pagetreeId?: string) {}

  async getSources (type: ChooserType): Promise<Source[]> {
    if (type === 'page') return [{ type: 'page', name: 'pages', label: 'Pages' }]
    return [{ type: 'asset', name: 'assets', label: 'Assets' }]
  }

  async getChildren (source: string, path: string): Promise<AnyItem[]> {
    if (source === 'pages') {
      return await api.chooserSubPagesByPath(path, this.pagetreeId)
    } else {
      const assetsFolders = (await api.chooserSubFoldersAndAssetsByPath(path, this.pagetreeId)).filter(isNotNull)
      return sortby(assetsFolders, 'name')
    }
  }

  async find (source: string, path: string, searchstring: string): Promise<AnyItem[]> {
    throw new Error('Function not implemented.')
  }

  async findById (id: string): Promise<AnyItem | undefined> {
    try {
      let linkStr = id; let hash = ''
      const m = id.match(/(.*)#(\w+)$/)
      if (m) {
        linkStr = m[1]
        hash = m[2]
      }
      const link = JSON.parse(linkStr) as LinkDefinition
      if (link.type === 'asset') {
        return await api.chooserAssetByLink(link, this.pagetreeId)
      } else if (link.type === 'assetfolder') {
        return await api.chooserAssetFolderByLink(link, this.pagetreeId)
      } else if (link.type === 'page') {
        link.hash ??= hash
        return await api.chooserPageByLink(link, this.pagetreeId)
      } else if (link.type === 'url' && link.url?.startsWith('/')) {
        let target: Page | undefined = await api.chooserPageByPath(link.url)
        if (!this.pagetreeId) return target
        const ptInfo = await pagetreeInfoCache.get(this.pagetreeId)
        // do not allow links to another pagetree in the same site as this.pagetreeId
        if (target?.path.startsWith('/' + ptInfo.site.name) && !target.path.startsWith('/' + ptInfo.name + '/')) target = undefined
        // see if an equivalent path exists in this.pagetreeId
        if (!target && link.url.startsWith('/' + ptInfo.site.name) && ptInfo.site.name !== ptInfo.name) target = await api.chooserPageByPath('/' + ptInfo.name + link.url.replace(/\/[^/]+/, ''))
        return target
      }
    } catch {
      return undefined
    }
  }

  urlToValue (url: string) {
    return stringify({ type: 'url', url })
  }

  valueToUrl (value: string) {
    try {
      const parsed = JSON.parse(value) as { type: LinkDefinition['type'], url?: string, path?: string }
      if (isNotBlank(parsed.url)) return parsed.url
      if (isNotBlank(parsed.path)) {
        if (parsed.type === 'asset' || parsed.type === 'assetfolder') return `/.assets${parsed.path}`
        else if (parsed.type === 'data' || parsed.type === 'datafolder') return `/.data${parsed.path}`
        else return parsed.path
      }
      return undefined
    } catch {
      return value
    }
  }

  async findByUrl (url: string) {
    let m = url.match(/^\/\.assets(.*?)\/?/)
    if (m) {
      const path = m[1]
      return await api.chooserAssetByPath(path)
    }
    m = url.match(environmentConfig.assetRegex)
    if (m) {
      const id = m[1]
      return await api.chooserAssetById(id)
    }
    m = url.match(/\/\.(?:edit|preview)\/(?:\w+)\/(?:\w+)\/(\/.*?)(?:\.html)?/)
    if (m) {
      const path = m[1]
      return await api.chooserPageByPath(path)
    }
    if (url.startsWith('/')) {
      return await api.chooserPageByPath(url)
    }
    try {
      const _ = new URL(url)
      return await api.chooserPageByUrl(url)
    } catch (e: any) {
      return undefined
    }
  }

  async upload (folder: Folder, files: File[], progress: (ratio: number) => void) {
    const data = new FormData()
    for (let i = 0; i < files.length; i++) {
      data.append('file' + String(i), files[i])
    }
    await uploadWithProgress(
      `${environmentConfig.apiBase}/assets/${(folder as any).originalId}`,
      { Authorization: `Bearer ${api.token!}` },
      data,
      progress
    )
    return undefined
  }

  async idToEditingUrl (id: string) {
    const link = JSON.parse(id) as LinkDefinition
    if (link.type !== 'asset') return
    const asset = await api.assetByLink(link)
    if (!asset.length) return
    return `${base}/assets/${asset[0].id}`
  }
}
