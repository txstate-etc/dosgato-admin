import type { UITemplate } from '@dosgato/templating'
import userThin from '@iconify-icons/ph/user-thin'
import TeamMemberDialog from './TeamMemberDialog.svelte'

export const teamMemberTemplate: UITemplate = {
  templateKey: 'teammember',
  dialog: TeamMemberDialog,
  icon: userThin
}
