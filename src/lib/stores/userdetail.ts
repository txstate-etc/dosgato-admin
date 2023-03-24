import { Store } from '@txstate-mws/svelte-store'
import type { FullUser, AccessDetailSiteRule, AccessDetailPageRule } from '$lib/queries'
import { isNull, set, sortby, unique } from 'txstate-utils'

interface IUserDetailStore {
  user: FullUser
  sites: { id: string, name: string, permissions: string[] } [] // Record<string, string[]>
  permittedOnAllSites: string[]
  groupRemoving?: {
    id: string
    name: string
  }
  roleRemoving?: {
    id: string
    name: string
  }
}

interface Role {
  id: string
  name: string
  siteRules: AccessDetailSiteRule[]
  pageRules: AccessDetailPageRule[]
}

const initialValue: FullUser = { id: '', firstname: '', lastname: '', email: '', disabled: false, trained: false, directGroups: [], indirectGroups: [], directRoles: [], indirectRoles: [], sitesOwned: [], sitesManaged: [], permissions: { update: false } }

export class UserDetailStore extends Store<IUserDetailStore> {
  constructor (public fetchUser: (id: string) => Promise<FullUser>) {
    super({ user: initialValue, sites: [], permittedOnAllSites: [] })
  }

  async refresh (id: string) {
    const user = await this.fetchUser(id)
    const sites: Record<string, { id: string, permissions: string[] }> = {}
    let globalSiteEditor = false
    let globalPublisher = false
    const permittedOnAllSites: string [] = []
    for (const site of user.sitesOwned) {
      sites[site.name] = { id: site.id, permissions: ['owner'] }
    }
    for (const site of user.sitesManaged) {
      sites[site.name] = sites[site.name] ? { ...sites[site.name], permissions: [...sites[site.name].permissions, 'manager'] } : { id: site.id, permissions: ['manager'] }
    }

    const userRoles: Role[] = [...user.directRoles, ...user.indirectRoles]
    // If they have some site rule with a null site with a viewForEdit grant, they can edit all sites
    // If they have some page rule with a null site and pagetree with a viewForEdit grant, they can edit all sites?
    globalSiteEditor = userRoles.some(role => {
      if (role.siteRules.some(sr => isNull(sr.site) && sr.grants.viewForEdit)) return true
      if (role.pageRules.some(pr => isNull(pr.site) && pr.grants.viewForEdit)) return true
      return false
    })
    if (globalSiteEditor) permittedOnAllSites.push('editor')
    globalPublisher = userRoles.some(role => {
      if (role.pageRules.some(pr => isNull(pr.site) && pr.grants.publish)) return true
      return false
    })
    if (globalPublisher) permittedOnAllSites.push('publisher')
    if (!globalSiteEditor || !globalPublisher) {
      const editSites: { id: string, name: string }[] = []
      const publishSites: { id: string, name: string }[] = []
      for (const role of userRoles) {
        if (!globalSiteEditor) {
          for (const sr of role.siteRules) {
            if (sr.site && sr.grants.viewForEdit) editSites.push({ id: sr.site.id, name: sr.site.name })
          }
        }
        for (const pr of role.pageRules) {
          if (!globalSiteEditor) {
            if (pr.site && pr.grants.viewForEdit) editSites.push({ id: pr.site.id, name: pr.site.name })
          }
          if (!globalPublisher) {
            if (pr.site && pr.grants.publish) publishSites.push({ id: pr.site.id, name: pr.site.name })
          }
        }
      }
      for (const site of unique(editSites)) {
        sites[site.name] = sites[site.name] ? { ...sites[site.name], permissions: [...sites[site.name].permissions, 'editor'] } : { id: site.id, permissions: ['editor'] }
      }
      for (const site of unique(publishSites)) {
        sites[site.name] = sites[site.name] ? { ...sites[site.name], permissions: [...sites[site.name].permissions, 'publisher'] } : { id: site.id, permissions: ['publisher'] }
      }
    }

    const sitesArray = sortby(Object.keys(sites).map(key => ({ id: sites[key].id, name: key, permissions: sites[key].permissions })), 'name')
    if (permittedOnAllSites.length) sitesArray.unshift({ id: 'all', name: 'All Sites', permissions: permittedOnAllSites })
    this.set({ user, sites: sitesArray, permittedOnAllSites })
  }

  userFetched () {
    return this.value.user.id.length > 0
  }

  setGroupRemoving (id: string, name: string) {
    this.update(v => {
      return set(v, 'groupRemoving', { id, name })
    })
  }

  resetGroupRemoving () {
    this.update(v => {
      return set(v, 'groupRemoving', undefined)
    })
  }

  setRoleRemoving (id: string, name: string) {
    this.update(v => {
      return set(v, 'roleRemoving', { id, name })
    })
  }

  resetRoleRemoving () {
    this.update(v => {
      return set(v, 'roleRemoving', undefined)
    })
  }
}
