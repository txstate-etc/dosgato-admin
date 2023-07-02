import { api } from '$lib'

export const load = async () => {
  const [templateSet, templates] = await Promise.all([
    api.getDataAccessByTemplateKey(),
    api.getTemplatesByType('DATA')
  ])
  return { templates: templates.filter(t => templateSet.has(t.key)) }
}
