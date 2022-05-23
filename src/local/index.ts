import { templateRegistry } from '$lib/registry.js'
import { articleTemplate } from './article.js'
import { buildingDataTemplate } from './building.js'
import { colorDataTemplate } from './colordata.js'
import { linkTestComponentTemplate } from './linkcomponent.js'

export * from './login.js'

templateRegistry.addTemplates([
  articleTemplate,
  buildingDataTemplate,
  colorDataTemplate,
  linkTestComponentTemplate
])
