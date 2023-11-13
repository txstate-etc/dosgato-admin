import type { UITemplateData } from '@dosgato/templating'
import ColorDialog from './ColorDialog.svelte'
import paletteOutline from '@iconify-icons/mdi/palette-outline'

export const colorDataTemplate: UITemplateData = {
  templateKey: 'keyd1',
  dialog: ColorDialog,
  icon: paletteOutline,
  columns: [
    { title: 'Color', get: 'color' },
    { title: 'Alignment', get: 'align'}
  ],
  responsiveDataColumns(width) {
    if (width > 700) {
      return ['Color', 'Alignment']
    } else if (width > 400) {
      return ['Color']
    }
    return []
  }
}
