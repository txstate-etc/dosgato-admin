import applicationOutline from '@iconify-icons/mdi/application-outline'
import type { DataChooserClient as DataChooserClientInterface, DataChooserItem, DataChooserSource } from '@dosgato/dialog'
import type { DataFolderLink, DataLink } from '@dosgato/templating'
import { Cache, isNotBlank } from 'txstate-utils'
import { api } from '$lib'

const datarootsCache = new Cache(
  async (templateKey: string) => await api.dataChooserRoots(templateKey),
  { freshseconds: 30, staleseconds: 300 }
)

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
}
