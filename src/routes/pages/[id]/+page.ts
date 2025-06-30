import { error, type Load, redirect } from '@sveltejs/kit'
import { base } from '$app/paths'
import { api, pageEditorStore, subnavStore, templateRegistry } from '$lib'
import type { PageSubNavLink } from './helpers'
import { editPageIcon, editSandboxPageIcon, editArchivePageIcon } from './editpageicon'

const toBeFreed = new Set<string>()
function free (link: PageSubNavLink) { toBeFreed.add(link.pageId) }

function getPageIcon (type: string) {
  return type === 'PRIMARY' ? editPageIcon : (type === 'SANDBOX' ? editSandboxPageIcon : editArchivePageIcon)
}

export const load: Load<{ id: string }> = async ({ params }) => {
  await templateRegistry.enhanceInfo()
  try {
    const page = await api.getEditorPage(params.id)
    if (!page) throw error(404)
    const pagetemplate = templateRegistry.getTemplate(page.data.templateKey)
    if (!pagetemplate) throw error(500, 'Unrecognized Page Template')
    subnavStore.open('pages', { href: `${base}/pages/${page.id}`, label: page.name, icon: getPageIcon(page.pagetree.type), pageId: page.id, onClose: free })
    toBeFreed.delete(page.id)
    setTimeout(() => {
      for (const pageId of toBeFreed.values()) pageEditorStore.free(pageId)
      toBeFreed.clear()
    }, 500)
    return { page, pagetemplate, loaded: true }
  } catch (err) {
    if (err.status === 404) {
      throw error(404)
    }
    redirect(302, `${base}/pages`)
  }
}
