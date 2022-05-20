import type { UITemplate } from '@dosgato/templating'
import ArticleDialog from './ArticleDialog.svelte'

export const articleTemplate: UITemplate = {
  templateKey: 'articledatakey',
  dialog: ArticleDialog,
  icon: { raw: true, body: '<path></path>' }
}
