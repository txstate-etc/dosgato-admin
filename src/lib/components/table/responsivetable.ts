import type { IconifyIcon } from '@iconify/svelte'
import type { SvelteComponent } from 'svelte'

export interface ResponsiveTableIcon {
  icon: IconifyIcon
  hiddenLabel?: string
}

export interface ResponsiveTableRowAction {
  icon: IconifyIcon
  label: string
  onClick: (params) => void|Promise<void>
  hiddenLabel?: string
}

export interface ResponsiveTableHeader {
  id: string
  label: string
  get?: string
  component?: SvelteComponent
  icon?: ResponsiveTableIcon|((item: any) => ResponsiveTableIcon|undefined)
  render?: (item: any) => string
}
