import { error, type Load } from '@sveltejs/kit'
import { api, RoleDetailStore, type SiteListSite } from '$lib'

export const _store = new RoleDetailStore(api.getRoleById.bind(api))

export const load: Load<{ id: string }> = async ({ params }) => {
  await _store.refresh(params.id)
  if (!_store.roleFetched()) throw error(404)
  const [sites, users, groups] = await Promise.all([
    api.getSiteList(),
    api.getUserList({ enabled: true }),
    api.getAllGroups()
  ])
  const siteOptions = sites.map((s: SiteListSite) => ({ value: s.id, label: s.name }))
  return { siteOptions, users, groups }
}
