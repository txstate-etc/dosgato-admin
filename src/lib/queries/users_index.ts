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
  roles(direct: true) {
    id
    name
  }
  groups {
    id
    name
    roles(direct: true) {
      id
      name
    }
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
  groups: {
    id: string
    name: string
    roles: {
      id: string
      name: string
    }[]
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
