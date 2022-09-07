import { api } from '$lib'

export const load = async () => {
  const pageTemplates = await api.getTemplatesByType('PAGE')
  const pageTemplateChoices = pageTemplates.map(t => ({ label: t.name, value: t.id }))
  return { pageTemplateChoices }
}
