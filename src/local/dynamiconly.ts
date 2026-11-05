import type { UITemplate } from '@dosgato/templating'
import DynamicOnlyDialog from './DynamicOnly.svelte'

export const dynamicOnlyComponentTemplate: UITemplate = {
  templateKey: 'dynonly',
  dialog: DynamicOnlyDialog
}
