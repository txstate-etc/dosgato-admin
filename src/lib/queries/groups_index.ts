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

const fullGroupDetails = `
  id
  name
  subgroups: subgroups {
    id
    name
    parents {
      id
      name
    }
  }
  sites {
    id
    name
    managers {
      id
      name
    }
  }
  directMembers: users(direct: true) {
    id
    name
  }
  indirectMembers: users(direct: false) {
    id
    name
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
  sites: {
    id: string
    name: string
    managers: {
      id: string
      name: string
    }[]
  }[]
  directMembers: {
    id: string
    name: string
  }[]
  indirectMembers: {
    id: string
    name: string
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
