import type { UITemplate } from '@dosgato/templating'
import creditCardThin from '@iconify-icons/ph/credit-card-thin'
import PanelDialog from './PanelDialog.svelte'

export const panelTemplate: UITemplate = {
  templateKey: 'keyc2',
  dialog: PanelDialog,
  icon: creditCardThin
}
