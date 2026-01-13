import { api, type SiteListSite } from '$lib'
import { updateAuthSubnav } from '../authsubnav'

export const load = async () => {
  const sites = await api.getSiteList()
  const siteOptions = sites.map((s: SiteListSite) => ({ value: s.id, label: s.name }))
  updateAuthSubnav('roles')
  return { siteOptions }
}
