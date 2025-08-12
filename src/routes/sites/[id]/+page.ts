import { base } from '$app/paths'
import { api, siteListStore, SiteDetailStore, subnavStore } from '$lib'
import globe from '@iconify-icons/ph/globe'
import { error, type Load } from '@sveltejs/kit'

export const _store = new SiteDetailStore(getSite)

export const load: Load<{ id: string }> = async ({ params }) => {
  const [organizations, users, allPageTemplates, allComponentTemplates, site] = await Promise.all([
    api.getOrganizationList(),
    api.getUserList({ system: false }),
    api.getTemplatesByType('PAGE'),
    api.getTemplatesByType('COMPONENT'),
    _store.refresh(params.id)
  ])

  if (!_store.siteFetched()) throw error(404)

  subnavStore.open('sites', { label: site.name, href: base + '/sites/' + site.id, icon: globe })
  siteListStore.open({ id: params.id, name: site.name })
  return { organizations, users, allPageTemplates, allComponentTemplates }
}

async function getSite (id: string) {
  return await api.getSiteById(id)
}
