import { accessDetailRules, dateStamp, type AccessDetailAssetRule, type AccessDetailDataRule, type AccessDetailPageRule, type AccessDetailSiteRule, type LaunchState } from '$lib'
export interface DashboardSite {
  id: string
  name: string
  url?: {
    prefix?: string
  }
  launched: boolean
  launchState: LaunchState
}

export interface DashboardSiteWithRoleSummary extends DashboardSite {
  roleSummary: string[]
}

export const GET_DASHBOARD_SITE_LIST = `
  query getDashboardSites {
    sites {
      id
      name
      url {
        prefix
      }
      launched
      launchState
    }
  }
`

export interface DashboardUser {
  sitesOwned: {
    id: string
    name: string
  }[]
  sitesManaged: {
    id: string
    name: string
  }[]
  roles: {
    id: string
    name: string
    siteRules: AccessDetailSiteRule[]
    pageRules: AccessDetailPageRule[]
    dataRules: AccessDetailDataRule[]
    assetRules: AccessDetailAssetRule[]
  }[]
}

export const GET_DASHBOARD_USER_DETAILS = `
  query getDashboardUserDetails ($userId: ID!) {
    users (filter: { ids: [$userId]}){
      sitesOwned {
        id
        name
      }
      sitesManaged {
        id
        name
      }
      roles {
        id
        name
        ${accessDetailRules}
      }
    }
  }
`

export interface DashboardSiteDetailRaw {
  id: string
  name: string
  url?: {
    prefix?: string
  }
  launched: boolean
  launchState: LaunchState
  owner?: {
    id: string
    name: string
  }
  managers: {
    id: string
    name: string
  }[]
  primaryPagetree: {
    pages: {
      id: string
      live: boolean
    }[]
  }
  pagetrees: {
    created: string
  }[]
}

export const GET_DASHBOARD_SITE_BY_ID = `
  query getDashboardSiteById ($siteId: ID!) {
    sites (filter: { ids: [$siteId]}) {
      id
      name
      url {
        prefix
      }
      launched
      launchState
      owner {
        id
        name
      }
      managers {
        id
        name
      }
      primaryPagetree {
        pages {
          id
          live
        }
      }
      pagetrees {
        created
      }
    }
  }
`


export interface DashboardSiteDetailDisplay extends Omit<DashboardSiteDetailRaw, 'pagetrees' | 'primaryPagetree'> {
  createdAt: string
  totalPages: number
  publishedPages: number
  // will also include information gathered from examining the roles, managers, owners
}

export function apiSiteToDashboardSite (site: DashboardSiteDetailRaw) {
  // get the earliest pagetree creation date
  const earliestPagetreeCreationDate = site.pagetrees.reduce((earliest, pagetree) => {
    const createdDate = new Date(pagetree.created)
    return createdDate < earliest ? createdDate : earliest
  }, new Date())
  const { primaryPagetree, pagetrees, ...rest } = site
  return {
    ...rest,
    createdAt: dateStamp(earliestPagetreeCreationDate.toISOString()),
    totalPages: site.primaryPagetree.pages.length,
    publishedPages: site.primaryPagetree.pages.filter(page => page.live).length
  }
}
