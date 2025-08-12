import { error, type Load } from '@sveltejs/kit'
import { api, RoleDetailStore, type SiteListSite } from '$lib'
import { updateAuthSubnav } from '../../authsubnav'

export const _store = new RoleDetailStore(api.getRoleById.bind(api))

export const load: Load<{ id: string }> = async ({ params }) => {
  const [sites, users, groups, templates] = await Promise.all([
    api.getSiteList(),
    api.getUserList({ enabled: true }),
    api.getAllGroups(),
    api.getAllTemplates(),
    _store.refresh(params.id)
  ])

  if (!_store.roleFetched()) throw error(404)
  const siteOptions = sites.map((s: SiteListSite) => ({ value: s.id, label: s.name }))
  updateAuthSubnav('roles')
  return { siteOptions, users, groups, templates }
}
