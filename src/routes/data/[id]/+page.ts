import { base } from '$app/paths'
import { api, dataListStore, subnavStore, templateRegistry } from '$lib'
import codeJson from '@iconify-icons/mdi/code-json'
import { error, type Load } from '@sveltejs/kit'

export const load: Load<{ id: string }> = async ({ params }) => {
  const template = await api.getTemplateInfo(params.id)
  if (!template) throw error(404)

  subnavStore.open('data', { href: base + '/data/' + template.key, label: template.name, icon: templateRegistry.getTemplate(template.key)?.icon ?? codeJson })
  dataListStore.open({ id: params.id, name: template.name })

  const mayManageGlobalData = await api.getGlobalDataAccessByTemplateKey(template.key)
  return { mayManageGlobalData }
}
