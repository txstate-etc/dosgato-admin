import type { AnyItem, Asset, ChooserType, Client, Folder, Page, Source } from '@dosgato/dialog'
import type { LinkDefinition } from '@dosgato/templating'
import { api } from './api.js'
import type { ChooserPageDetails } from './queries/chooser.js'

function parseLink (link: string) {
  return JSON.parse(link) as LinkDefinition
}

function processPage (p: ChooserPageDetails): Page {
  return { type: 'page', id: p.id, url: p.path, path: p.path, title: p.title ?? p.name, name: p.name }
}

export const chooserClient: Client = {
  getSources: async function (type: ChooserType): Promise<Source[]> {
    if (type === 'page') return [{ type: 'page', name: 'pages', label: 'Pages' }]
    return [{ type: 'asset', name: 'assets', label: 'Assets' }]
  },
  getChildren: async function (source: string, path: string): Promise<AnyItem[]> {
    if (source === 'pages') {
      const pages = await api.getSubPagesByPath(path)
      return pages.map(processPage)
    } else {
      const assetsFolders = await api.getSubFoldersAndAssetsByPath(path)
      return assetsFolders.map<Folder|Asset>(a => ({ ...a, url: a.path }))
    }
  },
  find: async function (source: string, path: string, searchstring: string): Promise<AnyItem[]> {
    throw new Error('Function not implemented.')
  },
  findById: async function (id: string): Promise<AnyItem> {
    const link = parseLink(id)
    if (link.type === 'asset') {
      return {} as any // await api.assetByLink(link)
    } else if (link.type === 'assetfolder') {
      return {} as any // await api.assetFolderByLink(link)
    } else if (link.type === 'page') {
      const page = await api.chooserPageByLink(link)
      return processPage(page)
    }
    throw new Error('Function not implemented.')
  },
  upload: async function (source: string, path: string, files: FileList): Promise<void> {
    throw new Error('Function not implemented.')
  }
}
