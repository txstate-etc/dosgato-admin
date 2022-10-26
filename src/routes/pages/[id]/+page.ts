import applicationEditOutline from '@iconify-icons/mdi/application-edit-outline'
import { error, type Load } from '@sveltejs/kit'
import { base } from '$app/paths'
import { api, environmentConfig, pageEditorStore, type SubNavLink, subnavStore, templateRegistry, type PageEditorPage } from '$lib'

interface PageSubNavLink extends SubNavLink {
  pageId: string
}

const toBeFreed = new Set<string>()
function free (link: PageSubNavLink) { toBeFreed.add(link.pageId) }

export async function getTempToken (page: PageEditorPage, skfetch = fetch) {
  const resp = await skfetch(environmentConfig.renderBase + '/token' + page.path, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${api.token ?? ''}`
    }
  })
  return await resp.text()
}

export const load: Load<{ id: string }> = async ({ params, fetch }) => {
  await templateRegistry.enhanceInfo()
  const page = await api.getEditorPage(params.id)
  if (!page) throw error(404)
  const temptoken = await getTempToken(page, fetch)
  subnavStore.open('pages', { href: `${base}/pages/${page.id}`, label: page.name, icon: applicationEditOutline, pageId: page.id, onClose: free })
  toBeFreed.delete(page.id)
  setTimeout(() => {
    for (const pageId of toBeFreed.values()) pageEditorStore.free(pageId)
    toBeFreed.clear()
  }, 500)
  return { temptoken, page }
}
