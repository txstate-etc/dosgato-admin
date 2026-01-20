import { accessDetailRules, dateStamp, getSiteAccess, type AccessDetailAssetRule, type AccessDetailDataRule, type AccessDetailPageRule, type AccessDetailSiteRule, type LaunchState } from '$lib'
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
    email: string
    lastLogin: string
  }
  managers: {
    id: string
    name: string
    email: string
    lastlogin: string
  }[]
  primaryPagetree: {
    pages: {
      id: string
      live: boolean
    }[]
    rootPage: {
      id: string
      path: string
    }
  }
  pagetrees: {
    created: string
  }[]
  siteSpecificRoles: {
    id: string
    name: string
    siteRules: AccessDetailSiteRule[]
    pageRules: AccessDetailPageRule[]
    dataRules: AccessDetailDataRule[]
    assetRules: AccessDetailAssetRule[]
    users: {
      id: string
      name: string
      email: string
      lastlogin: string
    }[]
  }[]
  rolesWithRulesBasedAccess: {
    id: string
    name: string
    siteRules: AccessDetailSiteRule[]
    pageRules: AccessDetailPageRule[]
    dataRules: AccessDetailDataRule[]
    assetRules: AccessDetailAssetRule[]
    users: {
      id: string
      name: string
      email: string
      lastlogin: string
    }[]
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
        email
        lastlogin
      }
      managers {
        id
        name
        email
        lastlogin
      }
      primaryPagetree {
        pages {
          id
          live
        }
        rootPage {
          id
          path
        }
      }
      pagetrees {
        created
      }
      siteSpecificRoles: roles(filter: { siteIds: [$siteId] }) {
        id
        name
        ${accessDetailRules}
        users {
          id
          name
          email
          lastlogin
        }
      }
      rolesWithRulesBasedAccess: roles {
        id
        name
        dataRules (filter: { siteIds: [$siteId] }) {
          site {
            id
            name
          }
          type
          template {
            key
            name
          }
          grants {
            viewForEdit
            view
            create
            delete
            move
            update
            undelete
            publish
            unpublish
          }
        }
        siteRules (filter: { siteIds: [$siteId] }) {
          site {
            id
            name
          }
          type
          grants {
            viewForEdit
          }
        }
        pageRules (filter: { siteIds: [$siteId] }) {
          site {
            id
            name
          }
          path
          pagetreeType
          type
          grants {
            viewlatest
            viewForEdit
            create
            update
            move
            publish
            unpublish
            delete
            view
            undelete
          }
        }
        assetRules (filter: { siteIds: [$siteId] }) {
          site {
            id
            name
          }
          path
          pagetreeType
          type
          grants {
            create
            update
            move
            delete
            view
            undelete
          }
        }
        users {
          id
          name
          email
          lastlogin
        }
      }   
    }
  }
`

export interface DashboardSiteTeamMember {
  id: string
  name: string
  email: string
  lastlogin: string
  access: string
}


export interface DashboardSiteDetailDisplay extends Omit<DashboardSiteDetailRaw, 'pagetrees' | 'primaryPagetree'> {
  createdAt: string
  totalPages: number
  publishedPages: number
  rootPagePath: string
  rootPageId: string
  team: DashboardSiteTeamMember[]
}

export function apiSiteToDashboardSite (site: DashboardSiteDetailRaw) {
  // Get the earliest pagetree creation date
  const earliestPagetreeCreationDate = site.pagetrees.length
    ? site.pagetrees.reduce((earliest, pagetree) => {
      const createdDate = new Date(pagetree.created)
      return createdDate < earliest ? createdDate : earliest
    }, new Date(site.pagetrees[0].created))
    : new Date()

  const { primaryPagetree, pagetrees, ...rest } = site
  const teamMembersById: Record<string, Omit<DashboardSiteTeamMember, 'access'>> = {}
  const accessByUserId = new Map<string, Set<string>>()

  // Add managers
  for (const manager of site.managers) {
    teamMembersById[manager.id] = manager
    const accessSet = accessByUserId.get(manager.id) ?? new Set()
    accessSet.add('Manager')
    accessByUserId.set(manager.id, accessSet)
  }

  // Prepare roles
  const siteSpecificRoleIds = new Set(site.siteSpecificRoles.map(r => r.id))
  const rolesWithRuleBasedAccess = site.rolesWithRulesBasedAccess.filter(
    r =>
      (r.assetRules.length > 0 ||
        r.pageRules.length > 0 ||
        r.siteRules.length > 0 ||
        r.dataRules.length > 0) &&
      !siteSpecificRoleIds.has(r.id)
  )
  const allRoles = [...site.siteSpecificRoles, ...rolesWithRuleBasedAccess]

  // Add role users and their access
  for (const role of allRoles) {
    const rules = [
      ...role.siteRules,
      ...role.pageRules,
      ...role.assetRules,
      ...role.dataRules
    ]
    const access = getSiteAccess(rules)
    for (const user of role.users) {
      teamMembersById[user.id] = user
      const accessSet = accessByUserId.get(user.id) ?? new Set()
      for (const perm of access) accessSet.add(perm)
      accessByUserId.set(user.id, accessSet)
    }
  }

  // Build team array
  const team: DashboardSiteTeamMember[] = Object.values(teamMembersById).map(user => ({
    ...user,
    access: Array.from(accessByUserId.get(user.id) ?? []).sort().join(', ')
  }))

  return {
    ...rest,
    createdAt: dateStamp(earliestPagetreeCreationDate.toISOString()),
    totalPages: primaryPagetree.pages.length,
    publishedPages: primaryPagetree.pages.filter(page => page.live).length,
    rootPagePath: primaryPagetree.rootPage.path,
    rootPageId: primaryPagetree.rootPage.id,
    team
  }
}


