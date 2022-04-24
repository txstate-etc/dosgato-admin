import type { IconifyIcon } from '@iconify/svelte'
export interface ActionPanelAction {
  label: string
  icon?: IconifyIcon
  disabled?: boolean
  onClick: () => void|Promise<void>
}
