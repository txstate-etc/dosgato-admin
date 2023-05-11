import type { AnyItem, ChooserType, Client, Folder, Source } from '@dosgato/dialog'
import type { AssetFolderLink, LinkDefinition } from '@dosgato/templating'
import { isNotBlank, sortby, stringify } from 'txstate-utils'
import { api, environmentConfig, uploadWithProgress } from '$lib'

export class ChooserClient implements Client {
  constructor (public pagetreeId?: string) {}

  async getSources (type: ChooserType): Promise<Source[]> {
    if (type === 'page') return [{ type: 'page', name: 'pages', label: 'Pages' }]
    return [{ type: 'asset', name: 'assets', label: 'Assets' }]
  }

  async getChildren (source: string, path: string): Promise<AnyItem[]> {
    if (source === 'pages') {
      return await api.chooserSubPagesByPath(path)
    } else {
      const assetsFolders = await api.chooserSubFoldersAndAssetsByPath(path)
      return sortby(assetsFolders, 'name')
    }
  }

  async find (source: string, path: string, searchstring: string): Promise<AnyItem[]> {
    throw new Error('Function not implemented.')
  }

  async findById (id: string): Promise<AnyItem | undefined> {
    try {
      const link = JSON.parse(id) as LinkDefinition
      if (link.type === 'asset') {
        return await api.chooserAssetByLink(link, this.pagetreeId)
      } else if (link.type === 'assetfolder') {
        return await api.chooserAssetFolderByLink(link, this.pagetreeId)
      } else if (link.type === 'page') {
        return await api.chooserPageByLink(link, this.pagetreeId)
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
    const folderLink = JSON.parse(folder.id) as AssetFolderLink

    const data = new FormData()
    for (let i = 0; i < files.length; i++) {
      data.append('file' + String(i), files[i])
    }

    await uploadWithProgress(
      `${environmentConfig.apiBase}/assets/${folderLink.id}`,
      { Authorization: `Bearer ${api.token!}` },
      data,
      progress
    )
    return undefined
  }
}
