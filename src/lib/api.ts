import { base } from '$app/paths'
import type { AssetLink, ComponentData, PageData, PageLink } from '@dosgato/templating'
import { get, keyby, set, splice, toArray } from 'txstate-utils'
import {
  DISABLE_USERS, ENABLE_USERS, UPDATE_USER, REMOVE_USER_FROM_GROUP, ADD_USER_TO_GROUPS, CREATE_DATA_FOLDER,
  DELETE_DATA_FOLDERS, RENAME_DATA_FOLDER, CREATE_DATA_ITEM, PUBLISH_DATA_ENTRIES, UNPUBLISH_DATA_ENTRIES,
  CREATE_GROUP, UPDATE_GROUP, DELETE_GROUP, GET_DATA_BY_DATAFOLDER_ID, GET_EDITOR_PAGE,
  GET_GLOBAL_DATAROOT_BY_TEMPLATE_KEY, GET_SITE_DATAROOTS_BY_TEMPLATE_KEY, GET_SITE_DATA_BY_TEMPLATE_KEY,
  GET_GLOBAL_SELF, GET_ROOT_PAGES, GET_TEMPLATE_INFO, GET_AVAILABLE_TEMPLATE_INFO, GET_TREE_PAGES, GET_USER_LIST,
  GET_USER_BY_ID, GET_GLOBAL_DATA_ACCESS_BY_TEMPLATE_KEY, GET_ROLE_LIST, GET_ALL_GROUPS, GET_ROOT_GROUPS,
  GET_SUBGROUPS, GET_GROUP_BY_ID, GET_ROLE_BY_ID, GET_SITE_LIST, GET_SUBPAGES_BY_PATH,
  GET_SUBFOLDERS_AND_ASSETS_BY_PATH, GET_PAGE_BY_LINK, GET_AVAILABLE_COMPONENTS, GET_TEMPLATES_BY_TYPE, RENAME_SITE,
  GET_SITE_BY_ID, GET_ORGANIZATION_LIST, UPDATE_SITE_MANAGEMENT, SET_LAUNCH_URL, ADD_SITE_COMMENT, ADD_PAGETREE,
  type DataFolder, type GlobalSelf, type PageEditorPage, type TemplateListTemplate, type DataItem, type DataRoot,
  type TreePage, type UserListUser, type FullUser, type GroupListGroup, type FullGroup, type RoleListRole,
  type FullRole, type SiteListSite, type GetAvailableComponents, type GetSubPagesByPath,
  type GetSubFoldersAndAssetsByPath, type GetPageByLink, ADD_ASSET_RULE, ADD_DATA_RULE, REMOVE_RULE, type AssetRule,
  type CreateAssetRuleInput, type CreateDataRuleInput, type DataRule, type UpdatePageResponse, UPDATE_PAGE, type FullSite,
  type Organization, type SiteComment, type SitePagetree, type TreeAssetFolder, type TreeAsset, type UserFilter,
  GET_ASSETFOLDER_CHILDREN, GET_ASSET_ROOTS, UPDATE_PAGETREE, DELETE_PAGETREE, PROMOTE_PAGETREE, ARCHIVE_PAGETREE,
  AUTHORIZE_TEMPLATE_SITE, AUTHORIZE_TEMPLATE_PAGETREES, GET_ALL_TEMPLATES, SET_TEMPLATE_UNIVERSAL,
  type GetAssetByLink, GET_ASSET_BY_LINK, apiAssetToChooserAsset, apiAssetFolderToChooserFolder, DEAUTHORIZE_TEMPLATE, ADD_SITE
} from './queries'
import { handleUnauthorized } from '../local/index.js'
import { templateRegistry } from './registry'
import { environmentConfig } from './stores'

export interface MutationResponse {
  success: boolean
  messages: {
    arg: string
    message: string
    type: 'error' | 'warning' | 'success'
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

  async get (id: string): Promise<T | undefined> {
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
  protected assetFolderChildrenLoader = new Loader(async ids => await this.getSubFoldersAndAssetsBatch(ids), folder => folder.id)
  protected ready!: () => void
  protected readyPromise: Promise<void>

  constructor () {
    this.readyPromise = new Promise(resolve => {
      this.ready = resolve
    })
  }

  async init (token: string | undefined) {
    this.token = token
    if (this.token) {
      sessionStorage.setItem('token', this.token)
    } else {
      this.token = sessionStorage.getItem('token') ?? undefined
    }
    Object.assign(environmentConfig, await this.config())
    this.ready()
  }

  async query <ReturnType = any> (query: string, variables?: any, querySignature?: string): Promise<ReturnType> {
    await this.readyPromise
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
      if (response.status === 401) handleUnauthorized(environmentConfig, response)
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

  protected async getSubPagesBatch (pageId: string | string[]) {
    const { pages } = await this.query<{ pages: { id: string, children: TreePage[] }[] }>(GET_TREE_PAGES, { ids: toArray(pageId) })
    return pages
  }

  async getSubPagesByPath (path: string) {
    const { pages } = await this.query<GetSubPagesByPath>(GET_SUBPAGES_BY_PATH, { path })
    return pages
  }

  async chooserPageByLink (link: PageLink) {
    const { pages } = await this.query<GetPageByLink>(GET_PAGE_BY_LINK, { linkId: link.linkId, path: link.path })
    return pages[0]
  }

  async chooserSubFoldersAndAssetsByPath (path: string) {
    const { assets, assetfolders } = await this.query<GetSubFoldersAndAssetsByPath>(GET_SUBFOLDERS_AND_ASSETS_BY_PATH, { path })
    return [...assets.map(a => apiAssetToChooserAsset(a)!), ...assetfolders.map(f => apiAssetFolderToChooserFolder(f))]
  }

  async chooserAssetByLink (link: AssetLink) {
    const { assets } = await this.query<GetAssetByLink>(GET_ASSET_BY_LINK, { link })
    return apiAssetToChooserAsset(assets[0])
  }

  async getSubFoldersAndAssets (folderId: string) {
    return await this.assetFolderChildrenLoader.get(folderId)
  }

  protected async getSubFoldersAndAssetsBatch (folderIds: string | string[]) {
    const { assetfolders } = await this.query<{ assetfolders: { id: string, folders: TreeAssetFolder[], assets: TreeAsset[] }[]}>(GET_ASSETFOLDER_CHILDREN, { ids: toArray(folderIds) })
    return assetfolders
  }

  async getRootAssetFolders () {
    const { sites } = await this.query<{ sites: { assetroot: TreeAssetFolder }[] }>(GET_ASSET_ROOTS)
    return sites.map(s => s.assetroot)
  }

  async getEditorPage (pageId: string) {
    const { pages } = await this.query<{ pages: [PageEditorPage | undefined] }>(GET_EDITOR_PAGE, { id: pageId })
    return pages[0]
  }

  async getUserList (filter: UserFilter) {
    const { users } = await this.query<{ users: UserListUser[] }>(GET_USER_LIST, { filter })
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

  async updateUserInfo (userId: string, args: any, validateOnly?: boolean) {
    const { updateUser } = await this.query<{ updateUser: MutationResponse & { user: UserListUser } }>(UPDATE_USER, { userId, args, validateOnly })
    return updateUser
  }

  async addUserToGroups (userId: string, groupIds: string[]) {
    const { addUserToGroups } = await this.query<{ addUserToGroups: MutationResponse }>(ADD_USER_TO_GROUPS, { groupIds, userId })
    return addUserToGroups
  }

  async removeUserFromGroup (userId: string, groupId: string) {
    const { removeUserFromGroups } = await this.query<{ removeUserFromGroups: MutationResponse }>(REMOVE_USER_FROM_GROUP, { groupIds: [groupId], userId })
    return removeUserFromGroups
  }

  async getAllTemplates () {
    const { templates } = await this.query<{ templates: TemplateListTemplate[] }>(GET_ALL_TEMPLATES)
    return templates
  }

  async getTemplatesByType (type: string, universal?: boolean) {
    const { templates } = await this.query<{ templates: TemplateListTemplate[] }>(GET_TEMPLATES_BY_TYPE, { type, universal })
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

  async authorizeTemplateForSite (templateKey: string, siteId: string) {
    const { authorizeTemplateForSite } = await this.query<{ authorizeTemplateForSite: MutationResponse }>(AUTHORIZE_TEMPLATE_SITE, { templateKey, siteId })
    return authorizeTemplateForSite
  }

  async authorizeTemplateForPagetrees (templateKey: string, pagetreeIds: string[]) {
    const { authorizeTemplateForPagetrees } = await this.query<{ authorizeTemplateForPagetrees: MutationResponse }>(AUTHORIZE_TEMPLATE_PAGETREES, { templateKey, pagetreeIds })
    return authorizeTemplateForPagetrees
  }

  async deauthorizeTemplate (templateKey: string, siteId: string) {
    const { deauthorizeTemplate } = await this.query<{ deauthorizeTemplate: MutationResponse }>(DEAUTHORIZE_TEMPLATE, { templateKey, siteId })
    return deauthorizeTemplate
  }

  async setTemplateUniversal (templateKey: string, universal: boolean) {
    const { setTemplateUniversal } = await this.query<{ setTemplateUniversal: MutationResponse}>(SET_TEMPLATE_UNIVERSAL, { templateKey, universal })
    return setTemplateUniversal
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

  async addDataEntry (name: string, data: any, siteId?: string, folderId?: string) {
    const { createDataEntry } = await this.query<{ createDataEntry: MutationResponse & { data: DataItem }}>(CREATE_DATA_ITEM, { args: { name, data, siteId, folderId } })
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

  async getSiteById (siteId: string) {
    const { sites } = await this.query<{ sites: FullSite[]}>(GET_SITE_BY_ID, { siteId })
    return sites[0]
  }

  async addSite (name: string, data: PageData, validateOnly?: boolean) {
    const { createSite } = await this.query<{ createSite: MutationResponse & {site: SiteListSite } }>(ADD_SITE, { name, data, validateOnly })
    return createSite
  }

  async renameSite (siteId: string, name: string, validateOnly?: boolean) {
    const { renameSite } = await this.query<{ renameSite: MutationResponse & { site: FullSite } }>(RENAME_SITE, { siteId, name, validateOnly })
    return renameSite
  }

  async updateSiteManagement (siteId: string, organizationId?: string, ownerId?: string, managerIds?: string[], validateOnly?: boolean) {
    const { updateSiteManagement } = await this.query<{ updateSiteManagement: MutationResponse & { site: FullSite } }>(UPDATE_SITE_MANAGEMENT, { siteId, args: { organizationId, ownerId, managerIds }, validateOnly })
    return updateSiteManagement
  }

  async addSiteComment (siteId: string, comment: string) {
    const { createSiteComment } = await this.query<{ createSiteComment: MutationResponse & { comment: SiteComment } }>(ADD_SITE_COMMENT, { siteId, comment })
    return createSiteComment
  }

  async addPagetree (siteId: string, name: string, data: PageData, validateOnly?: boolean) {
    const { createPagetree } = await this.query<{ createPagetree: MutationResponse & { pagetree: SitePagetree }}>(ADD_PAGETREE, { siteId, name, data, validateOnly })
    return createPagetree
  }

  async updatePagetree (pagetreeId: string, name: string, validateOnly?: boolean) {
    const { updatePagetree } = await this.query<{ updatePagetree: MutationResponse & { pagetree: SitePagetree }}>(UPDATE_PAGETREE, { pagetreeId, name, validateOnly })
    return updatePagetree
  }

  async deletePagetree (pagetreeId: string) {
    const { deletePagetree } = await this.query<{ deletePagetree: MutationResponse & { pagetree: SitePagetree }}>(DELETE_PAGETREE, { pagetreeId })
    return deletePagetree
  }

  async promotePagetree (pagetreeId: string) {
    const { promotePagetree } = await this.query<{ promotePagetree: MutationResponse & { pagetree: SitePagetree }}>(PROMOTE_PAGETREE, { pagetreeId })
    return promotePagetree
  }

  async archivePagetree (pagetreeId: string) {
    const { archivePagetree } = await this.query<{ archivePagetree: MutationResponse & { pagetree: SitePagetree }}>(ARCHIVE_PAGETREE, { pagetreeId })
    return archivePagetree
  }

  async setLaunchURL (siteId: string, host?: string, path?: string, enabled?: boolean, validateOnly?: boolean) {
    const { setLaunchURL } = await this.query<{ setLaunchURL: MutationResponse & {site: FullSite } }>(SET_LAUNCH_URL, { siteId, host, path, enabled, validateOnly })
    return setLaunchURL
  }

  async addAssetRule (args: CreateAssetRuleInput, validateOnly?: boolean) {
    const { createAssetRule } = await this.query<{ createAssetRule: MutationResponse & { assetRule: AssetRule }}>(ADD_ASSET_RULE, { args, validateOnly })
    return createAssetRule
  }

  async addDataRule (args: CreateDataRuleInput, validateOnly?: boolean) {
    const { createDataRule } = await this.query<{ createDataRule: MutationResponse & { dataRule: DataRule }}>(ADD_DATA_RULE, { args, validateOnly })
    return createDataRule
  }

  async removeRule (ruleId: string, type: 'GLOBAL' | 'SITE' | 'PAGE' | 'TEMPLATE' | 'ASSET' | 'DATA') {
    const { removeRule } = await this.query<{ removeRule: MutationResponse }>(REMOVE_RULE, { ruleId, type })
    return removeRule
  }

  async getOrganizationList () {
    const { organizations } = await this.query<{ organizations: Organization[]}>(GET_ORGANIZATION_LIST)
    return organizations
  }

  async createComponent (pageId: string, dataVersion: number, page: PageData, path: string, data: ComponentData, opts?: { validate?: boolean, comment?: string }) {
    const { validate, comment } = opts ?? {}
    const area = get<any[]>(page, path) ?? []
    const { updatePage } = await this.query<UpdatePageResponse>(UPDATE_PAGE, { pageId, data: set(page, path, [...area, data]), dataVersion, validate, comment })
    const msgPrefix = `data.${path}.${area.length}`
    return {
      ...updatePage,
      messages: updatePage.messages.map(m => ({ type: m.type, message: m.message, path: m.arg.startsWith(msgPrefix) ? m.arg.substring(msgPrefix.length) : '' })),
      data: get(updatePage.page.data, path).slice(-1)[0]
    }
  }

  async editComponent (pageId: string, dataVersion: number, page: PageData, path: string, data: ComponentData, opts?: { validate?: boolean, comment?: string }) {
    const { validate, comment } = opts ?? {}
    const { updatePage } = await this.query<UpdatePageResponse>(UPDATE_PAGE, { pageId, data: set(page, path, data), dataVersion, validate, comment })
    const msgPrefix = `data.${path}`
    return {
      ...updatePage,
      messages: updatePage.messages.map(m => ({ type: m.type, message: m.message, path: m.arg.startsWith(msgPrefix) ? m.arg.substring(msgPrefix.length) : '' })),
      data: get(updatePage.page.data, path)
    }
  }

  async removeComponent (pageId: string, dataVersion: number, page: PageData, path: string, opts?: { comment?: string }) {
    const { comment } = opts ?? {}
    const m = path.match(/^(.*)\.(\d+)$/)
    if (!m) return { success: false, page: undefined }
    const [_, areaPath, index] = m
    const components = get(page, areaPath) ?? []
    const { updatePage } = await this.query<UpdatePageResponse>(UPDATE_PAGE, { pageId, data: set(page, areaPath, splice(components, Number(index), 1)), dataVersion, comment })
    return {
      ...updatePage,
      messages: [],
      data: get(updatePage.page.data, path)
    }
  }
}

export const api = new API()
