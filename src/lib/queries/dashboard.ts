import { dateStamp, type LaunchState } from '$lib'
export interface DashboardSite {
  id: string
  name: string
  url?: {
    prefix?: string
  }
  launched: boolean
  launchState: LaunchState
}

export const titleCaseAccess = {
  EDITOR: 'Editor',
  CONTRIBUTOR: 'Contributor',
  READONLY: 'Read-only'
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
    url?: {
      prefix: string
    }
    launched: boolean
    launchState: LaunchState
  }[]
  sitesManaged: {
    id: string
    name: string
  }[]
  roles: {
    id: string
    name: string
    access?: string
    site?: {
      id: string
    }
  }[]
}

export const GET_DASHBOARD_USER_DETAILS = `
  query getDashboardUserDetails ($userId: ID!) {
    users (filter: { ids: [$userId]}){
      sitesOwned {
        id
        name
        url {
          prefix
        }
        launched
        launchState
      }
      sitesManaged {
        id
        name
        url {
          prefix
        }
        launched
        launchState
      }
      roles {
        id
        name
        access
        site {
          id
        }
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
    id: string
    name: string
    type: string
    created: string
    rootPage: {
      id: string
    }
    pages: {
      id: string
      modifiedAt: string
    }[]
  }[]
  auditRoles: {
    id: string
    name: string
    description: string
    access: string
    users: {
      id: string
      name: string
      email: string
      lastlogin: string
    }[]
  }[]
  permissions: {
    audit: boolean
  }
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
        id
        name
        created
        type
        rootPage {
          id
        }
        pages {
          id
          modifiedAt
        }
      }
      auditRoles {
        id
        name
        description
        access
        users {
          id
          name
          email
          lastlogin
        }
      }
      permissions {
        audit
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

export interface DashboardSiteTeamMemberWithRole extends DashboardSiteTeamMember {
  roles: {
    name: string
    description?: string
    access?: string
  }[]
}

export interface DashboardSiteDetailDisplay extends Omit<DashboardSiteDetailRaw, 'primaryPagetree'> {
  createdAt: string
  totalPages: number
  publishedPages: number
  rootPagePath: string
  rootPageId: string
  team: DashboardSiteTeamMember[]
  teamMembersWithRolesById: Record<string, DashboardSiteTeamMemberWithRole>
  pagetreeLastModifiedById: Record<string, Date>
}

export function apiSiteToDashboardSite (site: DashboardSiteDetailRaw) {
  // Get the earliest pagetree creation date
  const earliestPagetreeCreationDate = site.pagetrees.length
    ? site.pagetrees.reduce((earliest, pagetree) => {
      const createdDate = new Date(pagetree.created)
      return createdDate < earliest ? createdDate : earliest
    }, new Date(site.pagetrees[0].created))
    : new Date()

  const { primaryPagetree, ...rest } = site
  const teamMembersById: Record<string, Omit<DashboardSiteTeamMember, 'access'>> = {}
  const accessByUserId = new Map<string, Set<string>>()

  // Add managers
  for (const manager of site.managers) {
    teamMembersById[manager.id] = manager
    const accessSet = accessByUserId.get(manager.id) ?? new Set()
    accessSet.add('Manager')
    accessByUserId.set(manager.id, accessSet)
  }

  // Add audit role users and their access
  for (const role of site.auditRoles) {
    const access = role.access ? titleCaseAccess[role.access] : ''
    for (const user of role.users) {
      teamMembersById[user.id] = user
      const accessSet = accessByUserId.get(user.id) ?? new Set()
      accessSet.add(access)
      accessByUserId.set(user.id, accessSet)
    }
  }

  // Build team array
  const team: DashboardSiteTeamMember[] = Object.values(teamMembersById).map(user => ({
    ...user,
    access: Array.from(accessByUserId.get(user.id) ?? []).sort().join(', ')
  }))

  const teamMembersWithRolesById: Record<string, DashboardSiteTeamMemberWithRole> = {}
  for (const user of team) {
    teamMembersWithRolesById[user.id] = {
      ...user,
      roles: site.auditRoles.filter(role => role.users.some(u => u.id === user.id)).map(role => ({
        name: role.name,
        description: role.description,
        access: role.access ? titleCaseAccess[role.access] : ''
      }))
    }
  }

  const pagetreeLastModifiedById: Record<string, Date> = {}
  for (const pagetree of site.pagetrees) {
    pagetreeLastModifiedById[pagetree.id] = pagetree.pages.reduce((latest, page) => {
      const modifiedDate = new Date(page.modifiedAt)
      return modifiedDate > latest ? modifiedDate : latest
    }, new Date(pagetree.pages[0].modifiedAt))
  }

  return {
    ...rest,
    createdAt: dateStamp(earliestPagetreeCreationDate.toISOString()),
    totalPages: primaryPagetree.pages.length,
    publishedPages: primaryPagetree.pages.filter(page => page.live).length,
    rootPagePath: primaryPagetree.rootPage.path,
    rootPageId: primaryPagetree.rootPage.id,
    team,
    teamMembersWithRolesById,
    pagetreeLastModifiedById
  }
}


