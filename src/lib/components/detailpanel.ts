import type { IconifyIcon } from '@iconify/svelte'
export interface DetailPanelButton {
  icon: IconifyIcon
  onClick: () => void|Promise<void>
}
