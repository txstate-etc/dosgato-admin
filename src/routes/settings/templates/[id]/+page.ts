import { error, type Load } from '@sveltejs/kit'
import { api, subnavStore, TemplateDetailStore, templateRegistry } from '$lib'
import { base } from '$app/paths'
import boundingBoxLight from '@iconify-icons/ph/bounding-box-light'

export const _store = new TemplateDetailStore(api.getTemplateWithAreasByKey.bind(api))

export const load: Load<{ id: string }> = async ({ params }) => {
  const template = await _store.refresh(params.id)
  if (!_store.templateFetched()) throw error(404)
  subnavStore.open('templates', { label: template.name, href: base + '/settings/templates/' + template.id, icon: templateRegistry.getTemplate(template.key)?.icon ?? boundingBoxLight })
}
