import { Store } from '@txstate-mws/svelte-store'
import type { FullSite } from '$lib/queries'
import { isNull, sortby } from 'txstate-utils'

interface ISiteDetailStore {
  site: FullSite
  globalRoles: SiteRole[] // roles that affect all sites, not just this specific site
  siteRoles: SiteRole[]
  groups: SiteGroup[]
  users: SiteUser[]
}

interface SiteRole {
  id: string
  name: string
}

interface SiteGroup {
  id: string
  name: string
  roles: string
}

interface SiteUser {
  id: string
  name: string
  roles: string
}

const initialValue: FullSite = {
  id: '',
  name: '',
  url: { host: '', path: '', prefix: '' },
  organization: { name: '' },
  owner: { id: '', name: '' },
  managers: [],
  pagetrees: [],
  templates: [],
  roles: [],
  permissions: { rename: false, launch: false, manageGovernance: false, delete: false, undelete: false, manageState: false }
}

export class SiteDetailStore extends Store<ISiteDetailStore> {
  constructor (public fetchSite: (id: string) => Promise<FullSite>) {
    super({ site: initialValue, globalRoles: [], siteRoles: [], groups: [], users: [] })
  }

  async refresh (id: string) {
    const site = await this.fetchSite(id)
    const globalRoles: SiteRole[] = []
    const siteRoles: SiteRole[] = []
    const groupRoles = {}
    const userRoles = {}
    for (const role of site.roles) {
      const hasGlobalRule =
        role.assetRules.some(r => isNull(r.site)) ||
        role.dataRules.some(r => isNull(r.site)) ||
        role.pageRules.some(r => isNull(r.site)) ||
        role.siteRules.some(r => isNull(r.site))
      if (hasGlobalRule) globalRoles.push({ id: role.id, name: role.name })
      else siteRoles.push({ id: role.id, name: role.name })
      for (const group of role.groups) {
        groupRoles[group.id] ||= { name: group.name, roles: [] }
        groupRoles[group.id].roles.push(role.name)
      }
      for (const user of role.users) {
        userRoles[user.id] ||= { name: user.name, roles: [] }
        userRoles[user.id].roles.push(role.name)
      }
    }
    const groups = Object.keys(groupRoles).map(k => {
      return { id: k, name: groupRoles[k].name, roles: groupRoles[k].roles.join(', ') }
    })
    const users = Object.keys(userRoles).map(k => {
      return { id: k, name: userRoles[k].name, roles: userRoles[k].roles.join(', ') }
    })
    this.set({ site, globalRoles: sortby(globalRoles, 'name'), siteRoles: sortby(siteRoles, 'name'), groups, users })
    return site // TODO: Is there a better way to get the site name in the site detail page load function?
  }

  siteFetched () {
    return this.value.site.id.length > 0
  }
}
