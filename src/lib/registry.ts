import type { ComponentData, UITemplate, UITemplateData } from '@dosgato/templating'
import tags from '@iconify-icons/mdi/tags'
import { Cache, rescue } from 'txstate-utils'
import { api } from '$lib'
import UserTagsDialog from './components/UserTagsDialog.svelte'
import { uiConfig } from '../local/index.js'

const templateCache = new Cache(async (_, templateMap: Map<string, EnhancedUITemplate>) => {
  const { templates } = await api.query<{ templates: { key: string, name: string, templateProperties: any, displayCategory?: string, global?: boolean, nopublish: boolean, areas: { name: string, availableComponents: { key: string }[] }[] }[] }>('query enhanceTemplateInfo { templates { key name templateProperties displayCategory global nopublish areas { name availableComponents { key } } } }')
  for (const t of templates) {
    const old = templateMap.get(t.key)
    if (old) {
      old.name = t.name
      old.templateProperties = t.templateProperties
      old.displayCategory = t.displayCategory ?? 'Standard'
      old.areas = new Map()
      ;(old as any).global = t.global
      old.nopublish = t.nopublish
      old.genDefaultContent = typeof old.defaultContent === 'undefined' ? () => ({}) : (typeof old.defaultContent === 'object' ? () => old.defaultContent! : old.defaultContent)
      for (const a of t.areas) old.areas.set(a.name, { name: a.name, availableComponents: new Set(a.availableComponents.map(ac => ac.key)) })
    }
  }
})

interface UITemplateEnhancement {
  name: string
  templateProperties: any
  nopublish: boolean
}

export interface EnhancedUITemplate extends UITemplate, UITemplateEnhancement {
  displayCategory?: string
  areas: Map<string, { name: string, availableComponents: Set<string> }>
  genDefaultContent: (data: ComponentData) => Record<string, ComponentData[]>
}

export interface EnhancedDataTemplate extends UITemplateData, UITemplateEnhancement {
  global?: boolean
}

class TemplateRegistry {
  protected templateMap = new Map<string, EnhancedUITemplate>()

  addTemplate (template: UITemplate) {
    this.templateMap.set(template.templateKey, template as EnhancedUITemplate)
  }

  addTemplates (templates: UITemplate[]) {
    for (const t of templates) this.addTemplate(t)
    this.enhanceInfo().catch(e => console.error(e))
  }

  getTemplate (key: string) {
    return this.templateMap.get(key)
  }

  getDataTemplate (key: string) {
    return this.templateMap.get(key) as EnhancedDataTemplate
  }

  async enhanceInfo () {
    await rescue(templateCache.get(undefined, this.templateMap))
  }
}

export const templateRegistry = new TemplateRegistry()
templateRegistry.addTemplates(uiConfig.templates)
templateRegistry.addTemplate({
  templateKey: 'dosgato-core-tags',
  dialog: UserTagsDialog,
  icon: tags,
  nameColumn: { icon: data => tags, get: data => data.title },
  columns: [{ title: 'Disabled', get: data => data.disabled ? 'Disabled' : '', fixed: '6em' }]
} as UITemplateData)
