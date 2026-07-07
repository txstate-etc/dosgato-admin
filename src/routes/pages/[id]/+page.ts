import { error, isHttpError, type Load, redirect } from '@sveltejs/kit'
import { resolve } from '$app/paths'
import { api, pageEditorStore, subnavStore, templateRegistry, type SubNavLink } from '$lib'
import { editPageIcon, editSandboxPageIcon, editArchivePageIcon } from './editpageicon'

const toBeFreed = new Set<string>()

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
    const link = { href: resolve('/pages/[id]', { id: page.id }), label: page.name, icon: getPageIcon(page.pagetree.type), onClose: () => { toBeFreed.add(page.id) } }
    subnavStore.open('pages', link)
    toBeFreed.delete(page.id)
    setTimeout(() => {
      for (const pageId of toBeFreed.values()) pageEditorStore.free(pageId)
      toBeFreed.clear()
    }, 500)
    return { page, pagetemplate, loaded: true }
  } catch (err) {
    if (isHttpError(err, 404)) {
      throw error(404)
    }
    redirect(302, resolve('/pages'))
  }
}
