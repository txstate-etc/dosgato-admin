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
import { pageTemplate3 } from './pagetemplate3.js'
import { pageTemplate4 } from './pagetemplate4.js'
import { richText } from './richtext.js'
import { HorizontalRule } from './horizontalrule.js'
import { textImage } from './textimage.js'
import AssetDialog from './AssetDialog.svelte'
import { columnLayoutComponentTemplate } from './columnlayout.js'

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
    pageTemplate3,
    pageTemplate4,
    richText,
    textImage,
    columnLayoutComponentTemplate
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
  },
  environmentTitle: () => 'DEV',
  assetMeta: {
    dialog: AssetDialog,
    details: meta => ({ Title: meta.title, Description: meta.description })
  }
}
