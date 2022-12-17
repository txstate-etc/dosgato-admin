import applicationEditOutline from '@iconify-icons/mdi/application-edit-outline'
import { error, type Load } from '@sveltejs/kit'
import { base } from '$app/paths'
import { api, pageEditorStore, subnavStore, templateRegistry } from '$lib'
import { getTempToken, type PageSubNavLink } from './helpers'

const toBeFreed = new Set<string>()
function free (link: PageSubNavLink) { toBeFreed.add(link.pageId) }

export const load: Load<{ id: string }> = async ({ params, fetch }) => {
  await templateRegistry.enhanceInfo()
  const page = await api.getEditorPage(params.id)
  if (!page) throw error(404)
  const pagetemplate = templateRegistry.getTemplate(page.data.templateKey)
  if (!pagetemplate) throw error(500, 'Unrecognized Page Template')
  const temptoken = await getTempToken(page, undefined, fetch)
  subnavStore.open('pages', { href: `${base}/pages/${page.id}`, label: page.name, icon: applicationEditOutline, pageId: page.id, onClose: free })
  toBeFreed.delete(page.id)
  setTimeout(() => {
    for (const pageId of toBeFreed.values()) pageEditorStore.free(pageId)
    toBeFreed.clear()
  }, 500)
  return { temptoken, page, pagetemplate }
}
