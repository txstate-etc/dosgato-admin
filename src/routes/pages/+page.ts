import { DateTime } from 'luxon'
import { TreeStore, type TypedTreeItem } from '@dosgato/dialog'
import { api, type RootTreePage, type TreePage } from '$lib'

export interface PageItem extends Omit<Omit<Omit<TreePage, 'modifiedAt'>, 'publishedAt'>, 'children'> {
  modifiedAt: DateTime
  publishedAt?: DateTime
  hasChildren: boolean
  status: string
  type: RootTreePage['pagetree']['type']
}
export type TypedPageItem = TypedTreeItem<PageItem>

async function fetchChildren (item?: TypedPageItem) {
  const children = item ? await api.getSubPages(item.id) : await api.getRootPages()
  return children.map<PageItem>(p => {
    const modifiedAt = DateTime.fromISO(p.modifiedAt)
    const publishedAt = p.publishedAt ? DateTime.fromISO(p.publishedAt) : undefined
    const rootp = p as RootTreePage
    return {
      ...p,
      name: item ? p.name : rootp.pagetree.name,
      type: item?.type ?? rootp.pagetree.type,
      children: undefined,
      hasChildren: !!p.children.length,
      modifiedAt,
      publishedAt,
      status: p.published ? (p.hasUnpublishedChanges ? 'modified' : 'published') : 'unpublished'
    }
  })
}

async function moveHandler (selectedItems: TypedPageItem[], dropTarget: TypedPageItem, above: boolean) {
  return await api.movePages(selectedItems.map(itm => itm.id), dropTarget.id, above)
}
async function copyHandler (selectedItems: TypedPageItem[], dropTarget: TypedPageItem, above: boolean) {
  return await api.copyPages(selectedItems.map(itm => itm.id), dropTarget.id, above)
}
function dragEligible (items: TypedPageItem[], userWantsCopy: boolean) {
  // site roots cannot be dragged: they are ordered alphabetically and should not be copied wholesale into other sites
  // move permission is required for moves but you can copy things you can't move
  return items.every(item => !!item.parent && (userWantsCopy || item.permissions.move))
}
function dropEffect (selectedItems: TypedPageItem[], dropTarget: TypedPageItem, above: boolean, userWantsCopy: boolean) {
  const actualTargetParent = above ? dropTarget.parent : dropTarget
  if (!actualTargetParent?.permissions.create) return 'none'
  // if we don't have permission to move one of the selected items then the user needs to request a copy operation
  if (selectedItems.some(p => !p.permissions.move)) return userWantsCopy ? 'copy' : 'none'
  const dropRoot = _store.root(actualTargetParent)
  const selectedItemsInSameSiteAsTarget = selectedItems.filter(p => _store.root(p).id === dropRoot.id)
  if (selectedItemsInSameSiteAsTarget.length === selectedItems.length) {
    return userWantsCopy ? 'copy' : 'move' // if within the site the user can do whatever they are requesting
  } else if (selectedItemsInSameSiteAsTarget.length) {
    return 'none' // mixing pages from target site and some other site - weird, how about no
  } else {
    return 'copy' // if dragging to another site the operation will be forced into a copy
  }
}

export const _store = new TreeStore<PageItem>(fetchChildren, { copyHandler, dragEligible, dropEffect, moveHandler })
