import type { UITemplate } from '@dosgato/templating'
import PageTemplate3Dialog from './PageTemplate3Dialog.svelte'

export const pageTemplate3: UITemplate = {
  templateKey: 'keyp3',
  dialog: PageTemplate3Dialog,
  pageBarButtons: [{ label: 'Styles' }],
  devicePreview: {
    sizes: [
      { label: 'Desktop' },
      { label: 'Small', width: 400, default: true },
      { label: 'Medium', width: 600 },
      { label: 'Large', width: 800 }
    ],
    showWhileEditing: true
  }
}
