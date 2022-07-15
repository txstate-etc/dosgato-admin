export const siteDetails = `
  id
  name
  url {
    host
    path
    prefix
  }
  organization {
    name
  }
  owner {
    id
    name
  }
  deleted
`

export interface SiteListSite {
  id: string
  name: string
  url: {
    host: string
    path: string
    prefix: string
  }
  organization: {
    name: string
  }
  owner: {
    id: string
    name: string
  }
  deleted: boolean
}

export const GET_SITE_LIST = `
  query getAllSites {
    sites {
      ${siteDetails}
    }
  }
`
