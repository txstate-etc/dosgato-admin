import type { AnyItem, Asset, ChooserType, Client, Folder, Source } from '@dosgato/dialog'
import type { LinkDefinition } from '@dosgato/templating'
import { sortby, stringify } from 'txstate-utils'
import { api } from './api.js'

function parseLink (link: string) {
  return JSON.parse(link) as LinkDefinition
}

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
      return sortby(assetsFolders.map<Folder | Asset>(a => ({ ...a, url: a.path })), 'name')
    }
  }

  async find (source: string, path: string, searchstring: string): Promise<AnyItem[]> {
    throw new Error('Function not implemented.')
  }

  async findById (id: string): Promise<AnyItem | undefined> {
    const link = parseLink(id)
    if (link.type === 'asset') {
      return await api.chooserAssetByLink(link)
    } else if (link.type === 'assetfolder') {
      return await api.chooserAssetFolderByLink(link)
    } else if (link.type === 'page') {
      return await api.chooserPageByLink(link, this.pagetreeId)
    }
  }

  urlToValue (url: string) {
    return stringify({ type: 'url', url })
  }

  async findByUrl (url: string) {
    if (url.startsWith('/assets/')) {
      return await api.chooserAssetByPath(url)
    } else if (url.startsWith('/')) {
      const page = await api.chooserPageByPath(url)
      console.log(page)
      return page
    }
  }

  async upload (source: string, path: string, files: FileList): Promise<void> {
    throw new Error('Function not implemented.')
  }
}
