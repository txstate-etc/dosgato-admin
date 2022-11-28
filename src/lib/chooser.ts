import type { AnyItem, Asset, ChooserType, Client, Folder, Page, Source } from '@dosgato/dialog'
import type { LinkDefinition } from '@dosgato/templating'
import { sortby } from 'txstate-utils'
import { api } from './api.js'
import type { ChooserPageDetails } from './queries/chooser.js'

function parseLink (link: string) {
  return JSON.parse(link) as LinkDefinition
}

function processPage (p: ChooserPageDetails): Page {
  return { type: 'page', source: 'pages', id: p.id, url: p.path, path: p.path, title: p.title ?? p.name, name: p.name, hasChildren: p.children.length > 0 }
}

export class ChooserClient implements Client {
  constructor (public pagetreeId?: string) {}

  async getSources (type: ChooserType): Promise<Source[]> {
    if (type === 'page') return [{ type: 'page', name: 'pages', label: 'Pages' }]
    return [{ type: 'asset', name: 'assets', label: 'Assets' }]
  }

  async getChildren (source: string, path: string): Promise<AnyItem[]> {
    if (source === 'pages') {
      const pages = path === '/' ? await api.getRootPages() : await api.getSubPagesByPath(path)
      return pages.map(processPage)
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
      return {} as any // await api.assetFolderByLink(link)
    } else if (link.type === 'page') {
      const page = await api.chooserPageByLink(link, this.pagetreeId)
      return processPage(page)
    }
  }

  async upload (source: string, path: string, files: FileList): Promise<void> {
    throw new Error('Function not implemented.')
  }
}
