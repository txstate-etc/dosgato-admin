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
  copied: Map<string, TypedTreeItem<T>>
  cut?: boolean
  viewUnder?: TypedTreeItem<T>
  viewItems: TypedTreeItem<T>[]
  viewDepth: number
  draggable: boolean
  selectedUndraggable?: boolean
  dragging: boolean
}

export type FetchChildrenFn<T extends TreeItemFromDB> = (item?: TypedTreeItem<T>) => Promise<T[]>
export type DragEligibleFn<T extends TreeItemFromDB> = (selectedItems: TypedTreeItem<T>[], userWantsCopy: boolean) => boolean
export type DropEffectFn<T extends TreeItemFromDB> = (selectedItems: TypedTreeItem<T>[], dropTarget: TypedTreeItem<T>, above: boolean, userWantsCopy: boolean) => 'move' | 'copy' | 'none'
export type MoveHandlerFn<T extends TreeItemFromDB> = (selectedItems: TypedTreeItem<T>[], dropTarget: TypedTreeItem<T>, above: boolean) => boolean | Promise<boolean>
export type CopyHandlerFn<T extends TreeItemFromDB> = (selectedItems: TypedTreeItem<T>[], dropTarget: TypedTreeItem<T>, above: boolean, userWantsRecursive: boolean | undefined) => boolean | Promise<boolean>

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
  public copied = derivedStore(this, 'copied')

  public moveHandler?: MoveHandlerFn<T>
  public copyHandler?: CopyHandlerFn<T>
  public dragEligibleHandler?: DragEligibleFn<T>
  public dropEffectHandler?: DropEffectFn<T>
  public singleSelect?: boolean

  private refreshPromise?: Promise<void>

  constructor (
    public fetchChildren: FetchChildrenFn<T>,
    { moveHandler, copyHandler, dragEligible, dropEffect, singleSelect }: {
      moveHandler?: MoveHandlerFn<T>
      copyHandler?: CopyHandlerFn<T>
      dragEligible?: DragEligibleFn<T>
      dropEffect?: DropEffectFn<T>
      singleSelect?: boolean
    } = {}
  ) {
    super({ itemsById: {}, viewItems: [], viewDepth: Infinity, selected: new Map(), selectedItems: [], copied: new Map(), dragging: false, draggable: !!moveHandler })
    this.moveHandler = moveHandler
    this.copyHandler = copyHandler
    this.dragEligibleHandler = dragEligible
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
    this.value.selectedUndraggable = !this.dragEligible(this.value.selectedItems, true) && !this.dragEligible(this.value.selectedItems, false)
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
    this.determineDraggable()
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

  protected async _drop (item: TypedTreeItem<T>, droppedItems: Map<string, TypedTreeItem<T>>, above: boolean, userWantsCopy: boolean, userWantsRecursive: boolean | undefined) {
    const dropEffect = this._dropEffect(item, droppedItems, above, userWantsCopy)
    if (dropEffect === 'none') return false
    this.value.dragging = false
    this.value.loading = true
    this.trigger()
    const selectedItems = Array.from(droppedItems.values())
    const commonparent = this.findCommonParent([...selectedItems, item])
    try {
      const result = dropEffect === 'move'
        ? await this.moveHandler!(selectedItems, item, above)
        : await this.copyHandler!(selectedItems, item, above, userWantsRecursive)
      await this.open(item)
      await this.refresh(commonparent)
      return result
    } catch (e: any) {
      console.error(e)
    } finally {
      this.update(v => ({ ...v, loading: false }))
    }
    return true
  }

  async drop (item: TypedTreeItem<T>, above: boolean, userWantsCopy) {
    const ret = await this._drop(item, this.value.selected, above, userWantsCopy, undefined)
    return ret
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

  root (item: TypedTreeItem<T>) {
    let root = item
    while (root.parent) root = root.parent
    return root
  }

  findCommonParent (items: TypedTreeItem<T>[]) {
    if (items.length <= 1) return
    const [first, ...rest] = items
    const ancestors = [first, ...this.collectAncestors(first)]
    const lookup = keyby(ancestors, 'id')
    const depthById = ancestors.reduce((depthById, a, i) => { depthById[a.id] = i; return depthById }, {})
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

  dragEligible (selectedItems: TypedTreeItem<T>[], userWantsCopy: boolean) {
    return !this.dragEligibleHandler || this.dragEligibleHandler(selectedItems, userWantsCopy)
  }

  protected _dropEffect (item: TypedTreeItem<T>, droppedItems: Map<string, TypedTreeItem<T>>, above: boolean, userWantsCopy: boolean) {
    const handlerAnswer = this.dropEffectHandler?.(Array.from(droppedItems.values()), item, above, userWantsCopy) ?? 'move'
    if (handlerAnswer === 'none') return 'none'
    if (handlerAnswer === 'move') {
      // I could make the user's dropEffectHandler check this, but it's pretty universal that you
      // can't move a thing into itself or one of its own descendants
      // and it would be super weird to just automagically turn it into a copy, not to mention it would
      // mean placing it back on itself would feel like canceling the move but make a copy instead
      if (droppedItems.has(item.id)) return 'none'
      for (const ancestor of this.collectAncestors(item)) {
        if (droppedItems.has(ancestor.id)) return 'none'
      }
    }
    if (handlerAnswer === 'move' && !this.moveHandler) return 'none'
    if (handlerAnswer === 'copy' && !this.copyHandler) return 'none'
    return handlerAnswer
  }

  dropEffect (item: TypedTreeItem<T>, above: boolean, userWantsCopy: boolean) {
    return this._dropEffect(item, this.value.selected, above, userWantsCopy)
  }

  cut () {
    if (!this.cutEligible()) return
    this.value.copied = new Map(this.value.selected)
    this.value.cut = true
    this.trigger()
  }

  copy () {
    if (!this.copyEligible()) return
    this.value.copied = new Map(this.value.selected)
    this.value.cut = false
    this.trigger()
  }

  cutEligible () {
    return this.dragEligible(this.value.selectedItems, false)
  }

  copyEligible () {
    return this.dragEligible(this.value.selectedItems, true)
  }

  cancelCopy () {
    this.value.copied = new Map()
    this.value.cut = undefined
    this.trigger()
  }

  pasteEligible (above = false) {
    return this.value.copied.size && this.pasteEffect(above) !== 'none'
  }

  pasteEffect (above = false) {
    return this._dropEffect(this.value.selectedItems[0], this.value.copied, above, !this.value.cut)
  }

  async paste (above = false, userWantsRecursive = false) {
    if (this.pasteEffect(above) === 'none') return
    const copied = this.value.copied
    const cut = this.value.cut
    this.value.copied = new Map()
    this.value.cut = undefined
    return await this._drop(this.value.selectedItems[0], copied, above, !cut, userWantsRecursive)
  }
}
