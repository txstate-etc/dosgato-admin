export const siteDetails = `
  id
  name
`

export interface SiteListSite {
  id: string
  name: string
}

export const GET_SITE_LIST = `
  query getAllSites {
    sites {
      ${siteDetails}
    }
  }
`
