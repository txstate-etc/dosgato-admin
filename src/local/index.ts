import { templateRegistry } from '$lib/registry.js'
import { articleTemplate } from './article.js'

export * from './login.js'

templateRegistry.addTemplates([
  articleTemplate
])
