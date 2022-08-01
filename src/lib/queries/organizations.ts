export const organizationDetails = `
  id
  name
`
export interface Organization {
  id: string
  name: string
}

export const GET_ORGANIZATION_LIST = `
  query getAllOrganizations {
    organizations {
      ${organizationDetails}
    }
  }
`
