import { mutationResponse } from './global'

const userDetails = `
id
name
email
disabled
roles {
  name
}
permissions {
  disable
  update
}
`

export interface UserListUser {
  id: string
  name: string
  email: string
  disabled: boolean
  roles: {
    name: string
  }[]
  permissions: {
    disable: boolean
    update: boolean
  }
}

export const GET_USER_LIST = `
  query getUserList ($enabled: Boolean) {
    users (filter: { enabled: $enabled }) {
      ${userDetails}
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
