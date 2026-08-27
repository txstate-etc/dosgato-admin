import { dateStamp, type LaunchState } from '$lib'
export interface DashboardSite {
  id: string
  name: string
  url?: {
    host?: string
    path?: string
  }
  launched: boolean
  launchState: LaunchState
  pagetrees?: {
    id: string
    created: string
    modifiedAt: string
  }[]
}

/**
 * The API's RoleAccessLevel enum. These are the wire values - display labels for them live in
 * titleCaseAccess and are applied at render time, never stored on our data.
 */
export type RoleAccessLevel = 'EDITOR' | 'CONTRIBUTOR' | 'READONLY'

// most access to least, so we can pick the highest level a user holds
export const accessLevelsByRank: RoleAccessLevel[] = ['EDITOR', 'CONTRIBUTOR', 'READONLY']

export const titleCaseAccess: Record<RoleAccessLevel, string> = {
  EDITOR: 'Editor',
  CONTRIBUTOR: 'Contributor',
  READONLY: 'Read-only'
}

// every access level picker in the UI uses this so the labels only exist in one place
export const accessLevelChoices = accessLevelsByRank.map(value => ({ value, label: titleCaseAccess[value] }))

export function highestAccessLevel (levels: RoleAccessLevel[] | undefined) {
  return accessLevelsByRank.find(level => levels?.includes(level))
}

/**
 * UI-only sentinel for a team member (always a manager) who holds no access level via any of the
 * site's audit roles. It is never sent to the API - the API has no concept of it.
 */
export const NO_ACCESS = 'NONE'
export type AccessLevelSelection = RoleAccessLevel | typeof NO_ACCESS
export const noAccessChoice = { value: NO_ACCESS, label: 'No Access' }

export interface DashboardSiteWithRoleSummary extends DashboardSite {
  roleSummary: string[]
}

export const GET_DASHBOARD_SITE_LIST = `
  query getDashboardSites {
    sites {
      id
      name
      url {
        host
        path
      }
      launched
      launchState
      pagetrees {
        id
        created
        modifiedAt
      }
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
    access?: RoleAccessLevel
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

export interface SiteAuditRole {
  id: string
  name: string
  description: string
  access: RoleAccessLevel
  users: {
    id: string
    name: string
    email: string
    lastlogin: string
    trainings: {
      id: string
      name: string
    }[]
  }[]
}

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
    trainings: {
      id: string
      name: string
    }[]
  }[]
  primaryPagetree: {
    pages: {
      id: string
      live: boolean
    }[]
    rootPage: {
      id: string
      path: string
      permissions: {
        viewLatest: boolean
      }
    }
  }
  pagetrees: {
    id: string
    name: string
    type: string
    created: string
    rootPage: {
      id: string
      template: {
        templateTheme?: string
      }
    }
    permissions: {
      viewPages: boolean
    }
    modifiedAt: string
    pageCount: number
    pages: {
      id: string
    }[]
  }[]
  auditRoles: SiteAuditRole[]
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
        trainings {
          id
          name
        }
      }
      primaryPagetree {
        pages {
          id
          live
        }
        rootPage {
          id
          path
          permissions {
            viewLatest
          }
        }
      }
      pagetrees {
        id
        name
        created
        type
        rootPage {
          id
          template {
            templateTheme
          }
        }
        permissions {
          viewPages
        }
        modifiedAt
        pageCount
        pages (filter: { live: true }) {
          id
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
          trainings {
            id
            name
          }
        }
      }
      permissions {
        audit
      }
    }
  }
`

export const ADD_SITE_TEAM_MEMBER = `
  mutation AddSiteTeamMember ($siteId: ID!, $userId: ID!, $access: RoleAccessLevel!, $roleIds: [ID!], $validateOnly: Boolean) {
    addSiteTeamMember (siteId: $siteId, userId: $userId, access: $access, roleIds: $roleIds, validateOnly: $validateOnly) {
      success
      user {
        id
        name
        email
        disabled
        trainings {
          id
          name
        }
      }
      messages {
        message
        arg
        type
      }
    }
  }
`

export const EDIT_SITE_TEAM_MEMBER = `
 mutation EditSiteTeamMember ($siteId: ID!, $userId: ID!, $access: RoleAccessLevel!, $roleIds: [ID!], $validateOnly: Boolean) {
  editSiteTeamMember (siteId: $siteId, userId: $userId, access: $access, roleIds: $roleIds, validateOnly: $validateOnly) {
      success
      user {
        id
        name
        email
        disabled
        trainings {
          id
          name
        }
      }
      messages {
        message
        arg
        type
      }
    }
 }
`

export const REMOVE_SITE_TEAM_MEMBER = `
  mutation RemoveSiteTeamMember ($siteId: ID!, $userId: ID!, $validateOnly: Boolean) {
    removeSiteTeamMember (siteId: $siteId, userId: $userId, validateOnly: $validateOnly) {
      success
      messages {
        message
        arg
        type
      }
    }
  }
`

export interface AddSiteTeamMemberUser {
  id: string
  name: string
  email: string
  disabled: boolean
  trainings: { id: string, name: string }[]
}

export interface DashboardSiteTeamMember {
  id: string
  name: string
  email: string
  lastlogin: string
  /** the raw access levels this user holds through the site's audit roles, highest first */
  accessLevels: RoleAccessLevel[]
  isManager: boolean
  /** human readable summary of isManager + accessLevels, e.g. 'Contributor, Manager' */
  accessDisplay: string
  trainings: { id: string, name: string }[]
}

export interface DashboardSiteTeamMemberWithRole extends DashboardSiteTeamMember {
  roles: {
    id: string
    name: string
    description?: string
    access?: RoleAccessLevel
  }[]
}

export interface DashboardSiteDetailDisplay extends Omit<DashboardSiteDetailRaw, 'primaryPagetree'> {
  createdAt: string
  totalPages: number
  publishedPages: number
  rootPagePath: string
  rootPageId: string | undefined
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
  type TeamMemberIdentity = Omit<DashboardSiteTeamMember, 'accessLevels' | 'isManager' | 'accessDisplay'>
  const teamMembersById: Record<string, TeamMemberIdentity> = {}
  // raw enum values only - the display labels get derived below
  const accessLevelsByUserId = new Map<string, Set<RoleAccessLevel>>()
  const managerIds = new Set<string>()

  // Add managers
  for (const manager of site.managers) {
    teamMembersById[manager.id] = manager
    managerIds.add(manager.id)
  }

  // Add audit role users and their access
  for (const role of site.auditRoles) {
    for (const user of role.users) {
      teamMembersById[user.id] = user
      const accessSet = accessLevelsByUserId.get(user.id) ?? new Set<RoleAccessLevel>()
      accessSet.add(role.access)
      accessLevelsByUserId.set(user.id, accessSet)
    }
  }

  // Build team array
  const team: DashboardSiteTeamMember[] = Object.values(teamMembersById).map(user => {
    const isManager = managerIds.has(user.id)
    const held = accessLevelsByUserId.get(user.id)
    const accessLevels = accessLevelsByRank.filter(level => held?.has(level))
    return {
      ...user,
      accessLevels,
      isManager,
      accessDisplay: [...(isManager ? ['Manager'] : []), ...accessLevels.map(level => titleCaseAccess[level])].join(', ')
    }
  })

  const teamMembersWithRolesById: Record<string, DashboardSiteTeamMemberWithRole> = {}
  for (const user of team) {
    teamMembersWithRolesById[user.id] = {
      ...user,
      roles: site.auditRoles.filter(role => role.users.some(u => u.id === user.id)).map(role => ({
        id: role.id,
        name: role.name,
        description: role.description,
        access: role.access
      }))
    }
  }

  const pagetreeLastModifiedById: Record<string, Date> = {}
  for (const pagetree of site.pagetrees) {
    const pagetreeModifiedDate = new Date(pagetree.modifiedAt)
    pagetreeLastModifiedById[pagetree.id] = pagetreeModifiedDate
  }

  return {
    ...rest,
    createdAt: dateStamp(earliestPagetreeCreationDate.toISOString()),
    totalPages: primaryPagetree.pages.length,
    publishedPages: primaryPagetree.pages.filter(page => page.live).length,
    rootPagePath: primaryPagetree.rootPage.path,
    rootPageId: primaryPagetree.rootPage.permissions.viewLatest ? primaryPagetree.rootPage.id : undefined,
    team,
    teamMembersWithRolesById,
    pagetreeLastModifiedById
  }
}
