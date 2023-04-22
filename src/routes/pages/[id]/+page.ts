import { error, type Load } from '@sveltejs/kit'
import { base } from '$app/paths'
import { api, pageEditorStore, subnavStore, templateRegistry } from '$lib'
import type { PageSubNavLink } from './helpers'
import { editPageIcon } from './editpageicon'

const toBeFreed = new Set<string>()
function free (link: PageSubNavLink) { toBeFreed.add(link.pageId) }

export const load: Load<{ id: string }> = async ({ params, fetch }) => {
  await templateRegistry.enhanceInfo()
  const page = await api.getEditorPage(params.id)
  if (!page) throw error(404)
  const pagetemplate = templateRegistry.getTemplate(page.data.templateKey)
  if (!pagetemplate) throw error(500, 'Unrecognized Page Template')
  subnavStore.open('pages', { href: `${base}/pages/${page.id}`, label: page.name, icon: editPageIcon, pageId: page.id, onClose: free })
  toBeFreed.delete(page.id)
  setTimeout(() => {
    for (const pageId of toBeFreed.values()) pageEditorStore.free(pageId)
    toBeFreed.clear()
  }, 500)
  return { page, pagetemplate }
}
