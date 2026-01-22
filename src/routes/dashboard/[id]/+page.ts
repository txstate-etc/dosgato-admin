import { base } from '$app/paths'
import { api, subnavStore, type DashboardSiteDetailDisplay } from '$lib'
import type { Load } from '@sveltejs/kit'
import browserIcon from '@iconify-icons/ph/browser'

export const load: Load<{ id: string }> = async ({ params }) => {
  const site: DashboardSiteDetailDisplay = await api.getDashboardSiteById(params.id)

  subnavStore.open('dashboard', { label: site.name, href: base + '/dashboard/' + site.id, icon: browserIcon })
  return { site }
}
