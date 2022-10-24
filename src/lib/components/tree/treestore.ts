import { ActiveStore, derivedStore } from '@txstate-mws/svelte-store'
import type { IconifyIcon } from '@iconify/svelte'
import type { SvelteComponent } from 'svelte'
import { keyby } from 'txstate-utils'

export const TREE_STORE_CONTEXT = {}

export interface TreeItemFromDB {
  id: string
  hasChildren?: boolean
}

export interface TreeItem<T extends TreeItemFromDB> extends TreeItemFromDB {
  level: number
  parent?: TypedTreeItem<T>
  loading?: boolean
  open?: boolean
  children?: TypedTreeItem<T>[]
}

export type TypedTreeItem<T extends TreeItemFromDB> = TreeItem<T> & T

export interface ITreeStore<T extends TreeItemFromDB> {
  loading?: boolean
  rootItems?: TypedTreeItem<T>[]
  itemsById: Record<string, TypedTreeItem<T> | undefined>
  focused?: TypedTreeItem<T>
  selected: Map<string, TypedTreeItem<T>>
  selectedItems: TypedTreeItem<T>[]
  viewUnder?: TypedTreeItem<T>
  viewItems: TypedTreeItem<T>[]
  viewDepth: number
  draggable: boolean
  selectedUndraggable?: boolean
  dragging: boolean
}

export type FetchChildrenFn<T extends TreeItemFromDB> = (item?: TypedTreeItem<T>) => Promise<T[]>
export type DragEligibleFn<T extends TreeItemFromDB> = (selectedItems: TypedTreeItem<T>[]) => boolean
export type DropEligibleFn<T extends TreeItemFromDB> = (selectedItems: TypedTreeItem<T>[], dropTarget: TypedTreeItem<T>, above: boolean) => boolean
export type DropEffectFn<T extends TreeItemFromDB> = (selectedItems: TypedTreeItem<T>[], dropTarget: TypedTreeItem<T>, above: boolean) => 'move' | 'copy'
export type DropHandlerFn<T extends TreeItemFromDB> = (selectedItems: TypedTreeItem<T>[], dropTarget: TypedTreeItem<T>, above: boolean) => boolean | Promise<boolean>

export interface TreeHeader<T extends TreeItemFromDB> {
  id: string
  label: string
  defaultWidth: string
  icon?: IconifyIcon | ((item: TypedTreeItem<T>) => IconifyIcon | undefined)
  get?: string
  render?: (item: TypedTreeItem<T>) => string
  component?: SvelteComponent
  class?: (item: TypedTreeItem<T>) => string | string[]
}

export class TreeStore<T extends TreeItemFromDB> extends ActiveStore<ITreeStore<T>> {
  public treeElement?: HTMLElement

  public draggable = derivedStore(this, 'draggable')
  public dragging = derivedStore(this, 'dragging')
  public selectedUndraggable = derivedStore(this, 'selectedUndraggable')
  public selected = derivedStore(this, 'selected')
  public focused = derivedStore(this, 'focused')
  public viewUnderStore = derivedStore(this, 'viewUnder')
  public viewDepth = derivedStore(this, 'viewDepth')
  public viewItems = derivedStore(this, 'viewItems')

  public dropHandler?: DropHandlerFn<T>
  public dragEligibleHandler?: DragEligibleFn<T>
  public dropEligibleHandler?: DropEligibleFn<T>
  public dropEffectHandler?: DropEffectFn<T>
  public singleSelect?: boolean

  private refreshPromise?: Promise<void>

  constructor (
    public fetchChildren: FetchChildrenFn<T>,
    { dropHandler, dragEligible, dropEligible, dropEffect, singleSelect }: {
      dropHandler?: DropHandlerFn<T>
      dragEligible?: DragEligibleFn<T>
      dropEligible?: DropEligibleFn<T>
      dropEffect?: DropEffectFn<T>
      singleSelect?: boolean
    } = {}
  ) {
    super({ itemsById: {}, viewItems: [], viewDepth: Infinity, selected: new Map(), selectedItems: [], dragging: false, draggable: !!dropHandler })
    this.dropHandler = dropHandler
    this.dragEligibleHandler = dragEligible
    this.dropEligibleHandler = dropEligible
    this.dropEffectHandler = dropEffect
    this.singleSelect = singleSelect
  }

  async visit (item: TypedTreeItem<T>, cb: (item: TypedTreeItem<T>) => Promise<void>) {
    await cb(item)
    await Promise.all((item.children ?? []).map(async child => await this.visit(child, cb)))
  }

  visitSync (item: TypedTreeItem<T>, cb: (item: TypedTreeItem<T>) => void) {
    cb(item)
    for (const child of item.children ?? []) this.visitSync(child, cb)
  }

  addLookup (items: TypedTreeItem<T>[]) {
    for (const item of items) {
      this.visitSync(item, itm => {
        this.value.itemsById[itm.id] = itm
        if (this.value.selected.has(itm.id)) this.value.selected.set(itm.id, itm)
      })
    }
    this.cleanSelected()
  }

  cleanSelected () {
    for (const selected of this.value.selected.values()) {
      if (!this.value.itemsById[selected.id]) this.value.selected.delete(selected.id)
    }
    this.determineDraggable()
  }

  determineDraggable () {
    this.value.selectedItems = Array.from(this.value.selected.values())
    this.value.selectedUndraggable = !this.dragEligible(this.value.selectedItems)
  }

  set (state: ITreeStore<T>) {
    state.viewItems = state.viewUnder?.children ?? state.rootItems ?? []
    super.set(state)
  }

  trigger () {
    this.set(this.value)
  }

  async fetch (item?: TypedTreeItem<T>) {
    const children = await this.fetchChildren(item) as unknown as TypedTreeItem<T>[]
    for (const child of children) {
      child.level = (item?.level ?? 0) + 1
      child.parent = item
    }
    return children
  }

  async #refresh (item?: TypedTreeItem<T>, skipNotify = false) {
    if (item) item.loading = true
    else this.value.loading = true
    this.trigger()
    try {
      const children = await this.fetch(item)
      // re-open any open children
      await Promise.all(children.map(async (child: TypedTreeItem<T>) => await this.visit(child, async (child) => {
        child.open = this.value.itemsById[child.id]?.open
        if (child.open) {
          child.children = await this.fetch(child)
          child.hasChildren = child.children.length > 0
          if (!child.hasChildren) child.open = false
        }
      })))

      if (item) {
        this.visitSync(item, itm => { if (itm.id !== item.id) this.value.itemsById[itm.id] = undefined })
        item.children = children
        item.hasChildren = children.length > 0
        if (!item.hasChildren) item.open = false
      } else {
        this.value.itemsById = {}
        for (const child of children) (child as unknown as TypedTreeItem<T>).level = 1
        this.value.rootItems = children
      }
      this.addLookup(children)

      // if the focused item disappeared in the refresh, we need to replace it,
      // as without a focus the tree becomes invisible to keyboard nav
      if (!this.value.itemsById[this.value.focused?.id as string]) this.focus(this.value.selectedItems.slice(-1)[0] ?? this.value.viewItems[0], true)
    } finally {
      if (item) item.loading = false
      this.value.loading = false
      if (!skipNotify) this.trigger()
    }
  }

  async refresh (item?: TypedTreeItem<T>, skipNotify = false) {
    this.refreshPromise ??= this.#refresh(item, skipNotify)
    await this.refreshPromise
    this.refreshPromise = undefined
  }

  focus (item: TypedTreeItem<T>, notify = true) {
    this.value.focused = item
    if (!item) return
    const leftLevel = (this.value.viewUnder?.level ?? 0) + 1
    const viewLevel = 1 + item.level - leftLevel
    if (viewLevel >= this.value.viewDepth || viewLevel === Math.floor(Math.floor(this.value.viewDepth / 2))) {
      const seekBack = Math.floor(this.value.viewDepth / 2) + 1
      let p = item as TypedTreeItem<T> | undefined
      for (let i = 0; i < seekBack; i++) p = p?.parent
      this.value.viewUnder = p
    }
    if (notify) this.trigger()
  }

  select (item: TypedTreeItem<T>, { clear = false, notify = true, toggle = false }) {
    const selected = this.isSelected(item)
    const numSelected = this.value.selected.size
    if (this.singleSelect) clear = true
    if (clear) {
      this.value.selected.clear()
      this.focus(item, false)
    }
    if (toggle && selected && (!clear || numSelected === 1)) this.value.selected.delete(item.id)
    else this.value.selected.set(item.id, item)
    this.determineDraggable()
    if (notify) this.trigger()
  }

  selectById (id: string, { clear = false, notify = true, toggle = false }) {
    const item = this.value.itemsById[id]
    if (item) this.select(item, { clear, notify, toggle })
  }

  deselect (notify = true) {
    this.value.selected.clear()
    if (notify) this.trigger()
  }

  isSelected (item: TypedTreeItem<T>) {
    return this.value.selected.has(item.id)
  }

  async open (item: TypedTreeItem<T>) {
    if (item.open === true || item.hasChildren === false) return
    await this.openAndRefresh(item)
  }

  async openAndRefresh (item: TypedTreeItem<T>) {
    await this.refresh(item, true)
    item.open = !!item.children?.length
    this.trigger()
  }

  close (item: TypedTreeItem<T>) {
    for (const child of item.children ?? []) this.value.itemsById[child.id] = undefined
    this.cleanSelected()
    item.children = undefined
    item.open = false
    this.trigger()
  }

  async toggle (item: TypedTreeItem<T>) {
    if (item.open) this.close(item)
    else await this.open(item)
  }

  async viewUnder (item?: TypedTreeItem<T>) {
    if (item) await this.open(item)
    this.value.viewUnder = item
    this.trigger()
  }

  dragStart (item: TypedTreeItem<T>) {
    if (this.value.dragging || !this.value.draggable) return
    if (!this.value.selected.has(item.id)) {
      this.select(item, { clear: true, notify: false })
    }
    this.value.dragging = true
    this.trigger()
  }

  async drop (item: TypedTreeItem<T>, above: boolean) {
    if (!this.dropHandler) return false
    this.value.dragging = false
    if (!this.dropEligible(item, above)) return false
    this.value.loading = true
    this.trigger()
    const commonparent = this.findCommonParent([...this.value.selectedItems, item])
    const result = this.dropHandler(this.value.selectedItems, item, above)
    if (result === false || result === true) return result
    try {
      await result
    } catch (e: any) {
      console.error(e)
    } finally {
      this.update(v => ({ ...v, loading: false }))
      await this.refresh(commonparent)
    }
    return true
  }

  collectAncestors (item: TypedTreeItem<T>) {
    const ret: TypedTreeItem<T>[] = []
    let itm = item
    while (itm.parent) {
      ret.push(itm.parent)
      itm = itm.parent
    }
    return ret
  }

  findCommonParent (items: TypedTreeItem<T>[]) {
    if (items.length <= 1) return
    const [first, ...rest] = items
    const ancestors = [first, ...this.collectAncestors(first)]
    const lookup = keyby(ancestors, 'id')
    const depthById = ancestors.reduce((depthById, a, i) => ({ ...depthById, [a.id]: i }), {})
    let idx = -1
    for (const item of rest) {
      const itemAncestors = this.collectAncestors(item)
      const firstcommon = itemAncestors.find(a => lookup[a.id])
      if (!firstcommon) return
      const found = depthById[firstcommon.id]
      if (found > idx) idx = found
    }
    return ancestors[idx]
  }

  dragEligible (selectedItems: TypedTreeItem<T>[]) {
    return !this.dragEligibleHandler || this.dragEligibleHandler(selectedItems)
  }

  dropEligible (item: TypedTreeItem<T>, above: boolean) {
    if (this.value.selected.has(item.id)) return false
    for (const ancestor of this.collectAncestors(item)) {
      if (this.value.selected.has(ancestor.id)) return false
    }
    return !this.dropEligibleHandler || this.dropEligibleHandler(this.value.selectedItems, item, above)
  }

  dropEffect (item: TypedTreeItem<T>, above: boolean) {
    if (!this.dropEffectHandler) return 'move'
    return this.dropEffectHandler(this.value.selectedItems, item, above)
  }
}
