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
    name
  }
  usersThroughGroups: users (direct: false) {
    id
    name
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
    name: string
  }[]
  usersThroughGroups: {
    id: string
    name: string
    groups: {
      id: string
      name: string
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

export const REMOVE_RULE = `
  mutation removeRule  ($ruleId: ID!, $type: RuleType!) {
    removeRule (ruleId: $ruleId, type: $type) {
      ${mutationResponse}
    }
  }
`
