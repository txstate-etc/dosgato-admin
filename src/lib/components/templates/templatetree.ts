import type { TemplateListTemplateWithAreas, TemplateListTemplateArea } from '$lib'
import type { TypedTreeItem } from '@dosgato/dialog'

export interface TreeTemplate extends Omit<TemplateListTemplateWithAreas, 'type'> {
  type: 'template'
  hasChildren: boolean
}

export interface TreeTemplateArea extends TemplateListTemplateArea {
  type: 'area'
  hasChildren: boolean
}

export type AnyTemplateTreeItem = TreeTemplate | TreeTemplateArea

export type TypedTemplateTreeItem = TypedTreeItem<AnyTemplateTreeItem>
