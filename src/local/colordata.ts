import type { UITemplate } from '@dosgato/templating'
import ColorDialog from './ColorDialog.svelte'
import paletteOutline from '@iconify-icons/mdi/palette-outline'

export const colorDataTemplate: UITemplate = {
  templateKey: 'keyd1',
  dialog: ColorDialog,
  icon: paletteOutline
}
