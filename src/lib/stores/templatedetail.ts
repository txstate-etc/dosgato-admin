import type { TemplateListTemplateWithAreas } from '$lib'
import { Store } from '@txstate-mws/svelte-store'

interface ITemplateDetailStore {
  template: TemplateListTemplateWithAreas
}

const initialValue: TemplateListTemplateWithAreas = { id: '', key: '', name: '', universal: false, type: 'COMPONENT', permissions: { setUniversal: false, assign: false }, areas: [] }

export class TemplateDetailStore extends Store<ITemplateDetailStore> {
  constructor (public fetchTemplate: (key: string) => Promise<TemplateListTemplateWithAreas>) {
    super({ template: initialValue })
  }

  async refresh (key: string) {
    const template = await this.fetchTemplate(key)
    this.set({ template })
    return template
  }

  templateFetched () {
    return this.value.template.key.length > 0
  }
}
