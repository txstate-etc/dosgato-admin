import { api, templateListStore } from '$lib'
import type { Load } from '@sveltejs/kit'

export const load: Load = async () => {
  const templates = await api.getAllTemplates()
  templateListStore.update(v => ({ ...v, templates }))
  return {}
}
