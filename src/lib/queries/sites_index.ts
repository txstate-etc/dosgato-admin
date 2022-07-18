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

export const fullSiteDetails = `
  id
  name
  url {
    host
    path
    prefix
  }
  organization {
    id
    name
  }
  owner {
    id
    name
  }
  managers {
    id
    name
  }
  pagetrees {
    id
    name
    type
  }
  templates {
    key
    name
    type
    universal
  }
`

export interface FullSite {
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
  managers: {
    id: string
    name: string
  }[]
  pagetrees: {
    id: string
    name: string
    type: string
  }[]
  templates: {
    key: string
    name: string
    type: string
    universal: boolean
  }[]
}

export const GET_SITE_LIST = `
  query getAllSites {
    sites {
      ${siteDetails}
    }
  }
`

export const GET_SITE_BY_ID = `
  query getSiteById ($siteId: ID!) {
    sites (filter: { ids: [$siteId]}) {
      ${fullSiteDetails}
    }
  }
`
