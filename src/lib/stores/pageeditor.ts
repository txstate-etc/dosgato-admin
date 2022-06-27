import type { ComponentData } from '@dosgato/templating'
import { derivedStore, Store } from '@txstate-mws/svelte-store'
import { get, splice } from 'txstate-utils'
import type { PageEditorPage } from '$lib/queries'

export interface IPageEditorStore {
  editors: EditorState[]
  active: number
}

export interface EditorState {
  page: PageEditorPage
  modal?: 'edit'|'create'|'delete'|'move'
  editing?: {
    path: string
    data: any
    templateKey: string
  }
}

class PageEditorStore extends Store<IPageEditorStore> {
  constructor () {
    super({ editors: [], active: -1 })
  }

  close (idx: number, newactive: number) {
    this.update(v => ({ ...v, editors: splice(v.editors, idx, 1), active: newactive }))
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

  editComponent (path: string) {
    this.update(v => {
      const data = get<ComponentData>(v.editors[v.active].page.data, path)
      const templateKey = data.templateKey
      return { ...v, modal: 'edit', editing: { path, data, templateKey } }
    })
  }
}

export const pageEditorStore = new PageEditorStore()
export const editorStore = derivedStore(pageEditorStore, v => v.editors[v.active])
export const pageStore = derivedStore(editorStore, 'page')
