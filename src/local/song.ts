import type { UITemplate } from '@dosgato/templating'
import SongDialog from './SongDialog.svelte'
import songIcon from '@iconify-icons/ph/music-notes-fill'

export const songTemplate: UITemplate = {
  templateKey: 'songdatakey',
  dialog: SongDialog,
  icon: songIcon
}
