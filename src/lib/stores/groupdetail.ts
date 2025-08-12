import { Store } from '@txstate-mws/svelte-store'
import type { FullGroup, AccessDetailSiteRule, AccessDetailPageRule, AccessDetailAssetRule } from '$lib/queries'
import { isNotNull, sortby } from 'txstate-utils'
import { getSiteAccess, type SiteAccessRole } from '$lib'

interface IGroupDetailStore {
  group: FullGroup
  // sites: Record<string, string[]>
  sites: { id: string, name: string, permissions: string[] } []
}

const initialValue: FullGroup = { id: '', name: '', directMembers: [], indirectMembers: [], subgroups: [], supergroups: [], directRoles: [], rolesThroughParentGroup: [] }

export class GroupDetailStore extends Store<IGroupDetailStore> {
  constructor (public fetchGroup: (id: string) => Promise<FullGroup>) {
    super({ group: initialValue, sites: [] })
  }

  async refresh (id: string) {
    if (id !== this.value.group.id) this.set({ group: initialValue, sites: [] })
    const group = await this.fetchGroup(id)
    const groupAccessBySite: Record<string, string[]> = {}
    const siteNameById: Record<string, string> = {}

    const groupRoles: SiteAccessRole[] = [...group.directRoles, ...group.rolesThroughParentGroup]
    const groupRules = groupRoles.map(role => [...role.siteRules, ...role.assetRules, ...role.pageRules]).flat()
    const rulesBySite: Record<string, (AccessDetailAssetRule | AccessDetailPageRule | AccessDetailSiteRule)[]> = {}
    for (const rule of groupRules) {
      if (isNotNull(rule.site)) {
        rulesBySite[rule.site.id] ??= []
        rulesBySite[rule.site.id].push(rule)
        siteNameById[rule.site.id] = rule.site.name
      } else {
        rulesBySite.all ??= []
        rulesBySite.all.push(rule)
        siteNameById.all = 'All Sites'
      }
    }

    for (const site in rulesBySite) {
      groupAccessBySite[site] = getSiteAccess(rulesBySite[site])
    }
    let sitesArray: { id: string, name: string, permissions: string[] }[] = []
    for (const id in siteNameById) {
      if (id !== 'all') sitesArray.push({ id, name: siteNameById[id], permissions: groupAccessBySite[id] })
    }
    sitesArray = sortby(sitesArray, 'name')
    if (siteNameById.all) sitesArray.unshift({ id: 'all', name: 'All Sites', permissions: groupAccessBySite.all })
    this.set({ group, sites: sitesArray })
  }

  groupFetched () {
    return this.value.group.id.length > 0
  }
}
