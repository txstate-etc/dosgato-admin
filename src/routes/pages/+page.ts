import { DateTime } from 'luxon'
import { api, mutationResponse, TreeStore, type RootTreePage, type TreePage, type TypedTreeItem } from '$lib'

export interface PageItem extends Omit<Omit<Omit<TreePage, 'modifiedAt'>, 'publishedAt'>, 'children'> {
  modifiedAt: DateTime
  publishedAt: DateTime
  hasChildren: boolean
  status: string
  type: RootTreePage['pagetree']['type']
}
export type TypedPageItem = TypedTreeItem<PageItem>

async function fetchChildren (item?: TypedPageItem) {
  const children = item ? await api.getSubPages(item.id) : await api.getRootPages()
  return children.map<PageItem>(p => {
    const modifiedAt = DateTime.fromISO(p.modifiedAt)
    const publishedAt = DateTime.fromISO(p.publishedAt)
    const rootp = p as RootTreePage
    return {
      ...p,
      name: p.name + (item || rootp.pagetree.type === 'PRIMARY' ? '' : `-${rootp.pagetree.name} (${rootp.pagetree.type})`),
      type: item?.type ?? rootp.pagetree.type,
      children: undefined,
      hasChildren: !!p.children.length,
      modifiedAt,
      publishedAt,
      status: p.published ? (publishedAt >= modifiedAt ? 'published' : 'modified') : 'unpublished'
    }
  })
}

async function dropHandler (selectedItems: TypedPageItem[], dropTarget: TypedPageItem, above: boolean) {
  const resp = await api.query(`mutation movePages ($pageIds: [ID!]!, $targetId: ID!, $above: Boolean) {
    movePages (pageIds: $pageIds, targetId: $targetId, above: $above) {
      ${mutationResponse}
    }
  }`, { pageIds: selectedItems.map(itm => itm.id), targetId: dropTarget.id, above })
  return resp.success
}
function dragEligible (items: TypedPageItem[]) {
  // sites cannot be dragged: they are ordered alphabetically and should not be copied wholesale into other sites
  return items.every(item => !!item.parent && item.permissions.move)
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
