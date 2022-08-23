import { api, siteListStore, SiteDetailStore } from '$lib'
import { error } from '@sveltejs/kit'
import type { PageLoad } from './$types'

export const store = new SiteDetailStore(getSite)

export const load: PageLoad = async ({ params }) => {
  const site = await store.refresh(params.id)
  if (!store.siteFetched()) throw error(404)

  const [organizations, users, pageTemplates, componentTemplates] = await Promise.all([
    api.getOrganizationList(),
    api.getUserList({ system: false }),
    api.getTemplatesByType('PAGE', false),
    api.getTemplatesByType('COMPONENT', false)
  ])
  siteListStore.open({ id: params.id, name: site.name })
  return { organizations, users, pageTemplates, componentTemplates }
}

async function getSite (id: string) {
  return await api.getSiteById(id)
}
