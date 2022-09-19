import { DateTime } from 'luxon'
import { api, TreeStore, type TreePage, type TypedTreeItem } from '$lib'

export interface PageItem extends Omit<Omit<Omit<TreePage, 'modifiedAt'>, 'publishedAt'>, 'children'> {
  modifiedAt: DateTime
  publishedAt: DateTime
  hasChildren: boolean
  status: string
}
export type TypedPageItem = TypedTreeItem<PageItem>

async function fetchChildren (item?: TypedPageItem) {
  const children = item ? await api.getSubPages(item.id) : await api.getRootPages()
  return children.map<PageItem>(p => {
    const modifiedAt = DateTime.fromISO(p.modifiedAt)
    const publishedAt = DateTime.fromISO(p.publishedAt)
    return {
      ...p,
      children: undefined,
      hasChildren: !!p.children.length,
      modifiedAt,
      publishedAt,
      status: p.published ? (publishedAt >= modifiedAt ? 'published' : 'modified') : 'unpublished'
    }
  })
}

async function dropHandler (selectedItems: TypedPageItem[], dropTarget: TypedPageItem, above: boolean) {
  return true
}
function dragEligible (items: TypedPageItem[]) {
  // sites cannot be dragged: they are ordered alphabetically and should not be copied wholesale into other sites
  return items.every(item => !!item.parent)
}
function dropEligible (selectedItems: TypedPageItem[], dropTarget: TypedPageItem, above: boolean) {
  // cannot place an item at the root: instead create a new site in the site management UI
  if (!dropTarget.parent && above) return false
  return above ? dropTarget.parent!.permissions.create : dropTarget.permissions.create
}
function dropEffect (selectedItems: TypedPageItem[], dropTarget: TypedPageItem, above: boolean) {
  const selectedSites = new Set<string>()
  let noMovePerm = false
  for (const slctd of selectedItems) {
    const ancestors = store.collectAncestors(slctd)
    selectedSites.add((ancestors[ancestors.length - 1] ?? slctd).id)
    if (!slctd.permissions.move) noMovePerm = true
  }
  if (selectedSites.size > 1 || noMovePerm) return 'copy'
  const anc = store.collectAncestors(dropTarget)
  const targetSite = (anc[anc.length - 1] ?? dropTarget).id
  return selectedSites.has(targetSite) ? 'move' : 'copy'
}

export const store: TreeStore<PageItem> = new TreeStore(fetchChildren, { dropHandler, dragEligible, dropEligible, dropEffect })
