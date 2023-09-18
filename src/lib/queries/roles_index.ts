import { assetRuleDetails, dataRuleDetails, globalRuleDetails, pageRuleDetails, siteRuleDetails, templateRuleDetails, type AssetRule, type DataRule, type GlobalRule, type PageRule, type SiteRule, type TemplateRule } from '$lib'
import { mutationResponse } from './global'

const roleDetails = `
  id
  name
  permissions {
    assign
    delete
    rename
    createRules
  }
`

export interface RoleListRole {
  id: string
  name: string
  permissions: {
    assign: boolean
    delete: boolean
    rename: boolean
    createRules: boolean
  }
}

const fullRoleDetails = `
  id
  name
  permissions {
    assign
    delete
    rename
    createRules
  }
  directGroups: groups (direct: true) {
    id
    name
  }
  indirectGroups: groups (direct: false) {
    id
    name
    parents: supergroups(recursive: false) {
      id
      name
    }
  }
  directUsers: users (direct: true) {
    id
    firstname
    lastname
    name
    disabled
  }
  usersThroughGroups: users (direct: false) {
    id
    firstname
    lastname
    name
    disabled
    groups (direct: true) {
      id
      name
    }
  }
  assetRules {
    ${assetRuleDetails}
  }
  dataRules {
    ${dataRuleDetails}
  }
  globalRules {
    ${globalRuleDetails}
  }
  pageRules {
    ${pageRuleDetails}
  }
  siteRules {
    ${siteRuleDetails}
  }
  templateRules {
    ${templateRuleDetails}
  }
`

export interface FullRole {
  id: string
  name: string
  directUsers: {
    id: string
    firstname: string
    lastname: string
    name: string
    disabled: boolean
  }[]
  usersThroughGroups: {
    id: string
    firstname: string
    lastname: string
    name: string
    disabled: boolean
    groups: {
      id: string
      firstname: string
      lastname: string
    }
  }[]
  permissions: {
    assign: boolean
    delete: boolean
    rename: boolean
    createRules: boolean
  }
  directGroups: {
    id: string
    name: string
  }[]
  indirectGroups: {
    id: string
    name: string
    parents: {
      id: string
      name: string
    }[]
  }[]
  assetRules: AssetRule[]
  dataRules: DataRule[]
  globalRules: GlobalRule[]
  pageRules: PageRule[]
  siteRules: SiteRule[]
  templateRules: TemplateRule[]
}

export const GET_ROLE_LIST = `
  query getRoleList {
    roles {
      ${roleDetails}
    }
  }
`

export const GET_ROLE_BY_ID = `
  query getRoleById ($roleId: ID!) {
    roles (filter: { ids: [$roleId]}) {
      ${fullRoleDetails}
    }
  }
`

export const CREATE_ROLE = `
  mutation createRole ($name: UrlSafeString!, $validateOnly: Boolean) {
    createRole (name: $name, validateOnly: $validateOnly) {
      ${mutationResponse}
      role {
        ${roleDetails}
      }
    }
  }
`

export const UPDATE_ROLE = `
  mutation updateRole ($roleId: ID!, $name: UrlSafeString!, $validateOnly: Boolean) {
    updateRole (roleId: $roleId, name: $name, validateOnly: $validateOnly) {
      ${mutationResponse}
      role {
        ${roleDetails}
      }
    }
  }
`

export const DELETE_ROLE = `
  mutation deleteRole ($roleId: ID!) {
    deleteRole (roleId: $roleId) {
      ${mutationResponse}
    }
  }
`

export const ASSIGN_ROLE_TO_USERS = `
  mutation assignRoleToUsers ($roleId: ID!, $userIds: [ID!]!) {
    assignRoleToUsers (roleId: $roleId, userIds: $userIds) {
      ${mutationResponse}
    }
  }
`

export const ADD_ASSET_RULE = `
  mutation createAssetRule ($args: CreateAssetRuleInput!, $validateOnly: Boolean) {
    createAssetRule (args: $args, validateOnly: $validateOnly) {
      ${mutationResponse}
      assetRule {
        ${assetRuleDetails}
      }
    }
  }
`

export const UPDATE_ASSET_RULE = `
  mutation updateAssetRule ($args: UpdateAssetRuleInput!, $validateOnly: Boolean) {
    updateAssetRule (args: $args, validateOnly: $validateOnly) {
      ${mutationResponse}
      assetRule {
        ${assetRuleDetails}
      }
    }
  }
`

export const ADD_DATA_RULE = `
  mutation createDataRule ($args: CreateDataRuleInput!, $validateOnly: Boolean) {
    createDataRule (args: $args, validateOnly: $validateOnly) {
      ${mutationResponse}
      dataRule {
        ${dataRuleDetails}
      }
    }
  }
`

export const UPDATE_DATA_RULE = `
  mutation updateDataRule ($args: UpdateDataRuleInput!, $validateOnly: Boolean) {
    updateDataRule (args: $args, validateOnly: $validateOnly) {
      ${mutationResponse}
      dataRule {
        ${dataRuleDetails}
      }
    }
  }
`

export const ADD_GLOBAL_RULE = `
  mutation createGlobalRule ($args: CreateGlobalRuleInput!, $validateOnly: Boolean) {
    createGlobalRule (args: $args, validateOnly: $validateOnly) {
      ${mutationResponse}
      globalRule {
        ${globalRuleDetails}
      }
    }
  }
`

export const UPDATE_GLOBAL_RULE = `
  mutation updateGlobalRule ($args: UpdateGlobalRuleInput!, $validateOnly: Boolean) {
    updateGlobalRule (args: $args, validateOnly: $validateOnly) {
      ${mutationResponse}
      globalRule {
        ${globalRuleDetails}
      }
    }
  }
`
export const ADD_PAGE_RULE = `
  mutation createPageRule ($args: CreatePageRuleInput!, $validateOnly: Boolean) {
    createPageRule (args: $args, validateOnly: $validateOnly) {
      ${mutationResponse}
      pageRule {
        ${pageRuleDetails}
      }
    }
  }
`

export const UPDATE_PAGE_RULE = `
  mutation updatePageRule ($args: UpdatePageRuleInput!, $validateOnly: Boolean) {
    updatePageRule (args: $args, validateOnly: $validateOnly) {
      ${mutationResponse}
      pageRule {
        ${pageRuleDetails}
      }
    }
  }
`

export const ADD_SITE_RULE = `
  mutation createSiteRule ($args: CreateSiteRuleInput!, $validateOnly: Boolean) {
    createSiteRule (args: $args, validateOnly: $validateOnly) {
      ${mutationResponse}
      siteRule {
        ${siteRuleDetails}
      }
    }
  }
`

export const UPDATE_SITE_RULE = `
  mutation updateSiteRule ($args: UpdateSiteRuleInput!, $validateOnly: Boolean) {
    updateSiteRule (args: $args, validateOnly: $validateOnly) {
      ${mutationResponse}
      siteRule {
        ${siteRuleDetails}
      }
    }
  }
`

export const ADD_TEMPLATE_RULE = `
  mutation createTemplateRule ($args: CreateTemplateRuleInput!, $validateOnly: Boolean) {
    createTemplateRule (args: $args, validateOnly: $validateOnly) {
      ${mutationResponse}
      templateRule {
        ${templateRuleDetails}
      }
    }
  }
`

export const UPDATE_TEMPLATE_RULE = `
  mutation updateTemplateRule ($args: UpdateTemplateRuleInput!, $validateOnly: Boolean) {
    updateTemplateRule (args: $args, validateOnly: $validateOnly) {
      ${mutationResponse}
      templateRule {
        ${templateRuleDetails}
      }
    }
  }
`

export const REMOVE_RULE = `
  mutation removeRule  ($ruleId: ID!, $type: RuleType!) {
    removeRule (ruleId: $ruleId, type: $type) {
      ${mutationResponse}
    }
  }
`
