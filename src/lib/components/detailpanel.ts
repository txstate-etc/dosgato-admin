import type { IconifyIcon } from '@iconify/svelte'
export interface DetailPanelButton {
  icon: IconifyIcon
  hiddenLabel?: string
  onClick: () => void | Promise<void>
  disabled?: boolean
}
