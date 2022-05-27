const groupDetails = `
  id
  name
  permissions {
    manageUsers
    manageGroups
  }
`

export interface GroupListGroup {
  id: string
  name: string
  permissions: {
    manageUsers: boolean
    manageGroups: boolean
  }
}

export const GET_GROUP_LIST = `
  query getGroupList {
    groups {
      ${groupDetails}
    }
  }
`

