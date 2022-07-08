import { Store } from '@txstate-mws/svelte-store'
import type { FullGroup, AccessDetailSiteRule, AccessDetailPageRule } from '$lib/queries'
import { isNull, unique } from 'txstate-utils'

interface IGroupDetailStore {
  group: FullGroup
  sites: Record<string, string[]>
  permittedOnAllSites: string[]
}
interface Role {
  id: string
  name: string
  siteRules: AccessDetailSiteRule[]
  pageRules: AccessDetailPageRule[]
}

const initialValue: FullGroup = { id: '', name: '', sites: [], directMembers: [], indirectMembers: [], subgroups: [], supergroups: [], directManagers: [], managersThroughSite: [], directRoles: [], rolesThroughParentGroup: [] }

export class GroupDetailStore extends Store<IGroupDetailStore> {
  constructor (public fetchGroup: (id: string) => Promise<FullGroup>) {
    super({ group: initialValue, sites: {}, permittedOnAllSites: [] })
  }

  async refresh (id: string) {
    const group = await this.fetchGroup(id)
    const sites = {}
    let globalSiteEditor = false
    let globalPublisher = false
    const permittedOnAllSites: string [] = []

    const groupRoles: Role[] = [...group.directRoles, ...group.rolesThroughParentGroup]
    // If this group has some site rule with a null site with a viewForEdit grant, the members can edit all sites
    // If this group has some page rule with a null site and null pagetree with a viewForEdit grant, the members can edit all sites
    globalSiteEditor = groupRoles.some(role => {
      if (role.siteRules.some(sr => isNull(sr.site) && sr.grants.viewForEdit)) return true
      if (role.pageRules.some(pr => isNull(pr.site) && pr.grants.viewForEdit)) return true
      return false
    })
    if (globalSiteEditor) permittedOnAllSites.push('editor')
    globalPublisher = groupRoles.some(role => {
      if (role.pageRules.some(pr => isNull(pr.site) && pr.grants.publish)) return true
      return false
    })
    if (globalPublisher) permittedOnAllSites.push('publisher')
    if (!globalSiteEditor || !globalPublisher) {
      const editSites: string[] = []
      const publishSites: string[] = []
      for (const role of groupRoles) {
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
        sites[site] = ['editor']
      }
      for (const site of unique(publishSites)) {
        sites[site] = sites[site] ? [...sites[site], 'publisher'] : ['publisher']
      }
    }
    this.set({ group, sites, permittedOnAllSites })
  }

  groupFetched () {
    return this.value.group.id.length > 0
  }
}
