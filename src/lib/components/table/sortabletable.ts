import type { IconifyIcon } from '@iconify/svelte'

export interface SortableTableIcon {
  icon: IconifyIcon
  hiddenLabel?: string
}

export interface SortableTableRowAction {
  icon: IconifyIcon
  label: string
  onClick: (params: any) => void | Promise<void>
  hiddenLabel?: string | ((item: any) => string)
  allowed?: (item: any) => boolean
  class?: string // Optional class for custom styling
}

export interface SortableTableHeader {
  id: string
  label: string
  hideHeader?: boolean
  get?: string
  sortable?: boolean
  sortFunction?: (item: any) => string | number | boolean | Date
  icon?: SortableTableIcon | ((item: any) => SortableTableIcon | undefined)
  render?: (item: any) => string
  component?: any
  actions?: SortableTableRowAction[] | ((item: any) => SortableTableRowAction[])
  combinedActionsLabel?: string
  widthPercent?: number
  mobileRole?: 'title' | 'subtitle'
}
