import type { IconifyIcon } from '@iconify/svelte'
export interface ActionPanelAction {
  // an id for the action in case you have two complementary actions like delete and undelete
  // where one is always hidden and the other is shown
  id?: string
  label: string
  icon?: IconifyIcon
  disabled?: boolean
  onClick: () => void|Promise<void>
}
