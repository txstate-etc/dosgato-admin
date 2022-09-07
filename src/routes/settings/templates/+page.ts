import { api, templateListStore } from '$lib'

export const load: PageLoad = async () => {
  const templates = await api.getAllTemplates()
  templateListStore.update(v => ({ ...v, templates }))
  return {}
}
