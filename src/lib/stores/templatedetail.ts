import { api, type TemplateListTemplateWithAreas } from '$lib'
import { Store } from '@txstate-mws/svelte-store'

interface ITemplateDetailStore {
  template: TemplateListTemplateWithAreas
  pagetrees: { id: string, name: string, type: string }[]
  pageTemplates: { key: string, name: string }[]
}

const initialValue: TemplateListTemplateWithAreas = { id: '', key: '', name: '', universal: false, type: 'COMPONENT', permissions: { setUniversal: false, assign: false }, areas: [] }

export class TemplateDetailStore extends Store<ITemplateDetailStore> {
  constructor (public fetchTemplate: (key: string) => Promise<TemplateListTemplateWithAreas>) {
    super({ template: initialValue, pagetrees: [], pageTemplates: [] })
  }

  async refresh (key: string) {
    const template = await this.fetchTemplate(key)
    let pagetrees: { id: string, name: string, type: string }[] = []
    if (!template.universal) {
      const templateWithPagetrees = await api.getRestrictedTemplatePagetrees(key)
      pagetrees = templateWithPagetrees?.pagetrees ?? []
    }
    let pageTemplates: { key: string, name: string }[] = []
    if (template.type === 'COMPONENT') {
      pageTemplates = await api.getPageTemplatesAllowingComponent(key)
    }
    this.set({ template, pagetrees, pageTemplates })
    return template
  }

  templateFetched () {
    return this.value.template.key.length > 0
  }
}
