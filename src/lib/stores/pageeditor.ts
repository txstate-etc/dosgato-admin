import type { ComponentData, UITemplate } from '@dosgato/templating'
import { derivedStore, Store } from '@txstate-mws/svelte-store'
import { get, isNotBlank, set } from 'txstate-utils'
import type { PageEditorPage } from '$lib/queries'
import { api } from '$lib/api'

export interface IPageEditorStore {
  editors: Record<string, EditorState>
  active?: string
}

export interface EditorState {
  page: PageEditorPage
  modal?: 'edit' | 'create' | 'delete' | 'move'
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
    super({ editors: {} })
  }

  open (page: PageEditorPage) {
    this.update(v => ({ editors: { ...v.editors, [page.id]: v.editors[page.id] ?? { page } }, active: page.id }))
  }

  async addComponentShowModal (path: string) {
    const pageId = this.value.active
    if (!pageId) return
    const editorState = this.value.editors[pageId]
    if (!editorState) return
    const m = path.match(/(.*)\.?areas\.(\w+)$/)
    if (!m) return
    const [_, componentPath, area] = Array.from(m)
    const templateKey = get<string>(editorState.page.data, [componentPath, 'templateKey'].filter(isNotBlank).join('.'))
    const availableComponents = await api.getAvailableComponents(templateKey, area, pageId)
    this.update(v => set(v, `editors["${pageId}"]`, { ...editorState, modal: 'create', editing: undefined, creating: { path, data: undefined, availableComponents } }))
  }

  async addComponentChooseTemplate (templateKey: string) {
    this.update(v => {
      if (!v.active) return v
      const editorState = v.editors[v.active]
      const newEditorState = set(editorState, 'creating.templateKey', templateKey)
      return set(v, `editors["${v.active}"]`, newEditorState)
    })
  }

  async addComponentSubmit (data: any, validate?: boolean) {
    const pageId = this.value.active
    if (!pageId) return
    const editorState = this.value.editors[pageId]
    if (!editorState.creating) return
    const resp = await api.createComponent(pageId, editorState.page.version.version, editorState.page.data, editorState.creating.path, { ...data, templateKey: editorState.creating.templateKey }, { validate })
    if (!validate && resp.success) {
      this.update(v => {
        const editorState = v.editors[pageId]
        const newEditorState = { ...editorState, page: resp.page, modal: undefined, editing: undefined, creating: undefined }
        return set(v, `editors["${pageId}"]`, newEditorState)
      })
    }
    return resp
  }

  editComponentShowModal (path: string) {
    this.update(v => {
      if (!v.active) return v
      const editorState = v.editors[v.active]
      const data = get<ComponentData>(editorState.page.data, path)
      const templateKey = data.templateKey
      const newEditorState: EditorState = { ...editorState, modal: 'edit', editing: { path, data, templateKey }, creating: undefined }
      return set(v, `editors["${v.active}"]`, newEditorState)
    })
  }

  async editComponentSubmit (data: any, validate?: boolean) {
    const pageId = this.value.active
    if (!pageId) return
    const editorState = this.value.editors[pageId]
    if (!editorState.editing) return
    const resp = await api.editComponent(pageId, editorState.page.version.version, editorState.page.data, editorState.editing.path, data, { validate })
    if (!validate && resp.success) {
      this.update(v => {
        const editorState = v.editors[pageId]
        const newEditorState = { ...editorState, page: resp.page, modal: undefined, editing: undefined, creating: undefined }
        return set(v, `editors["${pageId}"]`, newEditorState)
      })
    }
    return resp
  }

  removeComponentShowModal (path: string) {
    this.update(v => {
      if (!v.active) return v
      const editorState = v.editors[v.active]
      const data = get<ComponentData>(editorState.page.data, path)
      const templateKey = data.templateKey
      const newEditorState: EditorState = { ...editorState, modal: 'delete', editing: { path, data, templateKey }, creating: undefined }
      return set(v, `editors["${v.active}"]`, newEditorState)
    })
  }

  async removeComponentSubmit () {
    const pageId = this.value.active
    if (!pageId) return
    const editorState = this.value.editors[pageId]
    if (!editorState.editing) return
    const resp = await api.removeComponent(pageId, editorState.page.version.version, editorState.page.data, editorState.editing.path)
    if (resp.success) {
      this.update(v => {
        const editorState = v.editors[pageId]
        const newEditorState = { ...editorState, page: resp.page, modal: undefined, editing: undefined, creating: undefined }
        return set(v, `editors["${pageId}"]`, newEditorState)
      })
    } else {
      this.cancelModal()
    }
    return resp
  }

  async moveComponent (from: string, to: string) {
    const pageId = this.value.active
    if (!pageId) return
    const editorState = this.value.editors[pageId]
    if (!editorState) return
    const resp = await api.moveComponent(pageId, editorState.page.version.version, editorState.page.data, from, to)
    if (resp.success) {
      this.update(v => {
        const editorState = v.editors[pageId]
        const newEditorState = { ...editorState, page: resp.page }
        return set(v, `editors["${pageId}"]`, newEditorState)
      })
    }
  }

  cancelModal () {
    this.update(v => {
      if (!v.active) return v
      const editorState = v.editors[v.active]
      return set(v, `editors["${v.active}"]`, { ...editorState, modal: undefined, editing: undefined, creating: undefined })
    })
  }
}

export const pageEditorStore = new PageEditorStore()

// hacked these together to never be undefined, only to be used on the page detail page
export const editorStore = derivedStore(pageEditorStore, s => (s.active ? s.editors[s.active] : undefined)!)
export const pageStore = derivedStore(editorStore, 'page')
