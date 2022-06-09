import { mutationResponse } from './global'

const userDetails = `
id
name
email
disabled
roles {
  id
  name
}
permissions {
  disable
  update
}
`

const userDetailRules = `
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
    pagetree {
      id
      name
      site {
        id
        name
      }
    }
    grants {
      viewlatest
      viewForEdit
      publish
    }
  }
`

const fullUserDetails = `
  id
  name
  email
  disabled
  disabledAt
  lastlogin
  directRoles: roles(direct: true) {
    id
    name
    ${userDetailRules}
  }
  indirectRoles: roles(direct: false) {
    id
    name
    groups(direct: true) {
      id
      name
    }
    ${userDetailRules}
  }
  directGroups: groups(direct: true) {
    id
    name
    parents {
      id
      name
    }
  }
  indirectGroups: groups(direct: false) {
    id
    name
    parents {
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
`

export interface UserListUser {
  id: string
  name: string
  email: string
  disabled: boolean
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

export interface UserDetailSiteRule {
  site: {
    id: string
    name: string
  }
  grants: {
    viewForEdit: boolean
  }
}

export interface UserDetailPageRule {
  site: {
    id: string
    name: string
  }
  pagetree: {
    id: string
    name: string
    site: {
      id: string
      name: string
    }
  }
  grants: {
    viewlatest: boolean
    viewForEdit: boolean
    publish: boolean
  }
}

export interface FullUser {
  id: string
  name: string
  email: string
  disabled: boolean
  disabledAt?: string
  lastlogin?: string
  directRoles: {
    id: string
    name: string
    siteRules: UserDetailSiteRule[]
    pageRules: UserDetailPageRule[]
  }[]
  indirectRoles: {
    id: string
    name: string
    groups: {
      id: string
      name: string
    }[]
    siteRules: UserDetailSiteRule[]
    pageRules: UserDetailPageRule[]
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
}

export const GET_USER_LIST = `
  query getUserList ($enabled: Boolean) {
    users (filter: { enabled: $enabled }) {
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
