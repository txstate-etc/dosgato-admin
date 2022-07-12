export const assetRuleDetails = `
  id
  mode
  path
  permissions {
    write
  }
  role {
    id
    name
  }
  site {
    id
    name
  }
  type
  grants {
    create
    delete
    move
    undelete
    update
    view
    viewForEdit
  }
`

export interface AssetRule {
  id: string
  mode: string // TODO: use enum here?
  path: string
  permissions: {
    write: boolean
  }
  role: {
    id: string
    name: string
  }
  site: {
    id: string
    name: string
  }
  type: string // TODO: use enum here?
  grants: {
    create: boolean
    delete: boolean
    move: boolean
    undelete: boolean
    update: boolean
    view: boolean
    viewForEdit: boolean
  }
}

export const dataRuleDetails = `
  id
  path
  permissions {
    write
  }
  role {
    id
    name
  }
  site {
    id
    name
  }
  template {
    key
    name
  }
  type
  grants {
    create
    delete
    move
    publish
    unpublish
    undelete
    update
    view
    viewForEdit
    viewlatest
  }
`

export interface DataRule {
  id: string
  path: string
  permissions: {
    write: boolean
  }
  role: {
    id: string
    name: string
  }
  site: {
    id: string
    name: string
  }
  template: {
    key: string
    name: string
  }
  type: string
  grants: {
    create: boolean
    delete: boolean
    move: boolean
    publish: boolean
    unpublish: boolean
    undelete: boolean
    update: boolean
    view: boolean
    viewForEdit: boolean
    viewlatest: boolean
  }
}

export const globalRuleDetails = `
  id
  permissions {
    write
  }
  role {
    id
    name
  }
  type
  grants {
    createSites
    manageGlobalData
    manageUsers
  }
`

export interface GlobalRule {
  id: string
  permissions: {
    write: boolean
  }
  role: {
    id: string
    name: string
  }
  type: string
  grants: {
    createSites: boolean
    manageGlobalData: boolean
    manageUsers: boolean
  }
}

export const pageRuleDetails = `
  id
  mode
  pagetreeType
  path
  permissions {
    write
  }
  role {
    id
    name
  }
  site {
    id
    name
  }
  type
  grants {
    create
    delete
    move
    publish
    undelete
    unpublish
    update
    view
    viewForEdit
    viewlatest
  }
`

export interface PageRule {
  id: string
  mode: string
  pagetreeType: string
  path: string
  permissions: {
    write: boolean
  }
  role: {
    id: string
    name: string
  }
  site: {
    id: string
    name: string
  }
  type: string
  grants: {
    create: boolean
    delete: boolean
    move: boolean
    publish: boolean
    undelete: boolean
    unpublish: boolean
    update: boolean
    view: boolean
    viewForEdit: boolean
    viewlatest: boolean
  }
}

export const siteRuleDetails = `
  id
  permissions {
    write
  }
  role {
    id
    name
  }
  site {
    id
    name
  }
  type
  grants {
    delete
    launch
    manageOwners
    managePagetrees
    promotePagetree
    rename
    undelete
    viewForEdit
  }
`

export interface SiteRule {
  id: string
  permissions: {
    write: boolean
  }
  role: {
    id: string
    name: string
  }
  site: {
    id: string
    name: string
  }
  type: string
  grants: {
    delete: boolean
    launch: boolean
    manageOwners: boolean
    managePagetrees: boolean
    promotePagetree: boolean
    rename: boolean
    undelete: boolean
    viewForEdit: boolean
  }
}

export const templateRuleDetails = `
  id
  permissions {
    write
  }
  role {
    id
    name
  }
  template {
    key
    name
  }
  type
  grants {
    use
  }
`

export interface TemplateRule {
  id: string
  permissions: {
    write: boolean
  }
  role: {
    id: string
    name: string
  }
  template: {
    key: string
    name: string
  }
  type: string
  grants: {
    use: boolean
  }
}

export const accessDetailRules = `
  siteRules {
    site {
      id
      name
    }
    type
    grants {
      viewForEdit
    }
  }
  pageRules {
    site {
      id
      name
    }
    pagetreeType
    grants {
      viewlatest
      viewForEdit
      publish
    }
  }
`

export interface AccessDetailSiteRule {
  site: {
    id: string
    name: string
  }
  grants: {
    viewForEdit: boolean
  }
}

export interface AccessDetailPageRule {
  site: {
    id: string
    name: string
  }
  pagetreeType: boolean
  grants: {
    viewlatest: boolean
    viewForEdit: boolean
    publish: boolean
  }
}

export interface CreateAssetRuleInput {
  roleId: string
  siteId?: string
  path?: string
  mode?: 'self'|'sub'|'selfsub'|undefined
  grants?: {
    create: boolean
    update: boolean
    move: boolean
    delete: boolean
    undelete: boolean
  }
}

export interface CreateDataRuleInput {
  roleId: string
  siteId?: string
  templateId?: string
  path?: string
  grants?: {
    create: boolean
    update: boolean
    publish: boolean
    unpublish: boolean
    delete: boolean
    undelete: boolean
  }
}
