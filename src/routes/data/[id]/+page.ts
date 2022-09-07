import { api, dataListStore } from '$lib'
import { error, type Load } from '@sveltejs/kit'

export const load: Load<{ id: string }> = async ({ params }) => {
  const template = await api.getTemplateInfo(params.id)
  if (!template) throw error(404)

  dataListStore.open({ id: params.id, name: template.name })

  const mayManageGlobalData = await api.getGlobalDataAccessByTemplateKey(template.key)
  return { mayManageGlobalData }
}
