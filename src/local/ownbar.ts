import type { UITemplate } from '@dosgato/templating'
import OwnBarDialog from './OwnBarDialog.svelte'

// renders its own edit bar inside its markup (see dosgato-render test/components/ownbar.ts)
export const ownBarComponentTemplate: UITemplate = {
  templateKey: 'ownbar',
  dialog: OwnBarDialog
}
