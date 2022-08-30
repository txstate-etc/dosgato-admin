import type { UITemplate } from '@dosgato/templating'
import textAA from '@iconify-icons/ph/text-aa'
import RichTextSvelte from './RichText.svelte'

export const richText: UITemplate = {
  templateKey: 'richtext',
  dialog: RichTextSvelte,
  icon: textAA
}
