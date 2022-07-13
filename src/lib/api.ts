import { base } from '$app/paths'
import type { ComponentData, PageData, PageLink } from '@dosgato/templating'
import type { DateTime } from 'luxon'
import { get, keyby, set, toArray } from 'txstate-utils'
import {
  DISABLE_USERS, ENABLE_USERS, REMOVE_USER_FROM_GROUP, ADD_USER_TO_GROUPS, CREATE_DATA_FOLDER,
  DELETE_DATA_FOLDERS, RENAME_DATA_FOLDER, CREATE_DATA_ITEM, PUBLISH_DATA_ENTRIES, UNPUBLISH_DATA_ENTRIES,
  CREATE_GROUP, UPDATE_GROUP, DELETE_GROUP, GET_DATA_BY_DATAFOLDER_ID, GET_DATA_TEMPLATE_LIST, GET_EDITOR_PAGE,
  GET_GLOBAL_DATAROOT_BY_TEMPLATE_KEY, GET_SITE_DATAROOTS_BY_TEMPLATE_KEY, GET_SITE_DATA_BY_TEMPLATE_KEY,
  GET_GLOBAL_SELF, GET_ROOT_PAGES, GET_TEMPLATE_INFO, GET_AVAILABLE_TEMPLATE_INFO, GET_TREE_PAGES, GET_USER_LIST,
  GET_USER_BY_ID, GET_GLOBAL_DATA_ACCESS_BY_TEMPLATE_KEY, GET_ROLE_LIST, GET_ALL_GROUPS, GET_ROOT_GROUPS,
  GET_SUBGROUPS, GET_GROUP_BY_ID, GET_ROLE_BY_ID, GET_SITE_LIST, GET_SUBPAGES_BY_PATH,
  GET_SUBFOLDERS_AND_ASSETS_BY_PATH, GET_PAGE_BY_LINK, GET_AVAILABLE_COMPONENTS,
  type DataFolder, type GlobalSelf, type PageEditorPage, type TemplateListTemplate, type DataItem, type DataRoot,
  type TreePage, type UserListUser, type FullUser, type GroupListGroup, type FullGroup, type RoleListRole,
  type FullRole, type SiteListSite, type GetAvailableComponents, type GetSubPagesByPath,
  type GetSubFoldersAndAssetsByPath, type GetPageByLink, ADD_ASSET_RULE, ADD_DATA_RULE, REMOVE_RULE, type AssetRule, type CreateAssetRuleInput, type CreateDataRuleInput, type DataRule
} from './queries'
import { templateRegistry } from './registry'
import { environmentConfig } from './stores'

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
    const response = await this.fetch(environmentConfig.apiBase + '/graphql', {
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
        return location.assign(environmentConfig.authRedirect) as any
      }
      throw new Error(`${response.status} ${response.statusText}`)
    }
    const gqlresponse = await response.json()
    if (gqlresponse.errors?.length) throw new Error(JSON.stringify(gqlresponse.errors))
    return gqlresponse.data
  }

  async config () {
    return await (await this.fetch(base + '/config')).json()
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
    const { assets, assetfolders } = await this.query<GetSubFoldersAndAssetsByPath>(GET_SUBFOLDERS_AND_ASSETS_BY_PATH, { path })
    return [...assets.map(a => ({ ...a, type: 'asset' as 'asset', bytes: a.size })), ...assetfolders.map(f => ({ ...f, type: 'folder' as 'folder', acceptsUpload: f.permissions.create, permissions: undefined }))]
  }

  async chooserPageByLink (link: PageLink) {
    const { pages } = await this.query<GetPageByLink>(GET_PAGE_BY_LINK, { linkId: link.linkId, path: link.path })
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

  async getUserById (userId: string) {
    const { users } = await this.query<{ users: FullUser[]}>(GET_USER_BY_ID, { userId })
    return users[0]
  }

  async disableUsers (userIds: string[]) {
    const { disableUsers } = await this.query<{ disableUsers: MutationResponse & { users: UserListUser[] } }>(DISABLE_USERS, { userIds })
    return disableUsers
  }

  async enableUsers (userIds: string[]) {
    const { enableUsers } = await this.query<{ enableUsers: MutationResponse & { users: UserListUser[] } }>(ENABLE_USERS, { userIds })
    return enableUsers
  }

  async addUserToGroups (userId: string, groupIds: string[]) {
    const { addUserToGroups } = await this.query<{ addUserToGroups: MutationResponse }>(ADD_USER_TO_GROUPS, { groupIds, userId })
    return addUserToGroups
  }

  async removeUserFromGroup (userId: string, groupId: string) {
    const { removeUserFromGroups } = await this.query<{ removeUserFromGroups: MutationResponse }>(REMOVE_USER_FROM_GROUP, { groupIds: [groupId], userId })
    return removeUserFromGroups
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

  async getAvailableComponents (templateKey: string, area: string, pageId: string) {
    const { templates } = await this.query<GetAvailableComponents>(GET_AVAILABLE_COMPONENTS, { templateKey, pageId })
    return templates[0]?.areas.find(a => a.name === area)?.availableComponents.filter(ac => ac.permissions.useOnPage).map(ac => ({ name: ac.name, ...templateRegistry.getTemplate(ac.key) })) ?? []
  }

  async getGlobalDataRootByTemplateKey (key: string) {
    const { dataroots } = await this.query<{ dataroots: DataRoot[] }>(GET_GLOBAL_DATAROOT_BY_TEMPLATE_KEY, { key })
    return dataroots[0]
  }

  async getSiteDataRootsByTemplateKey (key: string) {
    const { dataroots } = await this.query<{ dataroots: DataRoot[] }>(GET_SITE_DATAROOTS_BY_TEMPLATE_KEY, { key })
    return dataroots
  }

  async getGlobalDataAccessByTemplateKey (key: string) {
    const { access } = await this.query<{ access: { createGlobalData: boolean} }>(GET_GLOBAL_DATA_ACCESS_BY_TEMPLATE_KEY, { key })
    return access.createGlobalData
  }

  async getDataByFolderId (id: string) {
    const { data } = await this.query<{ data: DataItem[] }>(GET_DATA_BY_DATAFOLDER_ID, { id })
    return data
  }

  async getSiteDataByTemplateKey (siteId: string, key: string) {
    const { dataroots } = await this.query<{ dataroots: DataRoot[] }>(GET_SITE_DATA_BY_TEMPLATE_KEY, { siteId, key })
    return dataroots[0]
  }

  async addDataFolder (name: string, templateKey: string, siteId?: string, validateOnly?: boolean) {
    const { createDataFolder } = await this.query<{ createDataFolder: MutationResponse & { dataFolder: DataFolder } }>(CREATE_DATA_FOLDER, { args: { name, templateKey, siteId }, validateOnly })
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

  async addDataEntry (name: string, templateKey: string, schemaVersion: DateTime, data: any, siteId?: string, folderId?: string) {
    const { createDataEntry } = await this.query<{ createDataEntry: MutationResponse & { data: DataItem }}>(CREATE_DATA_ITEM, { args: { name, templateKey, schemaVersion, data, siteId, folderId } })
    return createDataEntry
  }

  async publishDataEntries (dataIds: string[]) {
    const { publishDataEntries } = await this.query<{ publishDataEntries: MutationResponse }>(PUBLISH_DATA_ENTRIES, { dataIds })
    return publishDataEntries
  }

  async unpublishDataEntries (dataIds: string[]) {
    const { unpublishDataEntries } = await this.query<{ unpublishDataEntries: MutationResponse }>(UNPUBLISH_DATA_ENTRIES, { dataIds })
    return unpublishDataEntries
  }

  async getRoleList () {
    const { roles } = await this.query<{ roles: RoleListRole[] }>(GET_ROLE_LIST)
    return roles
  }

  async getAllGroups () {
    const { groups } = await this.query<{ groups: GroupListGroup[] }>(GET_ALL_GROUPS)
    return groups
  }

  async getRootGroups () {
    const { groups } = await this.query<{ groups: GroupListGroup[] }>(GET_ROOT_GROUPS)
    return groups
  }

  async getSubgroups (groupId: string) {
    const { groups } = await this.query<{ groups: { id: string, subgroups: GroupListGroup[] }[] }>(GET_SUBGROUPS, { ids: toArray(groupId) })
    return groups[0].subgroups
  }

  async getGroupById (groupId: string) {
    const { groups } = await this.query<{ groups: FullGroup[]}>(GET_GROUP_BY_ID, { groupId })
    return groups[0]
  }

  async addGroup (name: string, parentId?: string, validateOnly?: boolean) {
    const { createGroup } = await this.query<{ createGroup: MutationResponse & { group: GroupListGroup } }>(CREATE_GROUP, { name, parentId, validateOnly })
    return createGroup
  }

  async editGroup (groupId: string, name: string, validateOnly?: boolean) {
    const { updateGroup } = await this.query<{ updateGroup: MutationResponse & { group: GroupListGroup } }>(UPDATE_GROUP, { groupId, name, validateOnly })
    return updateGroup
  }

  async deleteGroup (groupId: string) {
    const { deleteGroup } = await this.query<{ deleteGroup: MutationResponse }>(DELETE_GROUP, { groupId })
    return deleteGroup
  }

  async getRoleById (roleId: string) {
    const { roles } = await this.query<{ roles: FullRole[]}>(GET_ROLE_BY_ID, { roleId })
    return roles[0]
  }

  async getSiteList () {
    const { sites } = await this.query<{ sites: SiteListSite[]}>(GET_SITE_LIST)
    return sites
  }

  async addAssetRule (args: CreateAssetRuleInput, validateOnly?: boolean) {
    const { createAssetRule } = await this.query<{ createAssetRule: MutationResponse & { assetRule: AssetRule }}>(ADD_ASSET_RULE, { args, validateOnly })
    return createAssetRule
  }

  async addDataRule (args: CreateDataRuleInput, validateOnly?: boolean) {
    const { createDataRule } = await this.query<{ createDataRule: MutationResponse & { dataRule: DataRule }}>(ADD_DATA_RULE, { args, validateOnly })
    return createDataRule
  }

  async removeRule (ruleId: string, type: 'GLOBAL'|'SITE'|'PAGE'|'TEMPLATE'|'ASSET'|'DATA') {
    const { removeRule } = await this.query<{ removeRule: MutationResponse }>(REMOVE_RULE, { ruleId, type })
    return removeRule
  }

  async createComponent (pageId: string, dataVersion: number, page: PageData, path: string, data: ComponentData, opts?: { validate?: boolean, comment?: string }) {
    const { validate, comment } = opts ?? {}
    const area = get(page, path) ?? []
    const resp = await this.query<{ updatePage: MutationResponse & { data: PageData } }>(`
      mutation updatePage ($pageId: ID!, $dataVersion: Int!, $data: JsonData!, $validate: Boolean, $comment: String) {
        updatePage (pageId: $pageId, dataVersion: $dataVersion, data: $data, validate: $validate, comment: $comment) {
          success
          page {
            id
          }
          messages {
            type
            message
          }
        }
      }
    `, { pageId, data: set(page, path, [...area, data]), dataVersion, validate, comment })
    return resp.updatePage
  }
}

export const api = new API()
