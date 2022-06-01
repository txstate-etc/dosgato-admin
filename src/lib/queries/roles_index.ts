const roleDetails = `
  id
  name
`

export interface RoleListRole {
  id: string
  name: string
}

export const GET_ROLE_LIST = `
  query getRoleList {
    roles {
      ${roleDetails}
    }
  }
`
