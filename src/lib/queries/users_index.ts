import { mutationResponse } from './global'
import { accessDetailRules, type AccessDetailPageRule, type AccessDetailSiteRule, type AccessDetailAssetRule, type AccessDetailDataRule } from './rules'

const userDetails = `
id
firstname
lastname
name
email
disabled
trained
roles {
  id
  name
}
permissions {
  disable
  update
}
`

const fullUserDetails = `
  id
  firstname
  lastname
  name
  email
  disabled
  disabledAt
  trained
  system
  lastlogin
  directRoles: roles(direct: true) {
    id
    name
    permissions { assign }
    ${accessDetailRules}
  }
  indirectRoles: roles(direct: false) {
    id
    name
    groups(direct: true) {
      id
      name
    }
    ${accessDetailRules}
  }
  directGroups: groups(direct: true) {
    id
    name
    parents: supergroups(recursive: false) {
      id
      name
    }
  }
  indirectGroups: groups(direct: false) {
    id
    name
    parents: supergroups(recursive: false) {
      id
      name
    }
  }
  sitesOwned {
    id
    name
  }
  sitesManaged {
    id
    name
  }
  permissions {
    update
  }
`

export interface UserListUser {
  id: string
  firstname?: string
  lastname: string
  name: string
  email: string
  disabled: boolean
  trained: boolean
  roles: {
    id: string
    name: string
  }[]
  permissions: {
    disable: boolean
    update: boolean
  }
}

export interface GroupWithParents {
  id: string
  name: string
  parents: {
    id: string
    name: string
  }[]
}

export interface FullUser {
  id: string
  firstname?: string
  lastname: string
  name: string
  email: string
  disabled: boolean
  disabledAt?: string
  trained: boolean
  system: boolean
  lastlogin?: string
  directRoles: {
    id: string
    name: string
    permissions: { assign: boolean }
    siteRules: AccessDetailSiteRule[]
    pageRules: AccessDetailPageRule[]
    dataRules: AccessDetailDataRule[]
    assetRules: AccessDetailAssetRule[]
  }[]
  indirectRoles: {
    id: string
    name: string
    groups: {
      id: string
      name: string
    }[]
    siteRules: AccessDetailSiteRule[]
    pageRules: AccessDetailPageRule[]
    dataRules: AccessDetailDataRule[]
    assetRules: AccessDetailAssetRule[]
  }[]
  directGroups: GroupWithParents[]
  indirectGroups: GroupWithParents[]
  sitesOwned: {
    id: string
    name: string
  }[]
  sitesManaged: {
    id: string
    name: string
  }[]
  permissions: {
    update: boolean
  }
}

export interface UserFilter {
  enabled?: boolean
  system?: boolean
}

export interface CreateUserInput {
  userId: string
  firstname: string
  lastname: string
  email: string
  trained: boolean
  system: boolean
  validateOnly?: boolean
}

export const GET_USER_LIST = `
  query getUserList ($filter: UserFilter!) {
    users (filter: $filter) {
      ${userDetails}
    }
  }
`

export const GET_USER_BY_ID = `
  query getUserById ($userId: ID!) {
    users (filter: { ids: [$userId]}) {
      ${fullUserDetails}
    }
  }
`
export const DISABLE_USERS = `
  mutation disableUsers ($userIds: [ID!]!) {
    disableUsers (userIds: $userIds) {
      ${mutationResponse}
      users {
        ${userDetails}
      }
    }
  }
`

export const ENABLE_USERS = `
  mutation enableUsers ($userIds: [ID!]!) {
    enableUsers (userIds: $userIds) {
      ${mutationResponse}
      users {
        ${userDetails}
      }
    }
  }
`

export const CREATE_USER = `
  mutation createUser ($userId: ID!, $firstname: String, $lastname: String!, $email: String!, $trained: Boolean!, $system: Boolean!, $validateOnly: Boolean) {
    createUser (userId: $userId, firstname: $firstname, lastname: $lastname, email: $email, trained: $trained, system: $system, validateOnly: $validateOnly) {
      ${mutationResponse}
      user {
        ${userDetails}
      }
    }
  }
`

export const UPDATE_USER = `
  mutation updateUser ($userId: ID!, $args: UpdateUserInput!, $validateOnly: Boolean) {
    updateUser (userId: $userId, args: $args, validateOnly: $validateOnly) {
      ${mutationResponse}
      user {
        ${userDetails}
      }
    }
  }
`

export const REMOVE_USER_FROM_GROUP = `
  mutation removeUserFromGroups ($groupIds: [ID!]!, $userId: ID!) {
    removeUserFromGroups (groupIds: $groupIds, userId: $userId) {
      ${mutationResponse}
    }
  }
`

export const ADD_USER_TO_GROUPS = `
  mutation addUserToGroups ($groupIds: [ID!]!, $userId: ID!) {
    addUserToGroups (groupIds: $groupIds, userId: $userId) {
      ${mutationResponse}
    }
  }
`

export const SET_USER_GROUPS = `
  mutation setUserGroups ($userId: ID!, $groupIds: [ID!]!) {
    setUserGroups(userId: $userId, groupIds: $groupIds) {
      ${mutationResponse}
    }
  }
`

export const SET_GROUP_USERS = `
  mutation setGroupUsers ($groupId: ID!, $userIds: [ID!]!) {
    setGroupUsers (groupId: $groupId, userIds: $userIds) {
      ${mutationResponse}
    }
  }
`

export const REMOVE_USER_FROM_GROUPS = `
  mutation removeUserFromGroups ($groupIds: [ID!]!, $userId: ID!) {
    removeUserFromGroups (groupIds: $groupIds, userId: $userId) {
      ${mutationResponse}
    }
  }
`

export const ADD_ROLES_TO_USER = `
  mutation addRolesToUser ($roleIds: [ID!]!, $userId: ID!) {
    addRolesToUser (roleIds: $roleIds, userId: $userId) {
      ${mutationResponse}
    }
  }
`

export const REMOVE_ROLE_FROM_USER = `
  mutation removeRoleFromUser ($roleId: ID!, $userId: ID!) {
    removeRoleFromUser (roleId: $roleId, userId: $userId) {
      ${mutationResponse}
    }
  }
`

export const ADD_ROLE_TO_GROUPS = `
  mutation addRoleToGroups ($roleId: ID!, $groupIds: [ID!]!) {
    addRoleToGroups (roleId: $roleId, groupIds: $groupIds) {
      ${mutationResponse}
    }
  }
`

export const REMOVE_ROLE_FROM_GROUP = `
  mutation removeRoleFromGroup ($roleId: ID!, $groupId: ID!) {
    removeRoleFromGroup (roleId: $roleId, groupId: $groupId) {
      ${mutationResponse}
    }
  }
`
