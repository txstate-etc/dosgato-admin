import { mutationResponse } from './global'
import { accessDetailRules, type AccessDetailPageRule, type AccessDetailSiteRule, type AccessDetailDataRule, type AccessDetailAssetRule } from './rules'

const groupDetails = `
  id
  name
  roles(direct: true) {
    id
    name
  }
  users {
    id
  }
  subgroups(recursive: false) {
    id
  }
  permissions {
    manageUsers
    manageGroups
  }
`
export interface GroupListGroup {
  id: string
  name: string
  roles: {
    id: string
    name: string
  }[]
  users: {
    id: string
  }[]
  subgroups: {
    id: string
  }[]
  permissions: {
    manageUsers: boolean
    manageGroups: boolean
  }
}

const fullGroupDetails = `
  id
  name
  subgroups: subgroups {
    id
    name
    parents: supergroups(recursive: false) {
      id
      name
    }
  }
  directMembers: users(direct: true) {
    id
    firstname
    lastname
    name
    disabled
  }
  indirectMembers: users(direct: false) {
    id
    firstname
    lastname
    name
    disabled
    groups(direct: true) {
      id
      name
    }
  }
  supergroups {
    id
    name
  }
  directRoles: roles (direct: true) {
    id
    name
    ${accessDetailRules}
  }
  rolesThroughParentGroup: roles (direct: false) {
    id
    name
    ${accessDetailRules}
    groups(direct: true) {
      id
      name
    }
  }
`
export interface FullGroup {
  id: string
  name: string
  subgroups: {
    id: string
    name: string
    parents: {
      id: string
      name: string
    }[]
  }[]
  directMembers: {
    id: string
    firstname: string
    lastname: string
    name: string
    disabled: boolean
  }[]
  indirectMembers: {
    id: string
    firstname: string
    lastname: string
    name: string
    disabled: boolean
    groups: {
      id: string
      name: string
    }[]
  }[]
  supergroups: {
    id: string
    name: string
  }[]
  directRoles: {
    id: string
    name: string
    siteRules: AccessDetailSiteRule[]
    pageRules: AccessDetailPageRule[]
    dataRules: AccessDetailDataRule[]
    assetRules: AccessDetailAssetRule[]
  }[]
  rolesThroughParentGroup: {
    id: string
    name: string
    siteRules: AccessDetailSiteRule[]
    pageRules: AccessDetailPageRule[]
    dataRules: AccessDetailDataRule[]
    assetRules: AccessDetailAssetRule[]
    groups: {
      id: string
      name: string
    }[]
  }[]
}

export const GET_ALL_GROUPS = `
  query getAllGroups {
    groups {
      ${groupDetails}
    }
  }
`

export const GET_ROOT_GROUPS = `
  query getRootGroups {
    groups(filter: {root: true }) {
      ${groupDetails}
    }
  }
`

export const GET_SUBGROUPS = `
  query getSubgroups($ids: [ID!]!) {
    groups (filter: { ids: $ids}) {
      id
      subgroups(recursive: false) {
        ${groupDetails}
      }
    }
  }
`

export const GET_GROUP_BY_ID = `
query getGroupById ($groupId: ID!) {
  groups (filter: { ids: [$groupId]}) {
    ${fullGroupDetails}
  }
}
`

export const CREATE_GROUP = `
  mutation createGroup ($name: String!, $parentId: ID, $validateOnly: Boolean) {
    createGroup (name: $name, parentId: $parentId, validateOnly: $validateOnly) {
      ${mutationResponse}
      group {
        ${groupDetails}
      }
    }
  }
`

export const UPDATE_GROUP = `
  mutation updateGroup ($groupId: ID!, $name: String!, $validateOnly: Boolean) {
    updateGroup (groupId: $groupId, name: $name, validateOnly: $validateOnly) {
      ${mutationResponse}
      group {
        ${groupDetails}
      }
    }
  }
`

export const DELETE_GROUP = `
  mutation deleteGroup ($groupId: ID!) {
    deleteGroup (groupId: $groupId) {
      ${mutationResponse}
    }
  }
`
