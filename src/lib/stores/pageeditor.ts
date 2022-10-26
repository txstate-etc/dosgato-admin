import type { ComponentData, UITemplate } from '@dosgato/templating'
import { derivedStore, Store } from '@txstate-mws/svelte-store'
import { get, isNotBlank, set } from 'txstate-utils'
import { api, type PageEditorPage, templateRegistry, toast } from '$lib'

export interface IPageEditorStore {
  editors: Record<string, EditorState | undefined>
  active?: string
  clipboardPage?: string
  clipboardPath?: string
  clipboardData?: ComponentData
  clipboardLabel?: string
}

export interface EditorState {
  page: PageEditorPage
  modal?: 'edit' | 'create' | 'delete' | 'move' | 'properties'
  selectedPath?: string
  selectedLabel?: string
  selectedDroppable?: boolean
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
  scrollY?: number
}

class PageEditorStore extends Store<IPageEditorStore> {
  constructor () {
    super({ editors: {} })
  }

  open (page: PageEditorPage) {
    this.update(v => ({ ...v, editors: { ...v.editors, [page.id]: { ...v.editors[page.id], page } }, active: page.id }))
  }

  free (pageId: string) {
    this.update(v => ({ ...v, editors: { ...v.editors, [pageId]: undefined } }))
  }

  /**
   * convenience function to replace the editor state of the active editor
   *
   * also accepts clipboard data for the page editor state (for cross-page pastes), set
   * to null to clear out the clipboard
   */
  updateEditorState (transform: (editorState: EditorState) => EditorState, resetClipboard?: boolean) {
    this.update(v => {
      if (!v.active) return v
      const editorState = v.editors[v.active]
      if (!editorState) return v
      const newEditorState = transform(editorState)
      return set({ ...v, ...(resetClipboard ? { clipboardData: undefined, clipboardLabel: undefined, clipboardPage: undefined, clipboardPath: undefined } : {}) }, `editors["${v.active}"]`, newEditorState)
    })
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
    this.updateEditorState(editorState => ({ ...editorState, creating: { ...editorState.creating!, templateKey, data: { areas: def?.defaultContent } } }))
    if (def && def.dialog == null) {
      const resp = await this.addComponentSubmit({ areas: def.defaultContent })
      if (resp?.success) await refreshIframe()
    }
  }

  async addComponentSubmit (data: any, validateOnly?: boolean) {
    const pageId = this.value.active
    if (!pageId) return
    const editorState = this.value.editors[pageId]
    if (!editorState?.creating?.templateKey) return
    const resp = await api.createComponent(pageId, editorState.page.version.version, editorState.page.data, editorState.creating.path, { ...data, templateKey: editorState.creating.templateKey }, { validateOnly })
    if (!validateOnly && resp.success) {
      this.updateEditorState(editorState => ({ ...editorState, page: resp.page, modal: undefined, editing: undefined, creating: undefined, clipboardPath: undefined }), true)
    }
    return resp
  }

  editComponentShowModal (path: string) {
    this.updateEditorState(editorState => {
      const data = get<ComponentData>(editorState.page.data, path)
      return { ...editorState, modal: 'edit', editing: { path, data, templateKey: data.templateKey }, creating: undefined }
    })
  }

  async editComponentSubmit (data: any, validateOnly?: boolean) {
    const pageId = this.value.active
    if (!pageId) return
    const editorState = this.value.editors[pageId]
    if (!editorState?.editing) return
    const resp = await api.editComponent(pageId, editorState.page.version.version, editorState.page.data, editorState.editing.path, data, { validateOnly })
    if (!validateOnly && resp.success) {
      this.updateEditorState(editorState => ({ ...editorState, page: resp.page, modal: undefined, editing: undefined, creating: undefined, clipboardPath: undefined }), true)
    }
    return resp
  }

  removeComponentShowModal (path: string) {
    this.updateEditorState(editorState => {
      const data = get<ComponentData>(editorState.page.data, path)
      return { ...editorState, modal: 'delete', editing: { path, data, templateKey: data.templateKey }, creating: undefined }
    })
  }

  async removeComponentSubmit () {
    const pageId = this.value.active
    if (!pageId) return
    const editorState = this.value.editors[pageId]
    if (!editorState?.editing) return
    const resp = await api.removeComponent(pageId, editorState.page.version.version, editorState.page.data, editorState.editing.path)
    if (resp.success) {
      this.updateEditorState(editorState => ({ ...editorState, page: resp.page!, modal: undefined, editing: undefined, creating: undefined, clipboardPath: undefined }), true)
    } else {
      this.cancelModal()
    }
    return resp
  }

  editPropertiesShowModal () {
    this.updateEditorState(editorState => ({ ...editorState, modal: 'properties', editing: { path: '', data: editorState.page.data, templateKey: editorState.page.data.templateKey }, creating: undefined }))
  }

  async editPropertiesSubmit (data: any, validateOnly?: boolean) {
    const pageId = this.value.active
    if (!pageId) return
    const editorState = this.value.editors[pageId]
    if (!editorState?.editing) return
    const resp = await api.editPageProperties(pageId, editorState.page.version.version, data, { validateOnly })
    if (!validateOnly && resp.success) {
      this.updateEditorState(editorState => ({ ...editorState, page: resp.page, modal: undefined, editing: undefined, creating: undefined }))
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
      this.updateEditorState(editorState => ({ ...editorState, page: resp.page }), true)
    }
  }

  cancelModal () {
    this.updateEditorState(editorState => ({ ...editorState, modal: undefined, editing: undefined, creating: undefined }))
  }

  select (path?: string, label?: string, maxreached?: boolean) {
    this.updateEditorState(editorState => ({ ...editorState, selectedPath: path, selectedLabel: label, selectedDroppable: !maxreached }))
  }

  cutComponent (path: string, cut = true) {
    this.update(v => ({ ...v, clipboardData: undefined, clipboardLabel: v.editors[v.active!]!.selectedLabel, clipboardPath: path, clipboardPage: v.active }))
    toast(`${this.value.clipboardLabel ?? 'Component'} cut initiated. Paste somewhere to complete the move.`, 'success')
  }

  copyComponent (path: string) {
    this.update(v => ({ ...v, clipboardData: get(v.editors[v.active!]!.page.data, path), clipboardLabel: v.editors[v.active!]!.selectedLabel, clipboardPath: undefined, clipboardPage: v.active }))
    toast(`${this.value.clipboardLabel ?? 'Component'} copied.`, 'success')
  }

  clearClipboard () {
    this.updateEditorState(es => es, true)
  }

  async pasteComponent (path: string) {
    const editorState = this.value.editors[this.value.active!]!
    if (this.value.clipboardPath) { // move
      if (this.value.active === this.value.clipboardPage) await this.moveComponent(this.value.clipboardPath, path)
    } else if (this.value.clipboardData) { // copy
      // copy, potentially from another page
      const resp = await api.insertComponent(editorState.page.id, editorState.page.version.version, editorState.page.data, path, this.value.clipboardData)
      if (resp.success) {
        this.updateEditorState(editorState => ({ ...editorState, page: resp.page, modal: undefined, editing: undefined, creating: undefined }), true)
      }
    }
  }
}

export const pageEditorStore = new PageEditorStore()

// hacked these together to never be undefined, only to be used on the page detail page
export const editorStore = derivedStore(pageEditorStore, s => (s.active ? s.editors[s.active] : undefined)!)
export const pageStore = derivedStore(editorStore, 'page')
