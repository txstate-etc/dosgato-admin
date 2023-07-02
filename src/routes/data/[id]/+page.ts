import { base } from '$app/paths'
import { subnavStore, templateRegistry } from '$lib'
import codeJson from '@iconify-icons/mdi/code-json'
import { error, type Load } from '@sveltejs/kit'

export const load: Load<{ id: string }> = async ({ params }) => {
  const template = templateRegistry.getTemplate(params.id)
  if (!template) throw error(404)

  await templateRegistry.enhanceInfo()
  subnavStore.open('data', { href: base + '/data/' + template.templateKey, label: template.name, icon: template.icon ?? codeJson })

  return { template }
}
