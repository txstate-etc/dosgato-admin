import { api, getSiteAccess, type AccessDetailAssetRule, type AccessDetailPageRule, type AccessDetailSiteRule } from '$lib'
import { isNotNull } from 'txstate-utils'

export const load = async () => {
  const currentUser = await api.getSelf()
  if (!currentUser.me.id) return { sites: [] }
  const [sites, user] = await Promise.all([
    api.getDashboardSites(),
    api.getDashboardUser(currentUser.me.id)
  ])
  const allSites = [...sites, ...user.sitesOwned, ...user.sitesManaged]
  const userAccessBySite: Record<string, string[]> = allSites.reduce<Record<string, string[]>>((acc, site) => {
    acc[site.id] = []
    return acc
  }, {})
  for (const site of user.sitesOwned) {
    userAccessBySite[site.id] = ['Owner']
  }
  for (const site of user.sitesManaged) {
    if (!userAccessBySite[site.id]) {
      userAccessBySite[site.id] = []
    }
    userAccessBySite[site.id].push('Manager')
  }
  const userRules = user.roles.map(role => [...role.siteRules, ...role.assetRules, ...role.pageRules]).flat()
  const rulesBySite: Record<string, (AccessDetailAssetRule | AccessDetailPageRule | AccessDetailSiteRule)[]> = sites.reduce<Record<string, (AccessDetailAssetRule | AccessDetailPageRule | AccessDetailSiteRule)[]>>((acc, site) => {
    acc[site.id] = []
    return acc
  }, {})
  for (const rule of userRules) {
    if (isNotNull(rule.site)) {
      rulesBySite[rule.site.id].push(rule)
    } else {
      // applies to all sites
      for (const site of sites) {
        rulesBySite[site.id].push(rule)
      }
    }
  }
  for (const site in rulesBySite) {
    const permissionsForThisSite = getSiteAccess(rulesBySite[site])
    userAccessBySite[site] ??= []
    userAccessBySite[site].push(...permissionsForThisSite)
  }
  return { sites: allSites.map(site => ({ ...site, roleSummary: userAccessBySite[site.id] })) }
}
