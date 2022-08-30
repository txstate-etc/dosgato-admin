import { articleTemplate } from './article.js'
import { buildingDataTemplate } from './building.js'
import { colorDataTemplate } from './colordata.js'
import { linkTestComponentTemplate } from './linkcomponent.js'
import { panelTemplate } from './panel.js'
import { quoteTemplate } from './quote.js'
import { pageTemplate1 } from './pagetemplate1.js'
import { pageTemplate2 } from './pagetemplate2.js'
import { richText } from './richtext.js'

export * from './login.js'

export const templates = [
  articleTemplate,
  buildingDataTemplate,
  colorDataTemplate,
  linkTestComponentTemplate,
  quoteTemplate,
  panelTemplate,
  pageTemplate1,
  pageTemplate2,
  richText
]
