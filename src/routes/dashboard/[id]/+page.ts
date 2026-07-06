import { resolve } from '$app/paths'
import { api, apiSiteToDashboardSite, subnavStore, type DashboardSiteDetailRaw } from '$lib'
import { error, type Load } from '@sveltejs/kit'
import browserIcon from '@iconify-icons/ph/browser'

export const load: Load<{ id: string }> = async ({ params }) => {
  const rawSite: DashboardSiteDetailRaw = await api.getDashboardSiteById(params.id)
  if (!rawSite) throw error (404)
  const site = apiSiteToDashboardSite(rawSite)
  subnavStore.open('dashboard', { label: site.name, href: resolve('/dashboard/[id]', { id: site.id }), icon: browserIcon })
  return { site }
}
