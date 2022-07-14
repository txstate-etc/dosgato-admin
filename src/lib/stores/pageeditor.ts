import type { ComponentData, UITemplate } from '@dosgato/templating'
import { derivedStore, Store } from '@txstate-mws/svelte-store'
import { get, isNotBlank, set, splice } from 'txstate-utils'
import type { PageEditorPage } from '$lib/queries'
import { api } from '$lib/api'

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
  creating?: {
    path: string
    data: any
    availableComponents: (UITemplate & { name: string })[]
    templateKey?: string
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

  async addComponentShowModal (path: string) {
    const editorState = this.value.editors[this.value.active]
    const m = path.match(/(.*)\.?areas\.(\w+)$/)
    if (!m) return
    const [full, componentPath, area] = Array.from(m)
    const templateKey = get(editorState.page.data, [componentPath, 'templateKey'].filter(isNotBlank).join('.'))
    const availableComponents = await api.getAvailableComponents(templateKey, area, editorState.page.id)
    this.update(v => set(v, `editors[${v.active}]`, { ...editorState, modal: 'create', editing: undefined, creating: { path, data: undefined, availableComponents } }))
  }

  async addComponentChooseTemplate (templateKey: string) {
    this.update(v => {
      const editorState = v.editors[v.active]
      const newEditorState = set(editorState, 'creating.templateKey', templateKey)
      return set(v, `editors[${v.active}]`, newEditorState)
    })
  }

  async addComponentSubmit (data: any, validate?: boolean) {
    const editorState = this.value.editors[this.value.active]
    if (!editorState.creating) return
    const resp = await api.createComponent(editorState.page.id, editorState.page.version.version, editorState.page.data, editorState.creating.path, { ...data, templateKey: editorState.creating.templateKey }, { validate })
    if (!validate && resp.success) {
      this.update(v => {
        const editorState = v.editors[v.active]
        const newEditorState = { ...editorState, page: resp.page, modal: undefined, editing: undefined, creating: undefined }
        return set(v, `editors[${v.active}]`, newEditorState)
      })
    }
    return resp
  }

  editComponentShowModal (path: string) {
    this.update(v => {
      const editorState = v.editors[v.active]
      const data = get<ComponentData>(editorState.page.data, path)
      const templateKey = data.templateKey
      const newEditorState: EditorState = { ...editorState, modal: 'edit', editing: { path, data, templateKey }, creating: undefined }
      return set(v, `editors[${v.active}]`, newEditorState)
    })
  }

  async editComponentSubmit (data: any, validate?: boolean) {
    const editorState = this.value.editors[this.value.active]
    if (!editorState.editing) return
    const resp = await api.editComponent(editorState.page.id, editorState.page.version.version, editorState.page.data, editorState.editing.path, data, { validate })
    if (!validate && resp.success) {
      this.update(v => {
        const editorState = v.editors[v.active]
        const newEditorState = { ...editorState, page: resp.page, modal: undefined, editing: undefined, creating: undefined }
        return set(v, `editors[${v.active}]`, newEditorState)
      })
    }
    return resp
  }

  removeComponentShowModal (path: string) {
    this.update(v => {
      const editorState = v.editors[v.active]
      const data = get<ComponentData>(editorState.page.data, path)
      const templateKey = data.templateKey
      const newEditorState: EditorState = { ...editorState, modal: 'delete', editing: { path, data, templateKey }, creating: undefined }
      return set(v, `editors[${v.active}]`, newEditorState)
    })
  }

  async removeComponentSubmit () {
    const editorState = this.value.editors[this.value.active]
    if (!editorState.editing) return
    const resp = await api.removeComponent(editorState.page.id, editorState.page.version.version, editorState.page.data, editorState.editing.path)
    if (resp.success) {
      this.update(v => {
        const editorState = v.editors[v.active]
        const newEditorState = { ...editorState, page: resp.page, modal: undefined, editing: undefined, creating: undefined }
        return set(v, `editors[${v.active}]`, newEditorState)
      })
    } else {
      this.cancelModal()
    }
    return resp
  }

  cancelModal () {
    this.update(v => {
      const editorState = v.editors[v.active]
      return set(v, `editors[${v.active}]`, { ...editorState, modal: undefined, editing: undefined, creating: undefined })
    })
  }
}

export const pageEditorStore = new PageEditorStore()
export const editorStore = derivedStore(pageEditorStore, v => v.editors[v.active])
export const pageStore = derivedStore(editorStore, 'page')
