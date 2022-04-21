import type { PageEditorPage } from '$lib/queries'
import { derivedStore, Store } from '@txstate-mws/svelte-store'
import { splice } from 'txstate-utils'

export interface IPageEditorStore {
  editors: EditorState[]
  active: number
}

export interface EditorState {
  page: PageEditorPage
}

class PageEditorStore extends Store<IPageEditorStore> {
  constructor () {
    super({ editors: [], active: -1 })
  }

  close (idx: number) {
    this.update(v => ({ ...v, editors: splice(v.editors, idx, 1), active: v.active > idx || idx === v.editors.length - 1 ? v.active - 1 : v.active }))
  }

  open (page: PageEditorPage) {
    this.update(v => {
      let active = v.editors.findIndex(e => e.page.id === page.id)
      const editors = [...v.editors]
      if (active === -1) {
        editors.push({ page })
        active = editors.length - 1
      }
      return { ...v, editors, active }
    })
  }
}

export const pageEditorStore = new PageEditorStore()
export const editorStore = derivedStore(pageEditorStore, v => v.editors[v.active])
