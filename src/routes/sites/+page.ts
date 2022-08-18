import { api } from '$lib'
import type { PageLoad } from './$types'

export const load: PageLoad = async () => {
  const pageTemplates = await api.getTemplatesByType('PAGE')
  const pageTemplateChoices = pageTemplates.map(t => ({ label: t.name, value: t.id }))
  return { pageTemplateChoices }
}
