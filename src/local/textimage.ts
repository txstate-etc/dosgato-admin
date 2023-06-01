import type { UITemplate } from '@dosgato/templating'
import textAA from '@iconify-icons/ph/text-aa'
import TextImageSvelte from './TextImage.svelte'

export const textImage: UITemplate = {
  templateKey: 'textimage',
  dialog: TextImageSvelte,
  icon: textAA
}
