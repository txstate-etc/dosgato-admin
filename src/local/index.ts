import { templateRegistry } from '$lib/registry.js'
import { articleTemplate } from './article.js'
import { buildingDataTemplate } from './building.js'
import { colorDataTemplate } from './colordata.js'
import { linkTestComponentTemplate } from './linkcomponent.js'
import { panelTemplate } from './panel.js'
import { quoteTemplate } from './quote.js'

export * from './login.js'

templateRegistry.addTemplates([
  articleTemplate,
  buildingDataTemplate,
  colorDataTemplate,
  linkTestComponentTemplate,
  quoteTemplate,
  panelTemplate
])
