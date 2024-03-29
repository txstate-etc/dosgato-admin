import { accessDetailRules, type AccessDetailAssetRule, type AccessDetailDataRule, type AccessDetailPageRule, type AccessDetailSiteRule, LaunchState } from '$lib'
import { mutationResponse } from './global'

export const commentDetails = `
  id
  comment
  createdBy {
    id
  }
  createdAt
`

export interface SiteComment {
  id: string
  comment: string
  createdBy: {
    id: string
  }
  createdAt: string
}

export const sitePagetreeDetails = `
  id
  name
  type
  pageTemplates: templates(filter: {types: [PAGE], universal: false}) {
    key
    name
    type
    universal
    permissions {
      assign
    }
  }
  componentTemplates: templates(filter: {types: [COMPONENT], universal: false}) {
    key
    name
    type
    universal
    permissions {
      assign
    }
  }
  permissions {
    rename
    delete
    undelete
    promote
    archive
  }
`

export interface SitePagetree {
  id: string
  name: string
  type: string
  pageTemplates: {
    key: string
    name: string
    type: string
    universal: boolean
    permissions: {
      assign: boolean
    }
  }[]
  componentTemplates: {
    key: string
    name: string
    type: string
    universal: boolean
    permissions: {
      assign: boolean
    }
  }[]
  permissions: {
    rename: boolean
    delete: boolean
    undelete: boolean
    promote: boolean
    archive: boolean
  }
}

export const siteDetails = `
  id
  name
  url {
    host
    path
    prefix
    enabled
  }
  launchState
  organization {
    name
    id
  }
  owner {
    id
    name
  }
  deleted
  permissions {
    delete
    undelete
  }
`

export interface SiteListSite {
  id: string
  name: string
  url: {
    host: string
    path: string
    prefix: string
    enabled: LaunchState
  }
  launchState: LaunchState
  organization: {
    name: string
  }
  owner: {
    id: string
    name: string
  }
  deleted: boolean
  permissions: {
    delete: boolean
    undelete: boolean
  }
}

export const fullSiteDetails = `
  id
  name
  url {
    host
    path
    prefix
    enabled
  }
  launchState
  organization {
    id
    name
  }
  owner {
    id
    name
  }
  managers {
    id
    name
  }
  pagetrees {
    ${sitePagetreeDetails}
  }
  pageTemplates: templates(filter: {types: [PAGE], universal: false}) {
    key
    name
    type
    universal
    permissions {
      assign
    }
  }
  componentTemplates: templates(filter: {types: [COMPONENT], universal: false}) {
    key
    name
    type
    universal
    permissions {
      assign
    }
  }
  comments {
    ${commentDetails}
  }
  roles {
    id
    name
    groups {
      id
      name
    }
    users {
      id
      name
      firstname
      lastname
      disabled
    }
    ${accessDetailRules}
  }
  permissions {
    rename
    launch
    manageGovernance
    delete
    undelete
    manageState
  }
`

export interface FullSite {
  id: string
  name: string
  url: {
    host: string
    path: string
    prefix: string
    enabled: LaunchState
  }
  launchState: LaunchState
  organization: {
    name: string
    id: string
  }
  owner: {
    id: string
    name: string
  }
  managers: {
    id: string
    name: string
  }[]
  pagetrees: SitePagetree[]
  pageTemplates: {
    key: string
    name: string
    type: string
    universal: boolean
    permissions: {
      assign: boolean
    }
  }[]
  componentTemplates: {
    key: string
    name: string
    type: string
    universal: boolean
    permissions: {
      assign: boolean
    }
  }[]
  comments: SiteComment[]
  roles: {
    id: string
    name: string
    groups: {
      id: string
      name: string
    }[]
    users: {
      id: string
      name: string
      firstname: string
      lastname: string
      disabled: boolean
    }[]
    siteRules: AccessDetailSiteRule[]
    pageRules: AccessDetailPageRule[]
    dataRules: AccessDetailDataRule[]
    assetRules: AccessDetailAssetRule[]
  }[]
  permissions: {
    rename: boolean
    launch: boolean
    manageGovernance: boolean
    delete: boolean
    undelete: boolean
    manageState: boolean
  }
}

export const GET_SITE_LIST = `
  query getAllSites ($viewForEdit: Boolean) {
    sites (filter: { viewForEdit: $viewForEdit }) {
      ${siteDetails}
    }
  }
`

export const GET_SITE_BY_ID = `
  query getSiteById ($siteId: ID!) {
    sites (filter: { ids: [$siteId]}) {
      ${fullSiteDetails}
    }
  }
`

export const ADD_SITE = `
  mutation createSite ($name: UrlSafeString!, $data: JsonData!, $validateOnly: Boolean) {
    createSite (name: $name, data: $data, validateOnly: $validateOnly) {
      ${mutationResponse}
      site {
        ${siteDetails}
      }
    }
  }
`

export const RENAME_SITE = `
  mutation renameSite ($siteId: ID!, $name: UrlSafeString!, $validateOnly: Boolean) {
    renameSite (siteId: $siteId, name: $name, validateOnly: $validateOnly) {
      ${mutationResponse}
      site {
        ${siteDetails}
      }
    }
  }
`

export const DELETE_SITE = `
  mutation deleteSite ($siteId: ID!) {
    deleteSite (siteId: $siteId) {
      ${mutationResponse}
      site {
        ${siteDetails}
      }
    }
  }
`

export const UNDELETE_SITE = `
  mutation undeleteSite ($siteId: ID!) {
    undeleteSite (siteId: $siteId) {
      ${mutationResponse}
      site {
        ${siteDetails}
      }
    }
  }
`

export const UPDATE_SITE_MANAGEMENT = `
  mutation updateSiteManagement ($siteId: ID!, $args: UpdateSiteManagementInput!, $validateOnly: Boolean) {
    updateSiteManagement (siteId: $siteId, args: $args, validateOnly: $validateOnly) {
      ${mutationResponse}
      site {
        ${siteDetails}
      }
    }
  }
`

export const SET_LAUNCH_URL = `
  mutation setLaunchURL ($siteId: ID!, $host: String, $path: String, $enabled: LaunchState, $validateOnly: Boolean) {
    setLaunchURL (siteId: $siteId, host: $host, path: $path, enabled: $enabled, validateOnly: $validateOnly) {
      ${mutationResponse}
      site {
        ${siteDetails}
      }
    }
  }
`

export const ADD_SITE_COMMENT = `
  mutation createSiteComment ($siteId: ID!, $comment: String!) {
    createSiteComment (siteId: $siteId, comment: $comment) {
      ${mutationResponse}
      comment: siteComment {
        ${commentDetails}
      }
    }
  }
`

export const ADD_PAGETREE = `
  mutation createPagetree ($siteId: ID!, $data: JsonData!, $validateOnly: Boolean) {
    createPagetree (siteId: $siteId, data: $data, validateOnly: $validateOnly) {
      ${mutationResponse}
      pagetree {
        ${sitePagetreeDetails}
      }
    }
  }
`

export const UPDATE_PAGETREE = `
  mutation updatePagetree ($pagetreeId: ID!, $name: UrlSafeString!, $validateOnly: Boolean) {
    updatePagetree (pagetreeId: $pagetreeId, name: $name, validateOnly: $validateOnly) {
      ${mutationResponse}
      pagetree {
        ${sitePagetreeDetails}
      }
    }
  }
`

export const DELETE_PAGETREE = `
  mutation deletePagetree ($pagetreeId: ID!) {
    deletePagetree (pagetreeId: $pagetreeId) {
      ${mutationResponse}
      pagetree {
        ${sitePagetreeDetails}
      }
    }
  }
`

export const PROMOTE_PAGETREE = `
  mutation promotePagetree ($pagetreeId: ID!) {
    promotePagetree (pagetreeId: $pagetreeId) {
      ${mutationResponse}
      pagetree {
        ${sitePagetreeDetails}
      }
    }
  }
`

export const ARCHIVE_PAGETREE = `
  mutation archivePagetree ($pagetreeId: ID!) {
    archivePagetree (pagetreeId: $pagetreeId) {
      ${mutationResponse}
      pagetree {
        ${sitePagetreeDetails}
      }
    }
  }
`

export interface SiteAuditSite {
  id: string
  name: string
  roles: {
    id: string
    name: string
    users: {
      id: string
      name: string
    }[]
    pageRules: {
      site?: {
        id: string
        name: string
      }
      pagetreeType: string
      grants?: {
        viewForEdit: boolean
      }
    }[]
    assetRules: {
      site?: {
        id: string
        name: string
      }
      pagetreeType: string
      grants?: {
        viewForEdit: boolean
      }
    }[]
  }[]
  pagetrees: {
    id: string
    name: string
    type: string
    rootPage: {
      title?: string
      template?: {
        name: string
      }
    }
  }[]
  launched: boolean
  url?: {
    prefix: string
  }
  launchState: LaunchState
  organization?: {
    name: string
  }
  owner?: {
    id: string
    name: string
    email: string
  }
  managers: {
    id: string
    name: string
    email: string
  }[]
}

export const GET_SITE_AUDIT = `
  query getSiteListForAudit {
    sites {
      id
      name
      roles {
        id
        name
        users {
          id
          name
        }
        pageRules {
          site {
            id
            name
          }
          pagetreeType
          grants {
            viewForEdit
          }
        }
        assetRules {
          site {
            id
            name
          }
          pagetreeType
          grants {
            viewForEdit
          }
        }
      }
      pagetrees {
        id
        name
        type
        rootPage {
          title
          template {
            name
          }
        }
      }
      launched
      url {
        prefix
      }
      launchState
      organization {
        name
      }
      owner {
        id
        name
        email
      }
      managers {
        id
        name
        email
      }
    }
  }
`

export interface PageAuditPage {
  id: string
  path: string
  template?: {
    name: string
  }
  title?: string
  published: boolean
  modifiedAt: string
  modifiedBy: {
    id: string
  }
}

export const GET_PAGETREE_PAGES_FOR_AUDIT = `
  query getPagetreePagesForAudit ($pagetreeId: ID!) {
    pages (filter:{ pagetreeIds: [$pagetreeId] }) {
      id
      path
      template {
        name
      }
      title
      published
      modifiedAt
      modifiedBy {
        id
      }
    }
  }
`
