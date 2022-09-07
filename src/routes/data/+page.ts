import { api } from '$lib'

export const load = async () => {
  const templates = await api.getTemplatesByType('DATA')
  return { templates }
}
