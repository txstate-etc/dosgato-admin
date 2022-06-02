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

const fullUserDetails = `
  id
  name
  email
  disabled
  directRoles: roles(direct: true) {
    id
    name
  }
  indirectRoles: roles(direct: false) {
    id
    name
    groups(direct: true) {
      id
      name
    }
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

export interface FullUser extends UserListUser {
  directRoles: {
    id: string
    name: string
  }[]
  indirectRoles: {
    id: string
    name: string
    groups: {
      id: string
      name: string
    }[]
  }[]
  directGroups: {
    id: string
    name: string
    parents: {
      id: string
      name: string
    }[]
  }[]
  indirectGroups: {
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
