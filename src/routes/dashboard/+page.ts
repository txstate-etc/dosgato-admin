import { api, titleCaseAccess } from '$lib'
import { unique } from 'txstate-utils'

export const load = async () => {
  const currentUser = await api.getSelf()
  if (!currentUser.me.id) return { sites: [] }
  const [sites, user] = await Promise.all([
    api.getDashboardSites(),
    api.getDashboardUser(currentUser.me.id)
  ])
  const allSites = unique([...sites, ...user.sitesOwned, ...user.sitesManaged], 'id')
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

  for (const role of user.roles) {
    // We are not interested in roles that are not associated with a particular site
    if (!role.site?.id || !role.access) continue // TODO: what do we do if the role has no access level set. is there a default?
    if (!userAccessBySite[role.site.id]) {
      userAccessBySite[role.site.id] = []
    }
    userAccessBySite[role.site.id].push(role.access ? titleCaseAccess[role.access] : '')
  }
  return { sites: allSites.map(site => ({ ...site, roleSummary: userAccessBySite[site.id] })) }
}
