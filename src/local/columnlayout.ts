import type { UITemplate } from '@dosgato/templating'
import ColumnLayoutDialog from './ColumnLayoutDialog.svelte'

export const columnLayoutComponentTemplate: UITemplate = {
  templateKey: 'columnlayout',
  dialog: ColumnLayoutDialog
}
