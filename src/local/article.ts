import type { UITemplate } from '@dosgato/templating'
import ArticleDialog from './ArticleDialog.svelte'

export const articleTemplate: UITemplate = {
  templateKey: 'articledatakey',
  dialog: ArticleDialog,
  icon: {
    raw: true,
    body: `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 108 117">
        <rect width="108" height="117" fill="#c9c9c9"/>
        <rect y="45" width="108" height="27" fill="#c9c9c9"/>
        <rect y="45" width="108" height="27" fill="#fff"/>
        <rect y="54" width="108" height="9" fill="#666"/>
      </svg>`
  }
}
