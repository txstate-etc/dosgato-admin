import { Store } from '@txstate-mws/svelte-store'
import type { FullUser, AccessDetailSiteRule, AccessDetailPageRule } from '$lib/queries'
import { isNull, unique } from 'txstate-utils'


interface IUserDetailStore {
  user: FullUser
  sites: Record<string, string[]>
  permittedOnAllSites: string[]
}

interface Role {
  id: string
  name: string
  siteRules: AccessDetailSiteRule[]
  pageRules: AccessDetailPageRule[]
}

const initialValue: FullUser = { id: '', name: '', email: '', disabled: false, trained: false, directGroups: [], indirectGroups: [], directRoles: [], indirectRoles: [], sitesOwned: [], sitesManaged: [] }

export class UserDetailStore extends Store<IUserDetailStore> {
  constructor (public fetchUser: (id: string) => Promise<FullUser>) {
    super({ user: initialValue, sites: {}, permittedOnAllSites: [] })
  }

  async refresh (id: string) {
    const user = await this.fetchUser(id)
    const sites = {}
    let globalSiteEditor = false
    let globalPublisher = false
    const permittedOnAllSites: string [] = []
    for (const site of user.sitesOwned) {
      sites[site.name] = ['owner']
    }
    for (const site of user.sitesManaged) {
      sites[site.name] = sites[site.name] ? [...sites[site.name], 'manager'] : ['manager']
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
      const editSites: string[] = []
      const publishSites: string[] = []
      for (const role of userRoles) {
        if (!globalSiteEditor) {
          for (const sr of role.siteRules) {
            if (sr.site && sr.grants.viewForEdit) editSites.push(sr.site.name)
          }
        }
        for (const pr of role.pageRules) {
          if (!globalSiteEditor) {
            if (pr.site && pr.grants.viewForEdit) editSites.push(pr.site.name)
          }
          if (!globalPublisher) {
            if (pr.site && pr.grants.publish) publishSites.push(pr.site.name)
          }
        }
      }
      for (const site of unique(editSites)) {
        sites[site] = sites[site] ? [...sites[site], 'editor'] : ['editor']
      }
      for (const site of unique(publishSites)) {
        sites[site] = sites[site] ? [...sites[site], 'publisher'] : ['publisher']
      }
    }
    this.set({ user, sites, permittedOnAllSites })
  }

  userFetched () {
    return this.value.user.id.length > 0
  }
}

