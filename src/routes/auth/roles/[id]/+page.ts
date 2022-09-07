import { error, type Load } from '@sveltejs/kit'
import { api, RoleDetailStore, type SiteListSite } from '$lib'

export const store = new RoleDetailStore(api.getRoleById.bind(api))

export const load: Load<{ id: string }> = async ({ params }) => {
  await store.refresh(params.id)
  if (!store.roleFetched()) throw error(404)
  const sites = await api.getSiteList()
  const siteOptions = sites.map((s: SiteListSite) => ({ value: s.id, label: s.name }))
  return { siteOptions }
}
