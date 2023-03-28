import type { UIConfig } from '@dosgato/templating'
import { redirect } from '@sveltejs/kit'
import { articleTemplate } from './article.js'
import { buildingDataTemplate } from './building.js'
import { colorDataTemplate } from './colordata.js'
import { linkTestComponentTemplate } from './linkcomponent.js'
import { panelTemplate } from './panel.js'
import { quoteTemplate } from './quote.js'
import { pageTemplate1 } from './pagetemplate1.js'
import { pageTemplate2 } from './pagetemplate2.js'
import { richText } from './richtext.js'
import { HorizontalRule } from './horizontalrule.js'

export const uiConfig: UIConfig = {
  templates: [
    articleTemplate,
    buildingDataTemplate,
    colorDataTemplate,
    linkTestComponentTemplate,
    quoteTemplate,
    HorizontalRule,
    panelTemplate,
    pageTemplate1,
    pageTemplate2,
    richText
  ],
  login: {
    handleUnauthorized (environmentConfig: any) {
      const authRedirect = new URL(environmentConfig.authRedirect)
      authRedirect.searchParams.set('returnUrl', `${location.origin}/.admin`)
      authRedirect.searchParams.set('requestedUrl', location.href)
      throw redirect(302, authRedirect.toString())
    },

    getRedirect ({ url }: { url: URL }) {
      const { searchParams } = url
      return searchParams.get('requestedUrl') ?? undefined
    },

    getToken ({ url }: { url: URL }) {
      const { searchParams } = url
      return searchParams.get('unifiedJwt') ?? undefined
    }
  }
}
