import { ActiveStore } from '@txstate-mws/svelte-store'

export const TREE_STORE_CONTEXT = {}

export interface TreeItemFromDB {
  id: string
}

export interface TreeItem extends TreeItemFromDB {
  level: number
  parent?: this
  loading?: boolean
  open?: boolean
  children?: this[]
}

export type TypedTreeItem<T extends TreeItemFromDB> = TreeItem & T

export interface ITreeStore<T extends TreeItemFromDB> {
  loading?: boolean
  rootItems?: TypedTreeItem<T>[]
  itemsById: Record<string, TypedTreeItem<T>|undefined>
  focused?: TypedTreeItem<T>
  selected?: TypedTreeItem<T>
  viewUnder?: TypedTreeItem<T>
  viewItems: TypedTreeItem<T>[]
  viewDepth: number
}

export type FetchChildrenFn<T extends TreeItemFromDB> = (item?: TypedTreeItem<T>) => Promise<T[]>

export class TreeStore<T extends TreeItemFromDB> extends ActiveStore<ITreeStore<T>> {
  constructor (public fetchChildren: FetchChildrenFn<T>) {
    super({ itemsById: {}, viewItems: [], viewDepth: Infinity })
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
    for (const item of items) this.visitSync(item, itm => { this.value.itemsById[itm.id] = itm })
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

  async refresh (item?: TypedTreeItem<T>, notify = true) {
    if (item) item.loading = true
    else this.value.loading = true
    this.trigger()
    const children = await this.fetch(item)
    // re-open any open children
    await Promise.all(children.map(async (child: TypedTreeItem<T>) => await this.visit(child, async () => {
      child.open = this.value.itemsById[child.id]?.open
      if (child.open) child.children = await this.fetch(child)
    })))

    if (item) {
      this.visitSync(item, itm => { this.value.itemsById[itm.id] = undefined })
      item.children = children
    } else {
      this.value.itemsById = {}
      for (const child of children) (child as unknown as TypedTreeItem<T>).level = 1
      this.value.rootItems = children
    }
    this.addLookup(children)
    if (item) item.loading = false
    else this.value.loading = false
    if (notify) this.trigger()
  }

  focus (item: TypedTreeItem<T>, notify = true) {
    this.value.focused = item
    if (!item) return
    const leftLevel = (this.value.viewUnder?.level ?? 0) + 1
    const viewLevel = 1 + item.level - leftLevel
    if (viewLevel >= this.value.viewDepth || viewLevel === Math.floor(Math.floor(this.value.viewDepth / 2))) {
      const seekBack = Math.floor(this.value.viewDepth / 2) + 1
      let p = item as TypedTreeItem<T>|undefined
      for (let i = 0; i < seekBack; i++) p = p?.parent
      this.value.viewUnder = p
    }
    if (notify) this.trigger()
  }

  select (item: TypedTreeItem<T>, notify = true) {
    this.focus(item, false)
    this.value.selected = item
    if (notify) this.trigger()
  }

  async open (item: TypedTreeItem<T>) {
    if (item.open) return
    await this.refresh(item, false)
    item.open = !!item.children?.length
    this.trigger()
  }

  close (item: TypedTreeItem<T>) {
    for (const child of item.children ?? []) this.value.itemsById[child.id] = undefined
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
}
