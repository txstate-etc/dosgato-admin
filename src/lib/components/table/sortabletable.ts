import type { IconifyIcon } from '@iconify/svelte'

export interface SortableTableIcon {
  icon: IconifyIcon
  hiddenLabel?: string
}

export interface SortableTableRowAction {
  icon: IconifyIcon
  label: string
  onClick: (params: any) => void | Promise<void>
  hiddenLabel?: string
  enabled?: (params: any) => boolean | boolean // based on the row data, should this action be available? For example, maybe no delete button for indirect groups?
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
  actions?: SortableTableRowAction[]
}
