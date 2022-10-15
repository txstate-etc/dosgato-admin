import type { ComponentData, UITemplate } from '@dosgato/templating'
import { derivedStore, Store } from '@txstate-mws/svelte-store'
import { get, isNotBlank, set } from 'txstate-utils'
import { api, type PageEditorPage, templateRegistry } from '$lib'

export interface IPageEditorStore {
  editors: Record<string, EditorState | undefined>
  active?: string
}

export interface EditorState {
  page: PageEditorPage
  modal?: 'edit' | 'create' | 'delete' | 'move' | 'properties'
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
  scrollY: number
}

class PageEditorStore extends Store<IPageEditorStore> {
  constructor () {
    super({ editors: {} })
  }

  open (page: PageEditorPage) {
    this.update(v => ({ editors: { ...v.editors, [page.id]: { ...v.editors[page.id], page, scrollY: 0 } }, active: page.id }))
  }

  free (pageId: string) {
    this.update(v => ({ ...v, editors: { ...v.editors, [pageId]: undefined } }))
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

  async addComponentChooseTemplate (templateKey: string, refreshIframe: () => Promise<void>) {
    const def = templateRegistry.getTemplate(templateKey)
    this.update(v => {
      if (!v.active) return v
      const editorState = v.editors[v.active]
      const newEditorState = { ...editorState, creating: { ...editorState?.creating, templateKey, data: { areas: def?.defaultContent } } }
      return set(v, `editors["${v.active}"]`, newEditorState)
    })
    if (def && def.dialog == null) {
      const resp = await this.addComponentSubmit({ areas: def.defaultContent })
      if (resp?.success) await refreshIframe()
    } else {
      this.update(v => {
        if (!v.active) return v
        const editorState = v.editors[v.active]
        const newEditorState = set(editorState, 'creating.templateKey', templateKey)
        return set(v, `editors["${v.active}"]`, newEditorState)
      })
    }
  }

  async addComponentSubmit (data: any, validateOnly?: boolean) {
    const pageId = this.value.active
    if (!pageId) return
    const editorState = this.value.editors[pageId]
    if (!editorState?.creating?.templateKey) return
    const resp = await api.createComponent(pageId, editorState.page.version.version, editorState.page.data, editorState.creating.path, { ...data, templateKey: editorState.creating.templateKey }, { validateOnly })
    if (!validateOnly && resp.success) {
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
      if (!editorState) return v
      const data = get<ComponentData>(editorState.page.data, path)
      const templateKey = data.templateKey
      const newEditorState: EditorState = { ...editorState, modal: 'edit', editing: { path, data, templateKey }, creating: undefined }
      return set(v, `editors["${v.active}"]`, newEditorState)
    })
  }

  async editComponentSubmit (data: any, validateOnly?: boolean) {
    const pageId = this.value.active
    if (!pageId) return
    const editorState = this.value.editors[pageId]
    if (!editorState?.editing) return
    const resp = await api.editComponent(pageId, editorState.page.version.version, editorState.page.data, editorState.editing.path, data, { validateOnly })
    if (!validateOnly && resp.success) {
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
      if (!editorState) return v
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
    if (!editorState?.editing) return
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

  editPropertiesShowModal () {
    this.update(v => {
      if (!v.active) return v
      const editorState = v.editors[v.active]
      if (!editorState) return v
      const newEditorState: EditorState = { ...editorState, modal: 'properties', editing: { path: '', data: editorState.page.data, templateKey: editorState.page.data.templateKey }, creating: undefined }
      return set(v, `editors["${v.active}"]`, newEditorState)
    })
  }

  async editPropertiesSubmit (data: any, validateOnly?: boolean) {
    const pageId = this.value.active
    if (!pageId) return
    const editorState = this.value.editors[pageId]
    if (!editorState?.editing) return
    const resp = await api.editPageProperties(pageId, editorState.page.version.version, data, { validateOnly })
    if (!validateOnly && resp.success) {
      this.update(v => {
        const editorState = v.editors[pageId]
        const newEditorState = { ...editorState, page: resp.page, modal: undefined, editing: undefined, creating: undefined }
        return set(v, `editors["${pageId}"]`, newEditorState)
      })
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
