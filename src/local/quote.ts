import type { UITemplate } from '@dosgato/templating'
import quotesThin from '@iconify-icons/ph/quotes-thin'
import QuoteDialog from './QuoteDialog.svelte'

export const quoteTemplate: UITemplate = {
  templateKey: 'keyc3',
  dialog: QuoteDialog,
  icon: quotesThin
}
