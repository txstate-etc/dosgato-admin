import { accessDetailRules, type AccessDetailAssetRule, type AccessDetailDataRule, type AccessDetailPageRule, type AccessDetailSiteRule, type LaunchState } from '$lib'

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


