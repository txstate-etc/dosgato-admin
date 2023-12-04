import type { UITemplate } from '@dosgato/templating'
import PageTemplate3Dialog from './PageTemplate3Dialog.svelte'

export const pageTemplate3: UITemplate = {
  templateKey: 'keyp3',
  dialog: PageTemplate3Dialog,
  pageBarButtons: [{ label: 'Styles' }]
}
