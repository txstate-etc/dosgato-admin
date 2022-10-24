import type { UITemplate } from '@dosgato/templating'
import PageTemplate2Dialog from './PageTemplate2Dialog.svelte'

export const pageTemplate2: UITemplate = {
  templateKey: 'keyp2',
  dialog: PageTemplate2Dialog,
  defaultContent: {
    main: [{ templateKey: 'keyc3', author: 'Test Author', quote: 'This quote should appear by default.' }]
  }
}
