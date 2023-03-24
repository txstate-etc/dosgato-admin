import type { IconifyIcon } from '@iconify/svelte'
import type { SvelteComponent } from 'svelte'

export interface ResponsiveTableIcon {
  icon: IconifyIcon
  hiddenLabel?: string
}

export interface ResponsiveTableRowAction {
  icon: IconifyIcon
  label: string
  onClick: (params: any) => void | Promise<void>
  hiddenLabel?: string
  enabled?: (params: any) => boolean | boolean // based on the row data, should this action be available? For example, maybe no delete button for indirect groups?
}

export interface ResponsiveTableHeader {
  id: string
  label: string
  get?: string
  sortable?: boolean
  component?: SvelteComponent
  icon?: ResponsiveTableIcon | ((item: any) => ResponsiveTableIcon | undefined)
  render?: (item: any) => string
}
