import type { UITemplate } from '@dosgato/templating'
import usersThreeThin from '@iconify-icons/ph/users-three-thin'
import TeamDialog from './TeamDialog.svelte'

export const teamTemplate: UITemplate = {
  templateKey: 'team',
  dialog: TeamDialog,
  icon: usersThreeThin
}
