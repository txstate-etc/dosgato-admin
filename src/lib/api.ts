import { base } from '$app/paths'
import type { PageLink } from '@dosgato/templating'
import { keyby, toArray } from 'txstate-utils'
import { DISABLE_USERS, ENABLE_USERS, CREATE_DATA_FOLDER, DELETE_DATA_FOLDERS, RENAME_DATA_FOLDER, PUBLISH_DATA_ENTRIES, UNPUBLISH_DATA_ENTRIES, GET_DATAFOLDERS_BY_SITE_ID, GET_DATA_BY_DATAFOLDER_ID, GET_DATA_BY_SITE_ID, GET_DATA_TEMPLATE_LIST, GET_EDITOR_PAGE, GET_GLOBAL_DATAFOLDERS_BY_TEMPLATE_KEY, GET_GLOBAL_DATA_BY_TEMPLATE_KEY, GET_GLOBAL_SELF, GET_ROOT_PAGES, GET_SITES_AND_DATA, GET_TEMPLATE_INFO, GET_AVAILABLE_TEMPLATE_INFO, GET_TREE_PAGES, GET_USER_LIST, GET_GLOBAL_DATA_ACCESS_BY_TEMPLATE_KEY, type DataFolder, type GlobalSelf, type PageEditorPage, type DataSite, type TemplateListTemplate, type DataItem, type TreePage, type UserListUser } from './queries'
import { type GetSubPagesByPath, GET_SUBPAGES_BY_PATH, type GetSubFoldersAndAssetsByPath, GET_SUBFOLDERS_AND_ASSETS_BY_PATH, GET_PAGE_BY_LINK, type GetPageByLink } from './queries/chooser'

export interface MutationResponse {
  success: boolean
  messages: {
    arg: string
    message: string
    type: 'error'|'warning'|'success'
  }[]
}

export class Loader<T> {
  protected ids: Set<string>
  protected resolves: Record<string, ((v: unknown) => void)[]>
  protected rejects: Record<string, ((reason?: any) => void)[]>
  protected timer: any

  constructor (protected batchFn: (ids: string[]) => Promise<T[]>, protected extract: (item: T) => string) {
    this.ids = new Set()
    this.resolves = {}
    this.rejects = {}
  }

  async get (id: string): Promise<T|undefined> {
    return await new Promise((resolve, reject) => {
      this.ids.add(id)
      this.resolves[id] ??= []
      this.resolves[id].push(resolve)
      this.rejects[id] ??= []
      this.rejects[id].push(reject)
      clearTimeout(this.timer)
      this.timer = setTimeout(() => this.run(), 0)
    })
  }

  run () {
    const ids = Array.from(this.ids)
    const resolves = this.resolves
    const rejects = this.rejects
    this.ids = new Set()
    this.resolves = {}
    this.rejects = {}
    this.batchFn(ids)
      .then(results => {
        const resultById = keyby(results, this.extract)
        for (const id of ids) {
          for (const resolve of resolves[id]) resolve(resultById[id])
        }
      })
      .catch(e => {
        for (const id of ids) {
          for (const reject of rejects[id]) reject(e)
        }
      })
  }
}

class API {
  public token?: string
  public fetch: (info: RequestInfo, init?: RequestInit) => Promise<Response>
  protected savedConfig: Record<string, string>
  protected pageChildrenLoader = new Loader(async ids => await this.getSubPagesBatch(ids), page => page.id)

  async query <ReturnType = any> (query: string, variables?: any, querySignature?: string): Promise<ReturnType> {
    const { apiBase, authRedirect } = await this.config()
    const response = await this.fetch(apiBase + '/graphql', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token ?? ''}`,
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query,
        variables,
        extensions: {
          querySignature
        }
      })
    })
    if (!response.ok) {
      if (response.status === 401) {
        return location.assign(authRedirect) as any
      }
      throw new Error(`${response.status} ${response.statusText}`)
    }
    const gqlresponse = await response.json()
    if (gqlresponse.errors?.length) throw new Error(JSON.stringify(gqlresponse.errors))
    return gqlresponse.data
  }

  async config () {
    this.savedConfig ??= await (await this.fetch(base + '/config')).json()
    return this.savedConfig
  }

  async getSelf () {
    try {
      const { users, access } = await this.query<GlobalSelf>(GET_GLOBAL_SELF)
      return { me: users[0], access }
    } catch (e) {
      return {}
    }
  }

  async getRootPages () {
    const { sites } = await this.query<{ sites: { pageroot: TreePage }[] }>(GET_ROOT_PAGES)
    return sites.map(s => s.pageroot)
  }

  async getSubPages (pageId: string) {
    const page = await this.pageChildrenLoader.get(pageId)
    return page?.children ?? []
  }

  protected async getSubPagesBatch (pageId: string|string[]) {
    const { pages } = await this.query<{ pages: { id: string, children: TreePage[] }[] }>(GET_TREE_PAGES, { ids: toArray(pageId) })
    return pages
  }

  async getSubPagesByPath (path: string) {
    const { pages } = await this.query<GetSubPagesByPath>(GET_SUBPAGES_BY_PATH, { path })
    return pages
  }

  async getSubFoldersAndAssetsByPath (path: string) {
    const { assets, folders } = await this.query<GetSubFoldersAndAssetsByPath>(GET_SUBFOLDERS_AND_ASSETS_BY_PATH, { path })
    return [...assets.map(a => ({ ...a, type: 'asset' as 'asset', bytes: a.size })), ...folders.map(f => ({ ...f, type: 'folder' as 'folder', acceptsUpload: f.permissions.create, permissions: undefined }))]
  }

  async chooserPageByLink (link: PageLink) {
    const { pages } = await this.query<GetPageByLink>(GET_PAGE_BY_LINK, { linkId: link.linkId, siteId: link.siteId, path: link.path })
    return pages[0]
  }

  async getEditorPage (pageId: string) {
    const { pages } = await this.query<{ pages: [PageEditorPage|undefined] }>(GET_EDITOR_PAGE, { id: pageId })
    return pages[0]
  }

  async getUserList (enabled?: boolean) {
    const { users } = await this.query<{ users: UserListUser[] }>(GET_USER_LIST, { enabled })
    return users
  }

  async disableUsers (userIds: string[]) {
    const { disableUsers } = await this.query<{ disableUsers: MutationResponse & { users: UserListUser[] } }>(DISABLE_USERS, { userIds })
    return disableUsers
  }

  async enableUsers (userIds: string[]) {
    const { enableUsers } = await this.query<{ enableUsers: MutationResponse & { users: UserListUser[] } }>(ENABLE_USERS, { userIds })
    return enableUsers
  }

  async getDataTemplates () {
    const { templates } = await this.query<{ templates: TemplateListTemplate[] }>(GET_DATA_TEMPLATE_LIST)
    return templates.map((template) => ({ id: template.key, name: template.name, key: template.key }))
  }

  async getTemplateInfo (key: string) {
    const { templates } = await this.query<{ templates: TemplateListTemplate[] }>(GET_TEMPLATE_INFO, { key })
    return templates[0]
  }

  async getAvailableTemplateInfo (keys: string[]) {
    const { templates } = await this.query< { templates: TemplateListTemplate[] }>(GET_AVAILABLE_TEMPLATE_INFO, { keys })
    return templates
  }

  async getGlobalDataFoldersByTemplateKey (key: string) {
    const { datafolders } = await this.query<{ datafolders: DataFolder[] }>(GET_GLOBAL_DATAFOLDERS_BY_TEMPLATE_KEY, { key })
    return datafolders
  }

  async getGlobalDataByTemplateKey (key: string) {
    const { data } = await this.query<{ data: DataItem[] }>(GET_GLOBAL_DATA_BY_TEMPLATE_KEY, { key })
    return data
  }

  async getGlobalDataAccessByTemplateKey (key: string) {
    const { access } = await this.query<{ access: { createGlobalData: boolean} }>(GET_GLOBAL_DATA_ACCESS_BY_TEMPLATE_KEY, { key })
    return access.createGlobalData
  }

  async getSitesAndData (key: string) {
    const { sites } = await this.query<{ sites: DataSite[] }>(GET_SITES_AND_DATA, { key })
    return sites
  }

  async getDataByFolderId (id: string) {
    const { data } = await this.query<{ data: DataItem[] }>(GET_DATA_BY_DATAFOLDER_ID, { id })
    return data
  }

  async getDataFoldersBySiteId (id: string, key: string) {
    const { datafolders } = await this.query<{ datafolders: DataFolder[]}>(GET_DATAFOLDERS_BY_SITE_ID, { id, key })
    return datafolders
  }

  async getDataBySiteId (id: string, key: string) {
    const { data } = await this.query<{ data: DataItem[] }>(GET_DATA_BY_SITE_ID, { id, key })
    return data
  }

  async addDataFolder (name: string, templateKey: string, siteId?: string) {
    const { createDataFolder } = await this.query<{ createDataFolder: MutationResponse & { dataFolder: DataFolder } }>(CREATE_DATA_FOLDER, { args: { name, templateKey, siteId } })
    return createDataFolder
  }

  async deleteDataFolders (folderIds: string[]) {
    const { deleteDataFolders } = await this.query<{ deleteDataFolders: MutationResponse & { dataFolders: DataFolder[] } }>(DELETE_DATA_FOLDERS, { folderIds })
    return deleteDataFolders
  }

  async renameDataFolder (folderId: string, name: string) {
    const { renameDataFolder } = await this.query<{ renameDataFolder: MutationResponse & { dataFolder: DataFolder } }>(RENAME_DATA_FOLDER, { folderId, name })
    return renameDataFolder
  }

  async publishDataEntries (dataIds: string[]) {
    const { publishDataEntries } = await this.query<{publishDataEntries: MutationResponse }>(PUBLISH_DATA_ENTRIES, { dataIds })
    return publishDataEntries
  }

  async unpublishDataEntries (dataIds: string[]) {
    const { unpublishDataEntries } = await this.query<{unpublishDataEntries: MutationResponse }>(UNPUBLISH_DATA_ENTRIES, { dataIds })
    return unpublishDataEntries
  }
}

export const api = new API()
