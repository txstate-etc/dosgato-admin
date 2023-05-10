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
  pagetreeType
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
  pagetreeType: string
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
    manageAccess
    manageParentRoles
    manageTemplates
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
    manageAccess: boolean
    manageParentRoles: boolean
    manageTemplates: boolean
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
    governance
    manageState
    rename
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
    governance: boolean
    manageState: boolean
    rename: boolean
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
  dataRules {
    site {
      id
      name
    }
    grants {
      viewForEdit
    }
  }
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
    path
    pagetreeType
    type
    grants {
      viewlatest
      viewForEdit
      create
      update
      move
      publish
      unpublish
      delete
      view
      undelete
    }
  }
  assetRules {
    site {
      id
      name
    }
    path
    pagetreeType
    type
    grants {
      create
      update
      move
      delete
      view
      undelete
    }
  }
`

export interface AccessDetailSiteRule {
  site?: {
    id: string
    name: string
  }
  type: string
  grants?: {
    viewForEdit: boolean
  }
}

export interface AccessDetailDataRule {
  site?: {
    id: string
    name: string
  }
  grants?: {
    viewForEdit: boolean
  }
}

export interface AccessDetailPageRule {
  site?: {
    id: string
    name: string
  }
  path?: string
  pagetreeType?: string
  type: string
  grants?: {
    viewlatest: boolean
    viewForEdit: boolean
    view: boolean
    create: boolean
    update: boolean
    move: boolean
    publish: boolean
    unpublish: boolean
    delete: boolean
    undelete: boolean
  }
}

export interface AccessDetailAssetRule {
  site?: {
    id: string
    name: string
  }
  path?: string
  pagetreeType?: string
  type: string
  grants?: {
    create: boolean
    update: boolean
    move: boolean
    delete: boolean
    view: boolean
    undelete: boolean
  }
}

export interface CreateAssetRuleInput {
  roleId: string
  siteId?: string
  path?: string
  mode?: string | undefined
  grants?: {
    create: boolean
    update: boolean
    move: boolean
    delete: boolean
    undelete: boolean
  }
}

export interface UpdateAssetRuleInput {
  ruleId: string
  siteId?: string
  path?: string
  mode?: string | undefined
  pagetreeType?: string
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
    move: boolean
    publish: boolean
    unpublish: boolean
    delete: boolean
    undelete: boolean
  }
}

export interface UpdateDataRuleInput {
  ruleId: string
  siteId?: string
  path?: string
  templateId?: string
  grants?: {
    create: boolean
    update: boolean
    move: boolean
    publish: boolean
    unpublish: boolean
    delete: boolean
    undelete: boolean
  }
}

export interface CreateGlobalRuleInput {
  roleId: string
  grants?: {
    manageAccess: boolean
    manageParentRoles: boolean
    createSites: boolean
    manageGlobalData: boolean
    manageTemplates: boolean
  }
}

export interface UpdateGlobalRuleInput {
  ruleId: string
  grants?: {
    manageAccess: boolean
    manageParentRoles: boolean
    createSites: boolean
    manageGlobalData: boolean
    manageTemplates: boolean
  }
}

export interface CreatePageRuleInput {
  roleId: string
  siteId?: string
  pagetreeType?: string
  path?: string
  mode?: string
  grants?: {
    create: boolean
    update: boolean
    move: boolean
    publish: boolean
    unpublish: boolean
    delete: boolean
    undelete: boolean
  }
}

export interface UpdatePageRuleInput {
  ruleId: string
  siteId?: string
  pagetreeType?: string
  path?: string
  mode?: string
  grants?: {
    create: boolean
    update: boolean
    move: boolean
    publish: boolean
    unpublish: boolean
    delete: boolean
    undelete: boolean
  }
}

export interface CreateSiteRuleInput {
  roleId: string
  grants?: {
    launch: boolean
    rename: boolean
    governance: boolean
    manageState: boolean
    delete: boolean
  }
}

export interface UpdateSiteRuleInput {
  ruleId: string
  siteId?: string
  grants?: {
    launch: boolean
    rename: boolean
    governance: boolean
    manageState: boolean
    delete: boolean
  }
}

export interface CreateTemplateRuleInput {
  roleId: string
  templateId?: string
  grants?: {
    use: boolean
  }
}

export interface UpdateTemplateRuleInput {
  ruleId: string
  templateId?: string
  grants?: {
    use: boolean
  }
}
