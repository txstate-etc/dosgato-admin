import { base } from '$app/paths'
import type { TagGroup } from '@dosgato/dialog'
import type { AssetFolderLink, AssetLink, ComponentData, DataData, PageData, PageLink } from '@dosgato/templating'
import { error } from '@sveltejs/kit'
import { MessageType } from '@txstate-mws/svelte-forms'
import { Cache, get, isBlank, isNotBlank, keyby, pick, sortby, toArray, unique } from 'txstate-utils'
import {
  DISABLE_USERS, ENABLE_USERS, UPDATE_USER, REMOVE_USER_FROM_GROUP, ADD_USER_TO_GROUPS, CREATE_DATA_FOLDER,
  DELETE_DATA_FOLDERS, RENAME_DATA_FOLDER, CREATE_DATA_ITEM, PUBLISH_DATA_ENTRIES, UNPUBLISH_DATA_ENTRIES,
  CREATE_GROUP, UPDATE_GROUP, DELETE_GROUP, GET_DATA_BY_DATAFOLDER_ID, GET_EDITOR_PAGE,
  GET_DATAROOTS_BY_TEMPLATE_KEY, GET_DATA_BY_ROOT_ID,
  GET_GLOBAL_SELF, GET_TEMPLATE_INFO, GET_AVAILABLE_TEMPLATE_INFO, GET_TREE_PAGES, GET_USER_LIST,
  GET_USER_BY_ID, GET_VIEWFOREDIT_DATATEMPLATES, GET_ROLE_LIST, GET_ALL_GROUPS, GET_ROOT_GROUPS,
  GET_SUBGROUPS, GET_GROUP_BY_ID, GET_ROLE_BY_ID, GET_SITE_LIST, CHOOSER_SUBPAGES_BY_PATH,
  CHOOSER_SUBFOLDERS_AND_ASSETS_BY_PATH, CHOOSER_PAGE_BY_LINK, GET_AVAILABLE_COMPONENTS, GET_TEMPLATES_BY_TYPE, RENAME_SITE,
  GET_SITE_BY_ID, GET_ORGANIZATION_LIST, UPDATE_SITE_MANAGEMENT, SET_LAUNCH_URL, ADD_SITE_COMMENT, ADD_PAGETREE,
  type DataFolder, type GlobalSelf, type PageEditorPage, type TemplateListTemplate, type DataItem, type DataRoot,
  type TreePage, type UserListUser, type FullUser, type GroupListGroup, type FullGroup, type RoleListRole,
  type FullRole, type SiteListSite, type GetAvailableComponents, type ChooserSubPagesByPath,
  type GetSubFoldersAndAssetsByPath, ADD_ASSET_RULE, ADD_DATA_RULE, REMOVE_RULE, type AssetRule,
  type CreateAssetRuleInput, type CreateDataRuleInput, type DataRule, CREATE_PAGE, type FullSite,
  type Organization, type SiteComment, type SitePagetree, type TreeAssetFolder, type TreeAsset, type UserFilter,
  GET_ASSETFOLDER_CHILDREN, UPDATE_PAGETREE, DELETE_PAGETREE, PROMOTE_PAGETREE, ARCHIVE_PAGETREE,
  AUTHORIZE_TEMPLATE_SITE, AUTHORIZE_TEMPLATE_PAGETREES, GET_ALL_TEMPLATES, SET_TEMPLATE_UNIVERSAL,
  CHOOSER_ASSET_BY_LINK, apiAssetToChooserAsset, apiAssetFolderToChooserFolder, DEAUTHORIZE_TEMPLATE, ADD_SITE,
  UPDATE_ASSET_RULE, CREATE_USER, type CreateUserInput, ADD_ROLES_TO_USER, REMOVE_ROLE_FROM_USER, type UpdateAssetRuleInput,
  type UpdateDataRuleInput, UPDATE_DATA_RULE, type MessageFromAPI, UPDATE_ROLE, type CreateGlobalRuleInput, type UpdateGlobalRuleInput,
  type GlobalRule, ADD_GLOBAL_RULE, UPDATE_GLOBAL_RULE, type PageRule, type CreatePageRuleInput, type UpdatePageRuleInput,
  ADD_PAGE_RULE, UPDATE_PAGE_RULE, type SiteRule, type CreateSiteRuleInput, type UpdateSiteRuleInput, ADD_SITE_RULE, UPDATE_SITE_RULE,
  type CreateTemplateRuleInput, type UpdateTemplateRuleInput, type TemplateRule, ADD_TEMPLATE_RULE, UPDATE_TEMPLATE_RULE,
  GET_TEMPLATES_BY_PAGE, type PageWithTemplates, DELETE_SITE, UNDELETE_SITE, type CreateAssetFolderInput, CREATE_ASSET_FOLDER,
  GET_DATA_BY_ID, type DataWithData, UPDATE_DATA, SET_GROUP_USERS, ADD_ROLE_TO_GROUPS, REMOVE_ROLE_FROM_GROUP, REMOVE_USER_FROM_GROUPS,
  PUBLISH_DELETION, UNDELETE_PAGES, SET_USER_GROUPS, RENAME_ASSET_FOLDER, CREATE_ROLE, DELETE_ROLE, RENAME_PAGE, COPY_PAGES,
  PUBLISH_PAGES, UNPUBLISH_PAGES, DELETE_PAGES, type RootTreePage, DELETE_DATA, PUBLISH_DATA_DELETION, UNDELETE_DATA, MOVE_PAGES,
  type MoveDataTarget, MOVE_DATA, MOVE_DATA_FOLDERS, apiPageToChooserPage, type ChooserPageByLink, type ChooserAssetByLink,
  CHOOSER_PAGE_BY_PATH, type ChooserPageByPath, CHOOSER_ASSET_BY_ID, type ChooserAssetById, type ChooserAssetFolderByLink,
  CHOOSER_ASSET_FOLDER_BY_LINK, CHOOSER_PAGE_BY_URL, DELETE_ASSETS, FINALIZE_DELETE_ASSETS, UNDELETE_ASSETS, DELETE_ASSET_FOLDER,
  FINALIZE_DELETE_ASSET_FOLDER, UNDELETE_ASSET_FOLDER, type MoveComponentResponse, MOVE_COMPONENT, type CreateComponentResponse,
  CREATE_COMPONENT, type EditComponentResponse, EDIT_COMPONENT, type RemoveComponentResponse, REMOVE_COMPONENT,
  type ChangeTemplateResponse, CHANGE_PAGE_TEMPLATE, type EditPagePropertiesResponse, EDIT_PAGE_PROPERTIES, type RootAssetFolder,
  type ChooserAssetByPath, CHOOSER_ASSET_BY_PATH, type SiteAuditSite, GET_SITE_AUDIT, type VersionDetails, GET_PAGE_VERSIONS,
  type PageAuditPage, GET_PAGETREE_PAGES_FOR_AUDIT, VERSION_DETAILS, ASSIGN_ROLE_TO_USERS, type PageWithDescendants, GET_PAGES_AND_DESCENDANTS, EDITOR_PAGE_DETAILS, RENAME_ASSET, type UserAuditUser, GET_USER_AUDIT_LIST, GET_SEARCH_PAGES, type SearchTreePage,
  type AssetWithPages, ASSET_WITH_PAGES, UNDELETE_DATA_FOLDERS, mutationResponse, FINALIZE_DATA_FOLDER_DELETION, type TemplateListTemplateWithAreas,
  GET_TEMPLATE_DETAIL, GET_TEMPLATE_AREAS, GET_TEMPLATES_WITH_AREAS_BY_TYPE, type TemplateWithPagetrees, GET_TEMPLATE_PAGETREES, type AssetSearchResult, GET_SEARCH_ASSETS,
  GET_PAGE_TEMPLATES_ALLOWING_COMPONENT
} from './queries'
import { uiConfig } from '../local/index.js'
import { templateRegistry } from './registry'
import { environmentConfig, toast, LaunchState } from './stores'
import { messageForDialog } from './helpers'
import { schemaVersion } from './schemaversion'
import { DateTime } from 'luxon'
import type { HistoryVersion } from './components/VersionHistory.svelte'

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

function validateRequired <T = any> (data: any, requiredFields: string[]) {
  const messages: MessageFromAPI[] = []
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
    environmentConfig.assetRegex = isNotBlank(environmentConfig.assetLiveBase) ? new RegExp('^(?:' + environmentConfig.assetLiveBase + '|(?:' + environmentConfig.renderBase + ')?/.asset)/([^/]+)/') : new RegExp('^(?:' + environmentConfig.renderBase + ')?/.asset/([^/]+)/')
    this.ready()
  }

  async query <ReturnType = any> (query: string, variables?: any, querySignature?: string): Promise<ReturnType> {
    await this.readyPromise
    let toasted = false
    try {
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
          uiConfig.login.handleUnauthorized(environmentConfig)
          throw error(401, response.statusText)
        } else throw error(response.status, response.statusText)
      }
      const gqlresponse = await response.json()
      if (gqlresponse.errors?.length) {
        toast(gqlresponse.errors[0].message)
        toasted = true
        throw new Error(JSON.stringify(gqlresponse.errors))
      }
      return gqlresponse.data
    } catch (e: any) {
      if (!toasted) toast(e.message)
      throw e
    }
  }

  async restful <ReturnType = any> (url: string) {
    await this.readyPromise
    try {
      const resp = await this.fetch(environmentConfig.apiBase + url, {
        headers: {
          Authorization: `Bearer ${this.token ?? ''}`,
          Accept: 'application/json'
        }
      })
      if (!resp.ok) {
        if (resp.status === 401) {
          uiConfig.login.handleUnauthorized(environmentConfig)
          throw error(401, resp.statusText)
        } else {
          toast(resp.statusText)
          throw error(resp.status, resp.statusText)
        }
      }
      return await resp.json() as ReturnType
    } catch (e: any) {
      toast(e.message)
      throw e
    }
  }

  async download (url: string) {
    await this.readyPromise
    const iframe = document.createElement('iframe')
    iframe.addEventListener('load', () => iframe.remove())
    iframe.setAttribute('hidden', '')
    iframe.setAttribute('src', url)
    // TODO: Look into adding logging to messages from this download iframe.
    document.body.append(iframe)
  }

  async config () {
    return await (await this.fetch(base + '/config')).json()
  }

  async getSelf () {
    const { users, access } = await this.query<GlobalSelf>(GET_GLOBAL_SELF)
    return { me: users[0], access }
  }

  async getRootPages () {
    return await this.restful<RootTreePage[]>('/pages/list')
  }

  async getSubPages (pageId: string) {
    const page = await this.pageChildrenLoader.get(pageId)
    return page?.children ?? []
  }

  protected async getSubPagesBatch (pageId: string | string[]) {
    const { pages } = await this.query<{ pages: { id: string, children: TreePage[] }[] }>(GET_TREE_PAGES, { ids: toArray(pageId) })
    return pages
  }

  async getSearchPages (search: string) {
    const { pages } = await this.query<{ pages: SearchTreePage[] }>(GET_SEARCH_PAGES, { search })
    return pages.map(p => ({
      ...p,
      type: p.pagetree.type,
      children: undefined,
      hasChildren: false,
      modifiedAt: DateTime.fromISO(p.modifiedAt),
      publishedAt: p.publishedAt ? DateTime.fromISO(p.publishedAt) : undefined,
      status: p.published ? (p.hasUnpublishedChanges ? 'modified' : 'published') : 'unpublished'
    }))
  }

  async chooserSubPagesByPath (path: string, pagetreeId: string | undefined) {
    if (path === '/') return await this.chooserRootPages(pagetreeId)
    const { pages } = await this.query<ChooserSubPagesByPath>(CHOOSER_SUBPAGES_BY_PATH, { path })
    return pages.map(p => apiPageToChooserPage(p))
  }

  async chooserRootPages (pagetreeId: string | undefined) {
    const pages = await this.getRootPages()
    const siteId = (pagetreeId ? pages.find(p => p.pagetree.id === pagetreeId) : undefined)?.site.id
    return pages.filter(p => p.pagetree.id === pagetreeId || (p.site.id !== siteId && p.pagetree.type === 'PRIMARY')).map(p => apiPageToChooserPage(p))
  }

  async chooserPageByLink (link: PageLink, pagetreeId?: string) {
    const { pages } = await this.query<ChooserPageByLink>(CHOOSER_PAGE_BY_LINK, { pageLink: { ...pick(link, 'linkId', 'siteId', 'path'), context: pagetreeId ? { pagetreeId } : undefined } })
    return apiPageToChooserPage(pages[0], link.hash)
  }

  async chooserPageByPath (path: string) {
    const [pagePath, hash] = path.split('#')
    const { pages } = await this.query<ChooserPageByPath>(CHOOSER_PAGE_BY_PATH, { path: pagePath })
    return apiPageToChooserPage(pages[0], hash)
  }

  async chooserPageByUrl (url: string) {
    const [pageUrl, hash] = url.split('#')
    const { pages } = await this.query<ChooserPageByPath>(CHOOSER_PAGE_BY_URL, { url: pageUrl })
    return apiPageToChooserPage(pages[0], hash)
  }

  async chooserSubFoldersAndAssetsByPath (path: string, pagetreeId: string | undefined) {
    if (path === '/') {
      const folders = await this.getRootAssetFolders()
      const siteId = (pagetreeId ? folders.find(f => f.pagetree.id === pagetreeId) : undefined)?.site.id
      return folders.filter(f => f.site.launchState !== LaunchState.DECOMMISSIONED && (f.pagetree.id === pagetreeId || (f.site.id !== siteId && f.pagetree.type === 'PRIMARY'))).map(apiAssetFolderToChooserFolder)
    }
    const { assets, assetfolders } = await this.query<GetSubFoldersAndAssetsByPath>(CHOOSER_SUBFOLDERS_AND_ASSETS_BY_PATH, { path })
    return [...assets.map(a => apiAssetToChooserAsset(a)!), ...assetfolders.map(f => apiAssetFolderToChooserFolder(f))]
  }

  async chooserAssetByLink (link: AssetLink, pagetreeId?: string) {
    const { assets } = await this.query<ChooserAssetByLink>(CHOOSER_ASSET_BY_LINK, { link: { ...pick(link, 'siteId', 'path', 'checksum'), linkId: link.id, context: pagetreeId ? { pagetreeId } : undefined } })
    return apiAssetToChooserAsset(assets[0])
  }

  async chooserAssetById (id: string) {
    const { assets } = await this.query<ChooserAssetById>(CHOOSER_ASSET_BY_ID, { id })
    return apiAssetToChooserAsset(assets[0])
  }

  async chooserAssetByPath (path: string) {
    const { assets, assetfolders } = await this.query<ChooserAssetByPath>(CHOOSER_ASSET_BY_PATH, { assetPath: path, folderPath: path })
    return apiAssetToChooserAsset(assets[0]) ?? apiAssetFolderToChooserFolder(assetfolders[0])
  }

  async chooserAssetFolderByLink (link: AssetFolderLink, pagetreeId?: string) {
    const { assetfolders } = await this.query<ChooserAssetFolderByLink>(CHOOSER_ASSET_FOLDER_BY_LINK, { link: { ...pick(link, 'siteId', 'path'), linkId: link.id, context: pagetreeId ? { pagetreeId } : undefined } })
    return apiAssetFolderToChooserFolder(assetfolders[0])
  }

  async getSubFoldersAndAssets (folderId: string) {
    return await this.assetFolderChildrenLoader.get(folderId)
  }

  protected async getSubFoldersAndAssetsBatch (folderIds: string | string[]) {
    const { assetfolders } = await this.query<{ assetfolders: { id: string, folders: TreeAssetFolder[], assets: TreeAsset[] }[] }>(GET_ASSETFOLDER_CHILDREN, { ids: toArray(folderIds) })
    return assetfolders
  }

  async getRootAssetFolders () {
    return await this.restful<RootAssetFolder[]>('/assetfolders/list')
  }

  async createAssetFolder (args: CreateAssetFolderInput, validateOnly?: boolean) {
    const resp = validateRequired<{ assetFolder: undefined }>(args, ['name', 'parentId'])
    if (resp) return resp
    const { createAssetFolder } = await this.query<{ createAssetFolder: MutationResponse & { assetFolder: TreeAssetFolder } }>(CREATE_ASSET_FOLDER, { args, validateOnly })
    return createAssetFolder
  }

  async renameAssetFolder (folderId: string, name: string, validateOnly?: boolean) {
    const resp = validateRequired<{ assetFolder: undefined }>({ name, folderId }, ['name', 'folderId'])
    if (resp) return resp
    const { renameAssetFolder } = await this.query<{ renameAssetFolder: MutationResponse & { assetFolder: TreeAssetFolder } }>(RENAME_ASSET_FOLDER, { folderId, name, validateOnly })
    return renameAssetFolder
  }

  async renameAsset (assetId: string, name: string, validateOnly?: boolean) {
    const resp = validateRequired<{ asset: undefined }>({ name, assetId }, ['name', 'assetId'])
    if (resp) return resp
    const { renameAsset } = await this.query<{ renameAsset: MutationResponse & { asset: TreeAsset } }>(RENAME_ASSET, { assetId, name, validateOnly })
    return renameAsset
  }

  async deleteAssets (assetIds: string[]) {
    const { deleteAssets } = await this.query<{ deleteAssets: MutationResponse & { assets: TreeAsset[] } }>(DELETE_ASSETS, { assetIds })
    return deleteAssets
  }

  async finalizeDeleteAssets (assetIds: string[]) {
    const { finalizeDeleteAssets } = await this.query<{ finalizeDeleteAssets: MutationResponse & { assets: TreeAsset[] } }>(FINALIZE_DELETE_ASSETS, { assetIds })
    return finalizeDeleteAssets
  }

  async undeleteAssets (assetIds: string[]) {
    const { undeleteAssets } = await this.query<{ undeleteAssets: MutationResponse & { assets: TreeAsset[] } }>(UNDELETE_ASSETS, { assetIds })
    return undeleteAssets
  }

  async deleteAssetFolder (folderId: string) {
    const { deleteAssetFolder } = await this.query<{ deleteAssetFolder: MutationResponse & { folder: TreeAssetFolder } }>(DELETE_ASSET_FOLDER, { folderId })
    return deleteAssetFolder
  }

  async finalizeDeleteAssetFolder (folderId: string) {
    const { finalizeAssetFolderDeletion } = await this.query<{ finalizeAssetFolderDeletion: MutationResponse & { folder: TreeAssetFolder } }>(FINALIZE_DELETE_ASSET_FOLDER, { folderId })
    return finalizeAssetFolderDeletion
  }

  async undeleteAssetFolder (folderId: string) {
    const { undeleteAssetFolder } = await this.query<{ undeleteAssetFolder: MutationResponse & { folder: TreeAssetFolder } }>(UNDELETE_ASSET_FOLDER, { folderId })
    return undeleteAssetFolder
  }

  async getAssetReferencingPages (assetId: string) {
    const { assets } = await this.query<AssetWithPages>(ASSET_WITH_PAGES, { assetId })
    return { assetReferences: sortby(assets[0]?.pages ?? [], 'path'), assetReferencesIndirect: sortby(assets[0]?.pagesIndirect ?? [], 'path') }
  }

  async getSearchAssets (search: string) {
    const { assets } = await this.query<{ assets: AssetSearchResult[] }>(GET_SEARCH_ASSETS, { search })
    return assets
  }

  async getEditorPage (pageId: string) {
    const { pages } = await this.query<{ pages: [PageEditorPage | undefined] }>(GET_EDITOR_PAGE, { id: pageId })
    return pages[0]
  }

  async getUserList (filter: UserFilter) {
    const { users } = await this.query<{ users: UserListUser[] }>(GET_USER_LIST, { filter })
    return users
  }

  async getUserListForAudit () {
    const { users } = await this.query<{ users: UserAuditUser[] }>(GET_USER_AUDIT_LIST)
    return sortby(users, 'lastname')
  }

  async getUserById (userId: string) {
    const { users } = await this.query<{ users: FullUser[] }>(GET_USER_BY_ID, { userId })
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
    const resp = validateRequired<{ user: undefined }>(args, ['userId', 'lastname', 'email'])
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

  async assignRoleToUsers (roleId: string, userIds: string[]) {
    const { assignRoleToUsers } = await this.query<{ assignRoleToUsers: MutationResponse }>(ASSIGN_ROLE_TO_USERS, { roleId, userIds })
    return assignRoleToUsers
  }

  async addUserToGroups (userId: string, groupIds: string[]) {
    const { addUserToGroups } = await this.query<{ addUserToGroups: MutationResponse }>(ADD_USER_TO_GROUPS, { groupIds, userId })
    return addUserToGroups
  }

  async setGroupUsers (groupId: string, userIds: string[]) {
    const { setGroupUsers } = await this.query<{ setGroupUsers: MutationResponse }>(SET_GROUP_USERS, { groupId, userIds })
    return setGroupUsers
  }

  async setUserGroups (userId: string, groupIds: string[]) {
    const { setUserGroups } = await this.query< { setUserGroups: MutationResponse }>(SET_USER_GROUPS, { userId, groupIds })
    return setUserGroups
  }

  async removeMemberFromGroup (groupId: string, userId: string) {
    const { removeUserFromGroups } = await this.query<{ removeUserFromGroups: MutationResponse }>(REMOVE_USER_FROM_GROUPS, { groupIds: [groupId], userId })
    return removeUserFromGroups
  }

  async addRoleToGroups (roleId: string, groupIds: string[]) {
    const { addRoleToGroups } = await this.query<{ addRoleToGroups: MutationResponse }>(ADD_ROLE_TO_GROUPS, { roleId, groupIds })
    return addRoleToGroups
  }

  async removeRoleFromGroup (roleId: string, groupId: string) {
    const { removeRoleFromGroup } = await this.query<{ removeRoleFromGroup: MutationResponse }>(REMOVE_ROLE_FROM_GROUP, { roleId, groupId })
    return removeRoleFromGroup
  }

  async removeUserFromGroup (userId: string, groupId: string) {
    const { removeUserFromGroups } = await this.query<{ removeUserFromGroups: MutationResponse }>(REMOVE_USER_FROM_GROUP, { groupIds: [groupId], userId })
    return removeUserFromGroups
  }

  async getAllTemplates () {
    const { templates } = await this.query<{ templates: TemplateListTemplate[] }>(GET_ALL_TEMPLATES)
    return templates.map(t => { t.id = t.key; return t })
  }

  async getTemplatesByType (type: string, universal?: boolean) {
    const { templates } = await this.query<{ templates: TemplateListTemplate[] }>(GET_TEMPLATES_BY_TYPE, { type, universal })
    return templates.map(t => { t.id = t.key; return t })
  }

  async getTemplatesByPage (pageId: string) {
    const { pages } = await this.query<{ pages: PageWithTemplates[] }>(GET_TEMPLATES_BY_PAGE, { pageId })
    return pages[0].templates.map(template => ({ value: template.key, label: template.name }))
  }

  async getTemplateInfo (key: string) {
    const { templates } = await this.query<{ templates: TemplateListTemplate[] }>(GET_TEMPLATE_INFO, { key })
    const t = templates[0]
    t.id = t.key
    return t
  }

  addIdToTemplate (template: TemplateListTemplateWithAreas) {
    const updatedTemplate = { ...template, id: template.key }
    for (const area of updatedTemplate.areas) {
      for (const component of area.availableComponents) {
        component.id = component.key
      }
    }
    return updatedTemplate
  }

  async getTemplateWithAreasByKey (key: string) {
    const { templates } = await this.query<{ templates: TemplateListTemplateWithAreas[] }>(GET_TEMPLATE_DETAIL, { key })
    const template = templates[0]
    return this.addIdToTemplate(template)
  }

  async getTemplatesWithAreasByType (type: string) {
    const { templates } = await this.query<{ templates: TemplateListTemplateWithAreas[] }>(GET_TEMPLATES_WITH_AREAS_BY_TYPE, { type })
    return templates.map(t => this.addIdToTemplate(t))
  }

  async getTemplateAreas (key: string) {
    const { templates } = await this.query<{ templates: TemplateListTemplateWithAreas[] }>(GET_TEMPLATE_AREAS, { key })
    if (!templates.length) return []
    const t = templates[0]
    return t.areas.map(area => ({
      ...area,
      id: `${t.key}_${area.name}`
    }))
  }

  async getRestrictedTemplatePagetrees (key: string) {
    const { templates } = await this.query<{ templates: TemplateWithPagetrees[] }>(GET_TEMPLATE_PAGETREES, { key })
    if (!templates.length) return
    const t = templates[0]
    t.id = t.key
    return t
  }

  async getPageTemplatesAllowingComponent (key: string) {
    const { templates } = await this.query<{ templates: { rootPageTemplates: TemplateListTemplate[] }[] }>(GET_PAGE_TEMPLATES_ALLOWING_COMPONENT, { key })
    if (!templates.length) return []
    const temp = templates[0]
    return temp.rootPageTemplates.map(t => {
      t.id = t.key
      return t
    })
  }

  async getAvailableTemplateInfo (keys: string[]) {
    const { templates } = await this.query< { templates: TemplateListTemplate[] }>(GET_AVAILABLE_TEMPLATE_INFO, { keys })
    return templates.map(t => { t.id = t.key; return t })
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
    const { setTemplateUniversal } = await this.query<{ setTemplateUniversal: MutationResponse }>(SET_TEMPLATE_UNIVERSAL, { templateKey, universal })
    return setTemplateUniversal
  }

  async getAvailableComponents (templateKey: string, area: string, pageId: string) {
    const { templates } = await this.query<GetAvailableComponents>(GET_AVAILABLE_COMPONENTS, { templateKey, pageId })
    return templates[0]?.areas.find(a => a.name === area)?.availableComponents.filter(ac => ac.permissions.useOnPage).map(ac => templateRegistry.getTemplate(ac.key)!) ?? []
  }

  async getDataRootsByTemplateKey (key: string) {
    const { dataroots } = await this.query<{ dataroots: DataRoot[] }>(GET_DATAROOTS_BY_TEMPLATE_KEY, { key })
    return dataroots
  }

  async getDataAccessByTemplateKey () {
    const { dataroots } = await this.query<{ dataroots: { template: { key: string } }[] }>(GET_VIEWFOREDIT_DATATEMPLATES)
    return new Set(dataroots.map(dr => dr.template.key))
  }

  async getDataByRootId (id: string) {
    const { dataroots } = await this.query<{ dataroots: { id: string, data: DataItem[], datafolders: DataFolder[] }[] }>(GET_DATA_BY_ROOT_ID, { id })
    return dataroots[0]
  }

  async getDataByFolderId (id: string) {
    const { data } = await this.query<{ data: DataItem[] }>(GET_DATA_BY_DATAFOLDER_ID, { id })
    return data
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

  async moveDataFolders (folderIds: string[], siteId?: string) {
    const { moveDataFolders } = await this.query<{ moveDataFolders: MutationResponse & { dataFolders: DataFolder[] } }>(MOVE_DATA_FOLDERS, { folderIds, siteId })
    return moveDataFolders
  }

  async undeleteDataFolders (folderIds: string[]) {
    const { undeleteDataFolders } = await this.query<{ undeleteDataFolders: MutationResponse & { dataFolders: DataFolder[] } }>(UNDELETE_DATA_FOLDERS, { folderIds })
    return undeleteDataFolders
  }

  async finalizeDataFolderDeletion (folderIds: string[]) {
    const { finalizeDataFolderDeletion } = await this.query<{ finalizeDataFolderDeletion: MutationResponse & { dataFolders: DataFolder[] } }>(FINALIZE_DATA_FOLDER_DELETION, { folderIds })
    return finalizeDataFolderDeletion
  }

  async addDataEntry (data: any, templateKey: string, siteId?: string, folderId?: string, validateOnly?: boolean) {
    const dataToSave = Object.assign({}, data, { templateKey, savedAtVersion: schemaVersion })
    const { createDataEntry } = await this.query<{ createDataEntry: MutationResponse & { data: DataItem } }>(CREATE_DATA_ITEM, { args: { data: dataToSave, siteId, folderId }, validateOnly })
    return createDataEntry
  }

  async getDataEntryById (dataId: string) {
    const { data } = await this.query<{ data: DataWithData[] }>(GET_DATA_BY_ID, { id: dataId })
    return data[0]
  }

  async editDataEntry (dataId: string, data: DataData, templateKey: string, dataVersion: number, validateOnly?: boolean) {
    const dataToSave = Object.assign({}, data, { templateKey, savedAtVersion: schemaVersion })
    const { updateDataEntry } = await this.query<{ updateDataEntry: MutationResponse & { data: DataItem } }>(UPDATE_DATA, { dataId, args: { data: dataToSave, dataVersion }, validateOnly })
    return updateDataEntry
  }

  async publishDataEntries (dataIds: string[]) {
    const { publishDataEntries } = await this.query<{ publishDataEntries: MutationResponse }>(PUBLISH_DATA_ENTRIES, { dataIds })
    return publishDataEntries
  }

  async unpublishDataEntries (dataIds: string[]) {
    const { unpublishDataEntries } = await this.query<{ unpublishDataEntries: MutationResponse }>(UNPUBLISH_DATA_ENTRIES, { dataIds })
    return unpublishDataEntries
  }

  async deleteDataEntries (dataIds: string[]) {
    const { deleteDataEntries } = await this.query<{ deleteDataEntries: MutationResponse & { data: DataItem[] } }>(DELETE_DATA, { dataIds })
    return deleteDataEntries
  }

  async publishDeleteData (dataIds: string[]) {
    const { publishDataEntryDeletions } = await this.query<{ publishDataEntryDeletions: MutationResponse & { data: DataItem[] } }>(PUBLISH_DATA_DELETION, { dataIds })
    return publishDataEntryDeletions
  }

  async undeleteData (dataIds: string[]) {
    const { undeleteDataEntries } = await this.query<{ undeleteDataEntries: MutationResponse & { data: DataItem[] } }>(UNDELETE_DATA, { dataIds })
    return undeleteDataEntries
  }

  async moveData (dataIds: string[], target: MoveDataTarget) {
    const { moveDataEntries } = await this.query<{ moveDataEntries: MutationResponse & { data: DataItem[] } }>(MOVE_DATA, { dataIds, target })
    return moveDataEntries
  }

  async getRoleList () {
    const { roles } = await this.query<{ roles: RoleListRole[] }>(GET_ROLE_LIST)
    return roles
  }

  trainingsCache = new Cache(async () => {
    const { trainings } = await this.query<{ trainings: { id: string, name: string, lcName: string }[] }>('query getAllTrainings { trainings { id name } }')
    return trainings.map(t => ({ ...t, lcName: t.name.toLocaleLowerCase() }))
  })

  async getTrainings () {
    return await this.trainingsCache.get()
  }

  async addRole (name: string, validateOnly?: boolean) {
    const resp = validateRequired<{ role: undefined }>({ name }, ['name'])
    if (resp) return resp
    const { createRole } = await this.query<{ createRole: MutationResponse & { role: RoleListRole } }>(CREATE_ROLE, { name, validateOnly })
    return createRole
  }

  async deleteRole (roleId: string) {
    const { deleteRole } = await this.query<{ deleteRole: MutationResponse }>(DELETE_ROLE, { roleId })
    return deleteRole
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
    const { groups } = await this.query<{ groups: FullGroup[] }>(GET_GROUP_BY_ID, { groupId })
    return groups[0]
  }

  async addGroup (name: string, parentId?: string, validateOnly?: boolean) {
    const resp = validateRequired<{ group: undefined }>({ name }, ['name'])
    if (resp) return resp
    const { createGroup } = await this.query<{ createGroup: MutationResponse & { group: GroupListGroup } }>(CREATE_GROUP, { name, parentId, validateOnly })
    return createGroup
  }

  async editGroup (groupId: string, name: string, validateOnly?: boolean) {
    const resp = validateRequired<{ group: undefined }>({ name }, ['name'])
    if (resp) return resp
    const { updateGroup } = await this.query<{ updateGroup: MutationResponse & { group: GroupListGroup } }>(UPDATE_GROUP, { groupId, name, validateOnly })
    return updateGroup
  }

  async deleteGroup (groupId: string) {
    const { deleteGroup } = await this.query<{ deleteGroup: MutationResponse }>(DELETE_GROUP, { groupId })
    return deleteGroup
  }

  async getRoleById (roleId: string) {
    const { roles } = await this.query<{ roles: FullRole[] }>(GET_ROLE_BY_ID, { roleId })
    return roles[0]
  }

  async editRole (roleId: string, name: string, validateOnly?: boolean) {
    const { updateRole } = await this.query<{ updateRole: MutationResponse & { role: RoleListRole } }>(UPDATE_ROLE, { roleId, name, validateOnly })
    return updateRole
  }

  async getSiteList (viewForEdit?: boolean) {
    const { sites } = await this.query<{ sites: SiteListSite[] }>(GET_SITE_LIST, { viewForEdit })
    return sites
  }

  async getSiteAudit () {
    const { sites } = await this.query<{ sites: SiteAuditSite[] }>(GET_SITE_AUDIT)
    return sites
  }

  async getSiteById (siteId: string) {
    const { sites } = await this.query<{ sites: FullSite[] }>(GET_SITE_BY_ID, { siteId })
    return sites[0]
  }

  async addSite (name: string, templateKey: string, data: any, validateOnly?: boolean) {
    const resp = validateRequired<{ site: undefined }>({ name, templateKey, data }, ['name', 'templateKey'])
    if (resp) return resp
    const pageData = Object.assign({}, data, { templateKey, savedAtVersion: schemaVersion })
    const { createSite } = await this.query<{ createSite: MutationResponse & { site: SiteListSite } }>(ADD_SITE, { name, data: pageData, validateOnly })
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

  async addPagetree (siteId: string, templateKey: string, data: any, validateOnly?: boolean) {
    const resp = validateRequired<{ pagetree: undefined }>({ templateKey, data }, ['templateKey'])
    if (resp) return resp
    const pageData = Object.assign({}, data, { templateKey, savedAtVersion: schemaVersion })
    const { createPagetree } = await this.query<{ createPagetree: MutationResponse & { pagetree: SitePagetree } }>(ADD_PAGETREE, { siteId, data: pageData, validateOnly })
    return createPagetree
  }

  async updatePagetree (pagetreeId: string, name: string, validateOnly?: boolean) {
    const { updatePagetree } = await this.query<{ updatePagetree: MutationResponse & { pagetree: SitePagetree } }>(UPDATE_PAGETREE, { pagetreeId, name, validateOnly })
    return updatePagetree
  }

  async deletePagetree (pagetreeId: string) {
    const { deletePagetree } = await this.query<{ deletePagetree: MutationResponse & { pagetree: SitePagetree } }>(DELETE_PAGETREE, { pagetreeId })
    return deletePagetree
  }

  async promotePagetree (pagetreeId: string) {
    const { promotePagetree } = await this.query<{ promotePagetree: MutationResponse & { pagetree: SitePagetree } }>(PROMOTE_PAGETREE, { pagetreeId })
    return promotePagetree
  }

  async archivePagetree (pagetreeId: string) {
    const { archivePagetree } = await this.query<{ archivePagetree: MutationResponse & { pagetree: SitePagetree } }>(ARCHIVE_PAGETREE, { pagetreeId })
    return archivePagetree
  }

  async setLaunchURL (siteId: string, host?: string, path?: string, enabled?: LaunchState, validateOnly?: boolean) {
    let enabledParam: string
    if (enabled === LaunchState.LAUNCHED) {
      enabledParam = 'LAUNCHED'
    } else if (enabled === LaunchState.DECOMMISSIONED) {
      enabledParam = 'DECOMMISSIONED'
    } else {
      enabledParam = 'PRELAUNCH'
    }
    const { setLaunchURL } = await this.query<{ setLaunchURL: MutationResponse & { site: FullSite } }>(SET_LAUNCH_URL, { siteId, host, path, enabled: enabledParam, validateOnly })
    return setLaunchURL
  }

  async addAssetRule (args: CreateAssetRuleInput, validateOnly?: boolean) {
    const { createAssetRule } = await this.query<{ createAssetRule: MutationResponse & { assetRule: AssetRule } }>(ADD_ASSET_RULE, { args, validateOnly })
    return createAssetRule
  }

  async editAssetRule (args: UpdateAssetRuleInput, validateOnly?: boolean) {
    const { updateAssetRule } = await this.query<{ updateAssetRule: MutationResponse & { assetRule: AssetRule } }>(UPDATE_ASSET_RULE, { args, validateOnly })
    return updateAssetRule
  }

  async addDataRule (args: CreateDataRuleInput, validateOnly?: boolean) {
    const { createDataRule } = await this.query<{ createDataRule: MutationResponse & { dataRule: DataRule } }>(ADD_DATA_RULE, { args, validateOnly })
    return createDataRule
  }

  async editDataRule (args: UpdateDataRuleInput, validateOnly?: boolean) {
    const { updateDataRule } = await this.query<{ updateDataRule: MutationResponse & { dataRule: DataRule } }>(UPDATE_DATA_RULE, { args, validateOnly })
    return updateDataRule
  }

  async addGlobalRule (args: CreateGlobalRuleInput, validateOnly?: boolean) {
    const { createGlobalRule } = await this.query<{ createGlobalRule: MutationResponse & { globalRule: GlobalRule } }>(ADD_GLOBAL_RULE, { args, validateOnly })
    return createGlobalRule
  }

  async editGlobalRule (args: UpdateGlobalRuleInput, validateOnly?: boolean) {
    const { updateGlobalRule } = await this.query<{ updateGlobalRule: MutationResponse & { globalRule: GlobalRule } }>(UPDATE_GLOBAL_RULE, { args, validateOnly })
    return updateGlobalRule
  }

  async addPageRule (args: CreatePageRuleInput, validateOnly?: boolean) {
    const { createPageRule } = await this.query<{ createPageRule: MutationResponse & { pageRule: PageRule } }>(ADD_PAGE_RULE, { args, validateOnly })
    return createPageRule
  }

  async editPageRule (args: UpdatePageRuleInput, validateOnly?: boolean) {
    const { updatePageRule } = await this.query<{ updatePageRule: MutationResponse & { pageRule: PageRule } }>(UPDATE_PAGE_RULE, { args, validateOnly })
    return updatePageRule
  }

  async addSiteRule (args: CreateSiteRuleInput, validateOnly?: boolean) {
    const { createSiteRule } = await this.query<{ createSiteRule: MutationResponse & { siteRule: SiteRule } }>(ADD_SITE_RULE, { args, validateOnly })
    return createSiteRule
  }

  async editSiteRule (args: UpdateSiteRuleInput, validateOnly?: boolean) {
    const { updateSiteRule } = await this.query<{ updateSiteRule: MutationResponse & { siteRule: SiteRule } }>(UPDATE_SITE_RULE, { args, validateOnly })
    return updateSiteRule
  }

  async addTemplateRule (args: CreateTemplateRuleInput, validateOnly?: boolean) {
    const { createTemplateRule } = await this.query<{ createTemplateRule: MutationResponse & { templateRule: TemplateRule } }>(ADD_TEMPLATE_RULE, { args, validateOnly })
    return createTemplateRule
  }

  async editTemplateRule (args: UpdateTemplateRuleInput, validateOnly?: boolean) {
    const { updateTemplateRule } = await this.query<{ updateTemplateRule: MutationResponse & { templateRule: TemplateRule } }>(UPDATE_TEMPLATE_RULE, { args, validateOnly })
    return updateTemplateRule
  }

  async removeRule (ruleId: string, type: 'GLOBAL' | 'SITE' | 'PAGE' | 'TEMPLATE' | 'ASSET' | 'DATA') {
    const { removeRule } = await this.query<{ removeRule: MutationResponse }>(REMOVE_RULE, { ruleId, type })
    return removeRule
  }

  async getOrganizationList () {
    const { organizations } = await this.query<{ organizations: Organization[] }>(GET_ORGANIZATION_LIST)
    return organizations
  }

  async createPage (name: string, templateKey: string, data: any, targetId: string, above: boolean, validateOnly?: boolean) {
    const resp = validateRequired<{ page: undefined }>({ name, templateKey, data }, ['name', 'templateKey'])
    if (resp) return resp
    const pageData = Object.assign({}, data, { templateKey, savedAtVersion: schemaVersion })
    const { createPage } = await this.query<{ createPage: MutationResponse & { page: PageEditorPage } }>(CREATE_PAGE, { name, data: pageData, targetId, validateOnly })
    return createPage
  }

  async renamePage (pageId: string, name: string, validateOnly?: boolean) {
    const resp = validateRequired<{ page: undefined }>({ name }, ['name'])
    if (resp) return resp
    const { renamePage } = await this.query<{ renamePage: MutationResponse & { page: PageEditorPage } }>(RENAME_PAGE, { pageId, name, validateOnly })
    return renamePage
  }

  async movePages (pageIds: string[], targetId: string, above: boolean) {
    const { movePages } = await this.query<{ movePages: MutationResponse }>(MOVE_PAGES, { pageIds, targetId, above })
    return movePages.success
  }

  async copyPages (pageIds: string[], targetId: string, above: boolean, recursive: boolean = false) {
    const { copyPages } = await this.query<{ copyPages: MutationResponse }>(COPY_PAGES, { pageIds, targetId, above, includeChildren: recursive })
    return copyPages.success
  }

  async duplicatePage (pageId: string, parentId: string) {
    const { copyPages } = await this.query<{ copyPages: MutationResponse }>(COPY_PAGES, { pageIds: [pageId], targetId: parentId, above: false, includeChildren: true })
    return copyPages
  }

  async pastePage (pageId: string, targetId: string) {
    const { copyPages } = await this.query<{ copyPages: MutationResponse }>(COPY_PAGES, { pageIds: [pageId], targetId, above: false, includeChildren: false })
    return copyPages
  }

  async publishPages (pageIds: string[], includeChildren: boolean) {
    const { publishPages } = await this.query<{ publishPages: MutationResponse }>(PUBLISH_PAGES, { pageIds, includeChildren })
    return publishPages
  }

  async unpublishPages (pageIds: string[]) {
    const { unpublishPages } = await this.query<{ unpublishPages: MutationResponse }>(UNPUBLISH_PAGES, { pageIds })
    return unpublishPages
  }

  async getDeletePageCount (pageIds: string[]) {
    const { pages } = await this.query<{ pages: PageWithDescendants[] }>(GET_PAGES_AND_DESCENDANTS, { pageIds })
    const ids: string[] = []
    for (const p of pages) {
      ids.push(p.id)
      ids.push(...p.children.map(c => c.id))
    }
    return unique(ids).length
  }

  async deletePages (pageIds: string[]) {
    const { deletePages } = await this.query<{ deletePages: MutationResponse & { pages: PageEditorPage } }>(DELETE_PAGES, { pageIds })
    return deletePages
  }

  async publishDeletion (pageIds: string[]) {
    const { publishPageDeletions } = await this.query<{ publishPageDeletions: MutationResponse & { pages: PageEditorPage } }>(PUBLISH_DELETION, { pageIds })
    return publishPageDeletions
  }

  async undeletePages (pageIds: string[], includeChildren = false) {
    const { undeletePages } = await this.query<{ undeletePages: MutationResponse & { pages: PageEditorPage } }>(UNDELETE_PAGES, { pageIds, includeChildren })
    return undeletePages
  }

  async createComponent (pageId: string, dataVersion: number, page: PageData, path: string, data: ComponentData, opts?: { isCopy?: boolean, validateOnly?: boolean, comment?: string, addToTop?: boolean }) {
    const { isCopy, validateOnly, comment, addToTop } = opts ?? {}
    const { createPageComponent } = await this.query<CreateComponentResponse>(CREATE_COMPONENT, { pageId, data, dataVersion, schemaversion: page.savedAtVersion, path, isCopy, validateOnly, comment, addToTop })
    const area = get<any[]>(page, path) ?? []
    const pathIsTargeted = !isNaN(Number(path.split('.').slice(-1)[0]))
    const finalPath = path + (pathIsTargeted ? '' : `.${area.length}`)
    const msgPrefix = `data.${finalPath}`
    return {
      ...createPageComponent,
      messages: messageForDialog(createPageComponent.messages, msgPrefix),
      data: validateOnly || !createPageComponent.success ? data : get(createPageComponent.page, msgPrefix)
    }
  }

  async editComponent (pageId: string, dataVersion: number, page: PageData, path: string, data: ComponentData, opts?: { validateOnly?: boolean, comment?: string }) {
    const { validateOnly, comment } = opts ?? {}
    const { updatePageComponent } = await this.query<EditComponentResponse>(EDIT_COMPONENT, { pageId, data, dataVersion, schemaversion: page.savedAtVersion, path, validateOnly, comment })
    const msgPrefix = `data.${path}`
    return {
      ...updatePageComponent,
      messages: messageForDialog(updatePageComponent.messages, msgPrefix),
      data: validateOnly || !updatePageComponent.success ? data : get(updatePageComponent.page.data, path)
    }
  }

  async changeTemplate (pageId: string, templateKey: string, opts?: { validateOnly?: boolean, comment?: string }) {
    const { validateOnly, comment } = opts ?? {}
    const { changePageTemplate } = await this.query<ChangeTemplateResponse>(CHANGE_PAGE_TEMPLATE, { pageId, templateKey, comment, validateOnly })
    return {
      ...changePageTemplate,
      messages: [],
      data: changePageTemplate.page.data
    }
  }

  async moveComponent (pageId: string, dataVersion: number, page: PageData, fromPath: string, toPath: string) {
    const { movePageComponent } = await this.query<MoveComponentResponse>(MOVE_COMPONENT, { pageId, schemaversion: page.savedAtVersion, dataVersion, fromPath, toPath })
    return movePageComponent
  }

  async insertComponent (pageId: string, dataVersion: number, pageData: PageData, to: string, componentData: ComponentData) {
    const ret = await this.createComponent(pageId, dataVersion, pageData, to, componentData, { isCopy: true })
    if (!ret.success) toast(ret.messages.find(m => m.type === 'error')!.message)
    return ret
  }

  async removeComponent (pageId: string, dataVersion: number, page: PageData, path: string, opts?: { comment?: string }) {
    const { comment } = opts ?? {}
    const { deletePageComponent } = await this.query<RemoveComponentResponse>(REMOVE_COMPONENT, { pageId, path, dataVersion, schemaversion: page.savedAtVersion, comment })
    return deletePageComponent
  }

  async editPageProperties (pageId: string, dataVersion: number, page: PageData, opts?: { validateOnly?: boolean, comment?: string }) {
    const { validateOnly, comment } = opts ?? {}
    const { updatePageProperties } = await this.query<EditPagePropertiesResponse>(EDIT_PAGE_PROPERTIES, { pageId, data: page, dataVersion, schemaversion: page.savedAtVersion, validateOnly, comment })
    return {
      ...updatePageProperties,
      messages: updatePageProperties.messages.map(m => ({ type: m.type, message: m.message, path: m.arg })),
      data: validateOnly || !updatePageProperties.success ? page : updatePageProperties.page.data
    }
  }

  async getPagetreePages (pagetreeId: string) {
    const { pages } = await this.query<{ pages: PageAuditPage[] }>(GET_PAGETREE_PAGES_FOR_AUDIT, { pagetreeId })
    return pages
  }

  async getPagetreeContext (id: string) {
    const { pagetrees } = await this.query<{ pagetrees: { name: string, site: { id: string, name: string } }[] }>('query getPagetreeName ($id: ID!) { pagetrees (filter: {ids:[$id]}) { name site { id name } } }', { id })
    return pagetrees[0]
  }

  async getPageVersions (pageId: string): Promise<HistoryVersion[]> {
    const { pages } = await this.query<{ pages: [{ version: VersionDetails, versions: VersionDetails[] }] }>(GET_PAGE_VERSIONS, { pageId })
    const page = pages[0]
    if (!page) return []
    return [page.version, ...page.versions].map(v => ({ ...v, date: DateTime.fromISO(v.date), markedAt: v.markedAt ? DateTime.fromISO(v.markedAt) : undefined }))
  }

  async restorePage (pageId: string, version: number, validateOnly?: boolean) {
    const { restorePage } = await this.query<{ restorePage: MutationResponse & { page: PageEditorPage } }>(`
      mutation restorePage ($pageId: ID!, $version: Int!, $validateOnly: Boolean) { restorePage (pageId: $pageId, restoreVersion: $version, validateOnly: $validateOnly) { success messages { type message arg } page { ${EDITOR_PAGE_DETAILS} } } }
    `, { pageId, version, validateOnly })
    return restorePage
  }

  async markVersion (dataId: string, version: number) {
    const { versionToggleMarked: { version: v } } = await this.query<{ versionToggleMarked: { version: VersionDetails } }>(`
      mutation versionToggleMarked ($dataId: ID!, $version: Int!) { versionToggleMarked (dataId: $dataId, version: $version) { version { ${VERSION_DETAILS} } } }
    `, { dataId, version })
    return { ...v, date: DateTime.fromISO(v.date), markedAt: v.markedAt ? DateTime.fromISO(v.markedAt) : undefined }
  }

  async updateAssetMeta (assetId: string, data: any, validateOnly?: boolean) {
    const { updateAsset } = await this.query<{ updateAsset: MutationResponse }>(`
      mutation updateAssetMeta ($assetId: ID!, $data: JsonData!, $validateOnly: Boolean) { updateAsset (assetId: $assetId, data: $data, validateOnly: $validateOnly) { success messages { message type arg } } }
    `, { assetId, data, validateOnly })
    return { ...updateAsset, messages: messageForDialog(updateAsset.messages, 'meta.'), data }
  }

  async getUserTagsForPage (pageId: string, includeDisabled?: boolean, includeInternal?: boolean) {
    const { pages } = await this.query<{ pages: { userTags: { id: string, name: string }[] }[] }>(`
      query getUserTagsForPage ($pageId: ID!, $includeDisabled: Boolean, $includeInternal: Boolean) { pages (filter: { ids: [$pageId] }) {
        userTags (includeDisabled: $includeDisabled, includeInternal: $includeInternal) {
          id
          name
        }
      } }
    `, { pageId, includeDisabled, includeInternal })
    return pages[0]?.userTags.map(t => t.id)
  }

  async getAvailableTagsForLink (link: string | PageLink, pagetreeId?: string) {
    const pageLink: PageLink = typeof link === 'string' ? JSON.parse(link) : link
    const { pages } = await this.query<{ pages: { site: { id: string } }[] }>(`
      query getPageIdByLink ($pageLink: PageLinkInput!) { pages (filter: { links: [$pageLink] }) {
        site { id }
      } }
    `, { pageLink: { ...pick(pageLink, 'linkId', 'siteId', 'path'), context: pagetreeId ? { pagetreeId } : undefined } })
    return await this.getAvailableTags(pages[0]?.site.id)
  }

  async getAvailableTags (siteId?: string): Promise<(TagGroup & { internal: boolean })[]> {
    const { globalGroups, siteGroups } = await this.query<{ globalGroups: { id: string, data: { title: string, excludeTitle?: boolean, disabled?: boolean, internal?: boolean, tags: { id: string, name: string, disabled?: boolean }[] } }[], siteGroups: { id: string, data: { title: string, excludeTitle?: boolean, disabled?: boolean, internal?: boolean, tags: { id: string, name: string, disabled?: boolean }[] } }[] }>(`
      query getAvailableTags ($siteId: ID!) {
        globalGroups: data (filter: { templateKeys: ["dosgato-core-tags"], global: true, deleteStates: [NOTDELETED] }) {
          id
          data (published: true)
        }
        siteGroups: data (filter: { templateKeys: ["dosgato-core-tags"], siteIds: [$siteId], deleteStates: [NOTDELETED] }) {
          id
          data (published: true)
        }
      }
    `, { siteId: siteId ?? '' })
    return globalGroups.concat(siteGroups).filter(g => !g.data.disabled).map(g => ({ id: g.id, title: g.data.title, excludeTitle: g.data.excludeTitle, internal: !!g.data.internal, tags: g.data.tags.filter(t => !t.disabled).map(t => ({ ...pick(t, 'id', 'name') })) }))
  }

  async setUserTags (pageId: string, tagIds: string[]) {
    const { replaceTagsOnPage } = await this.query<{ replaceTagsOnPage: { success: boolean } }>(`
      mutation replaceTagsOnPage ($pageId: ID!, $tagIds: [ID!]!) {
        replaceTagsOnPage(pageId: $pageId, tagIds: $tagIds) { success }
      }
    `, { pageId, tagIds })
    return replaceTagsOnPage.success
  }
}

export const api = new API()
if (typeof window !== 'undefined') (window as any).api = api
