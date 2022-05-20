import type { UITemplate } from '@dosgato/templating'

class TemplateRegistry {
  protected templateMap = new Map<string, UITemplate>()

  addTemplate (template: UITemplate) {
    this.templateMap.set(template.templateKey, template)
  }

  addTemplates (templates: UITemplate[]) {
    for (const t of templates) this.addTemplate(t)
  }

  getTemplate (key: string) {
    return this.templateMap.get(key)
  }
}

export const templateRegistry = new TemplateRegistry()
