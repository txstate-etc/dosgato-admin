import { Store } from '@txstate-mws/svelte-store'
import type { FullUser, AccessDetailSiteRule, AccessDetailPageRule, AccessDetailAssetRule, AccessDetailDataRule } from '$lib/queries'
import { isNotBlank, isNotNull, set, sortby } from 'txstate-utils'
import { getDataAccess, getSiteAccess, type SiteAccessRole } from '$lib'

interface IUserDetailStore {
  user: FullUser
  sites: { id: string, name: string, permissions: string[] } []
  dataTemplates: { id: string, name: string, permissions: string[] } []
  groupRemoving?: {
    id: string
    name: string
  }
  roleRemoving?: {
    id: string
    name: string
  }
}



const initialValue: FullUser = { id: '', firstname: '', lastname: '', name: '', email: '', disabled: false, trainings: [], directGroups: [], indirectGroups: [], directRoles: [], indirectRoles: [], sitesOwned: [], sitesManaged: [], permissions: { update: false }, system: false }

export class UserDetailStore extends Store<IUserDetailStore> {
  constructor (public fetchUser: (id: string) => Promise<FullUser>) {
    super({ user: initialValue, sites: [], dataTemplates: [] })
  }

  async refresh (id: string) {
    const user = await this.fetchUser(id)
    const userAccessBySite: Record<string, string[]> = {}
    const siteNameById: Record<string, string> = { }
    for (const site of user.sitesOwned) {
      userAccessBySite[site.id] = ['Owner']
      siteNameById[site.id] = site.name
    }
    for (const site of user.sitesManaged) {
      userAccessBySite[site.id] ??= []
      userAccessBySite[site.id].push('Manager')
      siteNameById[site.id] = site.name
    }

    const userRoles: SiteAccessRole[] = [...user.directRoles, ...user.indirectRoles]
    const userRules = userRoles.map(role => [...role.siteRules, ...role.assetRules, ...role.pageRules]).flat()
    const rulesBySite: Record<string, (AccessDetailAssetRule | AccessDetailPageRule | AccessDetailSiteRule)[]> = {}
    for (const rule of userRules) {
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
    // rulesBySite looks like { siteId1: [rules about site1], all: [rules with no site specified], anothersiteId: [more rules]}

    for (const site in rulesBySite) {
      const permissionsForThisSite = getSiteAccess(rulesBySite[site])
      userAccessBySite[site] ??= []
      userAccessBySite[site].push(...permissionsForThisSite)
    }
    // The UI is expecting an array like [{ site ID, site name, permissions: [] }]
    let sitesArray: { id: string, name: string, permissions: string[] }[] = []
    for (const id in siteNameById) {
      if (id !== 'all') sitesArray.push({ id, name: siteNameById[id], permissions: userAccessBySite[id] })
    }
    sitesArray = sortby(sitesArray, 'name')
    if (siteNameById.all) sitesArray.unshift({ id: 'all', name: 'All Sites', permissions: userAccessBySite.all })

    // For which data templates does the user have permission to add, edit, move, delete?
    const dataTemplatesByKey: Record<string, string> = {}
    const rulesByDataTemplate: Record<string, AccessDetailDataRule[]> = {}
    for (const role of userRoles) {
      // collect the data rules for each role and group them by template, or 'all' if they are for all templates
      for (const dataRule of role.dataRules) {
        if (isNotNull(dataRule.template)) {
          dataTemplatesByKey[dataRule.template.key] = dataRule.template.name
          rulesByDataTemplate[dataRule.template.key] ??= []
          rulesByDataTemplate[dataRule.template.key].push(dataRule)
        } else {
          rulesByDataTemplate.all ??= []
          rulesByDataTemplate.all.push(dataRule)
        }
      }
    }
    const dataTemplates: { id: string, name: string, permissions: string[] }[] = []
    for (const key in dataTemplatesByKey) {
      const access = getDataAccess(rulesByDataTemplate[key])
      dataTemplates.push({ id: key, name: dataTemplatesByKey[key], permissions: access })
    }
    if (rulesByDataTemplate.all?.length) {
      const access = getDataAccess(rulesByDataTemplate.all)
      dataTemplates.unshift({ id: 'all', name: 'All Data Templates', permissions: access })
    }

    this.set({ user, sites: sitesArray, dataTemplates })
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
