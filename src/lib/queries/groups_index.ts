const groupDetails = `
  id
  name
  roles(direct: true) {
    id
    name
  }
  managers {
    id
    name
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
  managers: {
    id: string
    name: string
  }[]
  subgroups: {
    id: string
  }[]
  permissions: {
    manageUsers: boolean
    manageGroups: boolean
  }
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

