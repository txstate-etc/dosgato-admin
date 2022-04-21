<script type="ts" context="module">
  import applicationOutline from '@iconify-icons/mdi/application-outline'
  import circleIcon from '@iconify-icons/mdi/circle'
  import pencilIcon from '@iconify-icons/mdi/pencil'
  import publishIcon from '@iconify-icons/mdi/publish'
  import squareIcon from '@iconify-icons/mdi/square'
  import triangleIcon from '@iconify-icons/mdi/triangle'

  const statusIcon = {
    published: triangleIcon,
    modified: circleIcon,
    unpublished: squareIcon
  }
  interface PageItem extends Omit<Omit<Omit<TreePage, 'modifiedAt'>, 'publishedAt'>, 'children'> {
    modifiedAt: DateTime
    publishedAt: DateTime
    hasChildren: boolean
    status: string
  }
  type TypedPageItem = TypedTreeItem<PageItem>

  async function fetchChildren (item?: TypedPageItem) {
    const children = item ? await api.getSubPages(item.id) : await api.getRootPages()
    return children.map(p => {
      const modifiedAt = DateTime.fromISO(p.modifiedAt)
      const publishedAt = DateTime.fromISO(p.publishedAt)
      return {
        ...p,
        children: undefined,
        hasChildren: !!p.children.length,
        modifiedAt,
        publishedAt,
        status: p.published ? (publishedAt >= modifiedAt ? 'published' : 'modified') : 'unpublished'
      } as PageItem
    })
  }
  function singlepageactions (page: TypedPageItem) {
    return [
      { label: 'Edit', icon: pencilIcon, disabled: !page.permissions.update, onClick: () => goto(base + '/pages/' + page.id) },
      { label: 'Publish', icon: publishIcon, disabled: !page.permissions.publish, onClick: () => {} }
    ]
  }
  function multipageactions (pages: TypedPageItem[]) {
    if (!pages?.length) return []
    return [
      { label: 'Move', disabled: pages.some(p => !p.permissions.move), onClick: () => {} },
      { label: 'Publish', disabled: pages.some(p => !p.permissions.publish), onClick: () => {} }
    ]
  }
  async function dropHandler (selectedItems: TypedPageItem[], dropTarget: TypedPageItem, above: boolean) {
    return true
  }
  function dragEligible (item: TypedPageItem) {
    // sites cannot be dragged: they are ordered alphabetically and should not be copied wholesale into other sites
    return !!item.parent
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
  const store: TreeStore<PageItem> = new TreeStore(fetchChildren, { dropHandler, dragEligible, dropEligible, dropEffect })
</script>
<script type="ts">
  import { goto } from '$app/navigation'
  import { DateTime } from 'luxon'
  import { api, ActionPanel, Tree, TreeStore, type TypedTreeItem, type TreePage } from '$lib'
  import { base } from '$app/paths'
  import './index.css'
</script>

<ActionPanel actions={$store.selected.size === 1 ? singlepageactions($store.selectedItems[0]) : multipageactions($store.selectedItems)}>
  <Tree {store} let:item let:level let:isSelected on:choose={({ detail }) => goto(base + '/pages/' + detail.id)}
    headers={[
      { label: 'Path', id: 'name', defaultWidth: 'calc(60% - 16.15em)', icon: item => applicationOutline, get: 'name' },
      { label: 'Title', id: 'title', defaultWidth: 'calc(40% - 10.75em)', get: 'title' },
      { label: 'Template', id: 'template', defaultWidth: '8.5em', get: 'template.name' },
      { label: 'Status', id: 'status', defaultWidth: '4em', icon: item => statusIcon[item.status], class: item => item.status },
      { label: 'Modified', id: 'modified', defaultWidth: '10em', render: item => `<span>${item.modifiedAt.toFormat('LLL d yyyy h:mma').replace(/(AM|PM)$/, v => v.toLocaleLowerCase())}</span>` },
      { label: 'By', id: 'modifiedBy', defaultWidth: '3em', get: 'modifiedBy.id' }
    ]}
  />
</ActionPanel>
