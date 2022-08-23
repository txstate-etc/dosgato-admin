import type { TemplateListTemplate } from '$lib/queries'
import { Store } from '@txstate-mws/svelte-store'

interface ITemplateListStore {
  templates: TemplateListTemplate[]
}

class TemplateListStore extends Store<ITemplateListStore> {
  constructor () {
    super({ templates: [] })
  }
}

export const templateListStore = new TemplateListStore()
