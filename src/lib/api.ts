import { base } from '$app/paths'
import type { AssetLink, ComponentData, PageData, PageLink } from '@dosgato/templating'
import { error } from '@sveltejs/kit'
import { MessageType } from '@txstate-mws/svelte-forms'
import { get, isBlank, keyby, set, splice, toArray } from 'txstate-utils'
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
  type CreateAssetRuleInput, type CreateDataRuleInput, type DataRule, type UpdatePageResponse, CREATE_PAGE, UPDATE_PAGE, type FullSite,
  type Organization, type SiteComment, type SitePagetree, type TreeAssetFolder, type TreeAsset, type UserFilter,
  GET_ASSETFOLDER_CHILDREN, GET_ASSET_ROOTS, UPDATE_PAGETREE, DELETE_PAGETREE, PROMOTE_PAGETREE, ARCHIVE_PAGETREE,
  AUTHORIZE_TEMPLATE_SITE, AUTHORIZE_TEMPLATE_PAGETREES, GET_ALL_TEMPLATES, SET_TEMPLATE_UNIVERSAL,
  type GetAssetByLink, GET_ASSET_BY_LINK, apiAssetToChooserAsset, apiAssetFolderToChooserFolder, DEAUTHORIZE_TEMPLATE, ADD_SITE,
  UPDATE_ASSET_RULE, CREATE_USER, type CreateUserInput, ADD_ROLES_TO_USER, REMOVE_ROLE_FROM_USER, type UpdateAssetRuleInput,
  type UpdateDataRuleInput, UPDATE_DATA_RULE, type MessageFromAPI, UPDATE_ROLE, type CreateGlobalRuleInput, type UpdateGlobalRuleInput,
  type GlobalRule, ADD_GLOBAL_RULE, UPDATE_GLOBAL_RULE, type PageRule, type CreatePageRuleInput, type UpdatePageRuleInput,
  ADD_PAGE_RULE, UPDATE_PAGE_RULE, type SiteRule, type CreateSiteRuleInput, type UpdateSiteRuleInput, ADD_SITE_RULE, UPDATE_SITE_RULE,
  type CreateTemplateRuleInput, type UpdateTemplateRuleInput, type TemplateRule, ADD_TEMPLATE_RULE, UPDATE_TEMPLATE_RULE,
  GET_TEMPLATES_BY_PAGE, type PageWithTemplates, DELETE_SITE, UNDELETE_SITE, type CreateAssetFolderInput, CREATE_ASSET_FOLDER
} from './queries'
import { handleUnauthorized } from '../local/index.js'
import { templateRegistry } from './registry'
import { environmentConfig } from './stores'
import { DateTime } from 'luxon'

export interface MutationResponse {
  success: boolean
  messages: MessageFromAPI[]
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

function validateRequired <T = {}> (data: any, requiredFields: string[]) {
  const messages: MutationResponse['messages'] = []
  for (const field of requiredFields) {
    if (isBlank(data[field])) {
      messages.push({ type: MessageType.ERROR, message: 'This field is required.', arg: field })
    }
  }
  return (messages.length ? { success: false, messages } : undefined) as (MutationResponse & T) | undefined
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
      if (response.status === 401) return handleUnauthorized(environmentConfig, response) as any
      else throw error(response.status, response.statusText)
    }
    const gqlresponse = await response.json()
    if (gqlresponse.errors?.length) throw new Error(JSON.stringify(gqlresponse.errors))
    return gqlresponse.data
  }

  async config () {
    return await (await this.fetch(base + '/config')).json()
  }

  async getSelf () {
    const { users, access } = await this.query<GlobalSelf>(GET_GLOBAL_SELF)
    return { me: users[0], access }
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

  async createAssetFolder (args: CreateAssetFolderInput, validateOnly?: boolean) {
    const resp = validateRequired<{ assetFolder: undefined }>(args, ['name', 'parentId'])
    if (resp) return resp
    const { createAssetFolder } = await this.query<{ createAssetFolder: MutationResponse }>(CREATE_ASSET_FOLDER, { args, validateOnly })
    return createAssetFolder
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

  async createUser (args: CreateUserInput) {
    const resp = validateRequired<{ user: undefined }>(args, ['userId', 'name', 'email'])
    if (resp) return resp
    const { createUser } = await this.query<{ createUser: MutationResponse & { user: UserListUser } }>(CREATE_USER, args)
    return createUser
  }

  async updateUserInfo (userId: string, args: any, validateOnly?: boolean) {
    const { updateUser } = await this.query<{ updateUser: MutationResponse & { user: UserListUser } }>(UPDATE_USER, { userId, args, validateOnly })
    return updateUser
  }

  async addRolesToUser (roleIds: string[], userId: string) {
    const { addRolesToUser } = await this.query<{ addRolesToUser: MutationResponse }>(ADD_ROLES_TO_USER, { roleIds, userId })
    return addRolesToUser
  }

  async removeRoleFromUser (roleId: string, userId: string) {
    const { removeRoleFromUser } = await this.query<{ removeRoleFromUser: MutationResponse }>(REMOVE_ROLE_FROM_USER, { roleId, userId })
    return removeRoleFromUser
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

  async getTemplatesByPage (pageId: string) {
    const { pages } = await this.query<{ pages: PageWithTemplates[] }>(GET_TEMPLATES_BY_PAGE, { pageId })
    return pages[0].templates.map(template => ({ value: template.key, label: template.name }))
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
    const resp = validateRequired<{ dataFolder: undefined }>({ name }, ['name'])
    if (resp) return resp
    const { createDataFolder } = await this.query<{ createDataFolder: MutationResponse & { dataFolder: DataFolder } }>(CREATE_DATA_FOLDER, { args: { name, templateKey, siteId }, validateOnly })
    return createDataFolder
  }

  async deleteDataFolders (folderIds: string[]) {
    const { deleteDataFolders } = await this.query<{ deleteDataFolders: MutationResponse & { dataFolders: DataFolder[] } }>(DELETE_DATA_FOLDERS, { folderIds })
    return deleteDataFolders
  }

  async renameDataFolder (folderId: string, name: string, validateOnly?: boolean) {
    const resp = validateRequired<{ dataFolder: undefined }>({ name }, ['name'])
    if (resp) return resp
    const { renameDataFolder } = await this.query<{ renameDataFolder: MutationResponse & { dataFolder: DataFolder } }>(RENAME_DATA_FOLDER, { folderId, name, validateOnly })
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

  async editRole (roleId: string, name: string, validateOnly?: boolean) {
    const { updateRole } = await this.query<{ updateRole: MutationResponse & { role: RoleListRole } }>(UPDATE_ROLE, { roleId, name, validateOnly })
    return updateRole
  }

  async getSiteList () {
    const { sites } = await this.query<{ sites: SiteListSite[]}>(GET_SITE_LIST)
    return sites
  }

  async getSiteById (siteId: string) {
    const { sites } = await this.query<{ sites: FullSite[]}>(GET_SITE_BY_ID, { siteId })
    return sites[0]
  }

  async addSite (name: string, templateKey: string, data: any, validateOnly?: boolean) {
    const resp = validateRequired<{ site: undefined }>({ name, templateKey, data }, ['name', 'templateKey'])
    if (resp) return resp
    // TODO: Get actual schema version
    const pageData = Object.assign({}, data, { templateKey, savedAtVersion: DateTime.now().toFormat('yLLddHHmmss') })
    const { createSite } = await this.query<{ createSite: MutationResponse & {site: SiteListSite } }>(ADD_SITE, { name, data: pageData, validateOnly })
    return createSite
  }

  async renameSite (siteId: string, name: string, validateOnly?: boolean) {
    const { renameSite } = await this.query<{ renameSite: MutationResponse & { site: FullSite } }>(RENAME_SITE, { siteId, name, validateOnly })
    return renameSite
  }

  async deleteSite (siteId: string) {
    const { deleteSite } = await this.query<{ deleteSite: MutationResponse & { site: FullSite } }>(DELETE_SITE, { siteId })
    return deleteSite
  }

  async unDeleteSite (siteId: string) {
    const { unDeleteSite } = await this.query<{ unDeleteSite: MutationResponse & { site: FullSite } }>(UNDELETE_SITE, { siteId })
    return unDeleteSite
  }

  async updateSiteManagement (siteId: string, organizationId?: string, ownerId?: string, managerIds?: string[], validateOnly?: boolean) {
    const { updateSiteManagement } = await this.query<{ updateSiteManagement: MutationResponse & { site: FullSite } }>(UPDATE_SITE_MANAGEMENT, { siteId, args: { organizationId, ownerId, managerIds }, validateOnly })
    return updateSiteManagement
  }

  async addSiteComment (siteId: string, comment: string) {
    const { createSiteComment } = await this.query<{ createSiteComment: MutationResponse & { comment: SiteComment } }>(ADD_SITE_COMMENT, { siteId, comment })
    return createSiteComment
  }

  async addPagetree (siteId: string, name: string, templateKey: string, data: any, validateOnly?: boolean) {
    const resp = validateRequired<{ pagetree: undefined }>({ name, templateKey, data }, ['name', 'templateKey'])
    if (resp) return resp
    // TODO: Get actual schema version
    const pageData = Object.assign({}, data, { templateKey, savedAtVersion: DateTime.now().toFormat('yLLddHHmmss') })
    const { createPagetree } = await this.query<{ createPagetree: MutationResponse & { pagetree: SitePagetree }}>(ADD_PAGETREE, { siteId, name, data: pageData, validateOnly })
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

  async editAssetRule (args: UpdateAssetRuleInput, validateOnly?: boolean) {
    const { updateAssetRule } = await this.query<{ updateAssetRule: MutationResponse & { assetRule: AssetRule }}>(UPDATE_ASSET_RULE, { args, validateOnly })
    return updateAssetRule
  }

  async addDataRule (args: CreateDataRuleInput, validateOnly?: boolean) {
    const { createDataRule } = await this.query<{ createDataRule: MutationResponse & { dataRule: DataRule }}>(ADD_DATA_RULE, { args, validateOnly })
    return createDataRule
  }

  async editDataRule (args: UpdateDataRuleInput, validateOnly?: boolean) {
    const { updateDataRule } = await this.query<{ updateDataRule: MutationResponse & { dataRule: DataRule }}>(UPDATE_DATA_RULE, { args, validateOnly })
    return updateDataRule
  }

  async addGlobalRule (args: CreateGlobalRuleInput, validateOnly?: boolean) {
    const { createGlobalRule } = await this.query<{ createGlobalRule: MutationResponse & { globalRule: GlobalRule }}>(ADD_GLOBAL_RULE, { args, validateOnly })
    return createGlobalRule
  }

  async editGlobalRule (args: UpdateGlobalRuleInput, validateOnly?: boolean) {
    const { updateGlobalRule } = await this.query<{ updateGlobalRule: MutationResponse & { globalRule: GlobalRule }}>(UPDATE_GLOBAL_RULE, { args, validateOnly })
    return updateGlobalRule
  }

  async addPageRule (args: CreatePageRuleInput, validateOnly?: boolean) {
    const { createPageRule } = await this.query<{ createPageRule: MutationResponse & { pageRule: PageRule }}>(ADD_PAGE_RULE, { args, validateOnly })
    return createPageRule
  }

  async editPageRule (args: UpdatePageRuleInput, validateOnly?: boolean) {
    const { updatePageRule } = await this.query<{ updatePageRule: MutationResponse & { pageRule: PageRule }}>(UPDATE_PAGE_RULE, { args, validateOnly })
    return updatePageRule
  }

  async addSiteRule (args: CreateSiteRuleInput, validateOnly?: boolean) {
    const { createSiteRule } = await this.query<{ createSiteRule: MutationResponse & { siteRule: SiteRule }}>(ADD_SITE_RULE, { args, validateOnly })
    return createSiteRule
  }

  async editSiteRule (args: UpdateSiteRuleInput, validateOnly?: boolean) {
    const { updateSiteRule } = await this.query<{ updateSiteRule: MutationResponse & { siteRule: SiteRule }}>(UPDATE_SITE_RULE, { args, validateOnly })
    return updateSiteRule
  }

  async addTemplateRule (args: CreateTemplateRuleInput, validateOnly?: boolean) {
    const { createTemplateRule } = await this.query<{ createTemplateRule: MutationResponse & { templateRule: TemplateRule }}>(ADD_TEMPLATE_RULE, { args, validateOnly })
    return createTemplateRule
  }

  async editTemplateRule (args: UpdateTemplateRuleInput, validateOnly?: boolean) {
    const { updateTemplateRule } = await this.query<{ updateTemplateRule: MutationResponse & { templateRule: TemplateRule }}>(UPDATE_TEMPLATE_RULE, { args, validateOnly })
    return updateTemplateRule
  }

  async removeRule (ruleId: string, type: 'GLOBAL' | 'SITE' | 'PAGE' | 'TEMPLATE' | 'ASSET' | 'DATA') {
    const { removeRule } = await this.query<{ removeRule: MutationResponse }>(REMOVE_RULE, { ruleId, type })
    return removeRule
  }

  async getOrganizationList () {
    const { organizations } = await this.query<{ organizations: Organization[]}>(GET_ORGANIZATION_LIST)
    return organizations
  }

  async createPage (name: string, templateKey: string, data: any, targetId: string, above: boolean, validateOnly?: boolean) {
    const resp = validateRequired<{ site: undefined }>({ name, templateKey, data }, ['name', 'templateKey'])
    if (resp) return resp
    // TODO: Get actual schema version
    const pageData = Object.assign({}, data, { templateKey, savedAtVersion: DateTime.now().toFormat('yLLddHHmmss') })
    const { createPage } = await this.query<{ createPage: MutationResponse & { page: PageEditorPage }}>(CREATE_PAGE, { name, data: pageData, targetId, validate: validateOnly })
    return createPage
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
