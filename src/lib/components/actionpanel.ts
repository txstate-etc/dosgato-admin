import type { IconifyIcon } from '@iconify/svelte'
export interface ActionPanelAction {
  // an id for the action in case you have two complementary actions like delete and undelete
  // where one is always hidden and the other is shown
  id?: string
  label: string
  class?: string
  hiddenLabel?: string
  icon?: IconifyIcon
  iconWidth?: number
  disabled?: boolean
  onClick: () => void | Promise<void>
}

export interface ActionPanelGroup {
  id: string
  actions: ActionPanelAction[]
}
