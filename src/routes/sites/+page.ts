import { api } from '$lib'
import { Store } from '@txstate-mws/svelte-store'

export const load = async () => {
  const pageTemplates = await api.getTemplatesByType('PAGE')
  const pageTemplateChoices = pageTemplates.map(t => ({ label: t.name, value: t.key }))
  return { pageTemplateChoices }
}

export const _siteFilterStore = new Store({ search: '' })
