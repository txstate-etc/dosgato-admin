import { api } from '$lib'
import type { UITemplate } from '@dosgato/templating'
import { Cache } from 'txstate-utils'
import { uiConfig } from '../local/index.js'

const templateCache = new Cache(async (_, templateMap: Map<string, EnhancedUITemplate>) => {
  const { templates } = await api.query<{ templates: { key: string, name: string, templateProperties: any, displayCategory?: string, global?: boolean, areas: { name: string, availableComponents: { key: string }[] }[] }[] }>('query enhanceTemplateInfo { templates { key name templateProperties displayCategory global areas { name availableComponents { key } } } }')
  for (const t of templates) {
    const old = templateMap.get(t.key)
    if (old) {
      old.name = t.name
      old.templateProperties = t.templateProperties
      old.displayCategory = t.displayCategory ?? 'Standard'
      old.areas = new Map()
      old.global = t.global
      for (const a of t.areas) old.areas.set(a.name, { name: a.name, availableComponents: new Set(a.availableComponents.map(ac => ac.key)) })
    }
  }
})

export interface EnhancedUITemplate extends UITemplate {
  name: string
  templateProperties: any
  displayCategory?: string
  areas: Map<string, { name: string, availableComponents: Set<string> }>
  global?: boolean
}

class TemplateRegistry {
  protected templateMap = new Map<string, EnhancedUITemplate>()

  addTemplate (template: UITemplate) {
    this.templateMap.set(template.templateKey, template as EnhancedUITemplate)
  }

  addTemplates (templates: UITemplate[]) {
    for (const t of templates) this.addTemplate(t)
  }

  getTemplate (key: string) {
    return this.templateMap.get(key)
  }

  async enhanceInfo () {
    await templateCache.get(undefined, this.templateMap)
  }
}

export const templateRegistry = new TemplateRegistry()
templateRegistry.addTemplates(uiConfig.templates)
