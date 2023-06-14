import type { ComponentData, PageData, UITemplate } from '@dosgato/templating'
import { derivedStore, Store } from '@txstate-mws/svelte-store'
import { get, groupby, isBlank, randomid, set, sortby } from 'txstate-utils'
import { api, type PageEditorPage, templateRegistry, toast } from '$lib'
import type { Feedback } from '@txstate-mws/svelte-forms'
import type { DateTime } from 'luxon'

export interface IPageEditorStore {
  editors: Record<string, EditorState | undefined>
  active?: string
  clipboardPage?: string
  clipboardPath?: string
  clipboardData?: ComponentData
  clipboardLabel?: string
}

export interface PageEditorVersionPreview {
  version: number
  date: DateTime
  modifiedBy: string
}

export interface EditorState {
  page: PageEditorPage
  modal?: 'edit' | 'create' | 'delete' | 'move' | 'properties' | 'versions'
  selectedPath?: string
  selectedLabel?: string
  selectedMaxReached?: boolean
  selectedMayDelete?: boolean
  state?: any
  cutAllowed?: boolean
  copyAllowed?: boolean
  pasteAllowed?: boolean
  previewing?: {
    mode?: 'desktop' | 'mobile'
    version: PageEditorVersionPreview
    fromVersion?: PageEditorVersionPreview
  }
  restoreVersion?: number
  editing?: {
    path: string
    data: any
    templateKey: string
  }
  creating?: {
    path: string
    componentEventualPath: string
    data: any
    availableComponents: (UITemplate & { name: string })[]
    availableComponentsByCategory: { category: string, templates: (UITemplate & { name: string })[] }[]
    templateKey?: string
  }
  scrollY?: number
}

class PageEditorStore extends Store<IPageEditorStore> {
  constructor () {
    super({ editors: {} })
  }

  set (v: IPageEditorStore) {
    if (v.active) {
      const editorState = v.editors[v.active]
      if (editorState) {
        const editBarSelected = editorState.selectedPath && /\.\d+$/.test(editorState.selectedPath)
        editorState.copyAllowed = !!editBarSelected
        editorState.cutAllowed = !!editBarSelected
        editorState.pasteAllowed = !!editorState.selectedPath && !this.pasteDisabled(editorState.selectedPath, v)
      }
    }
    super.set(v)
  }

  open (page: PageEditorPage) {
    this.update(v => ({ ...v, editors: { ...v.editors, [page.id]: { ...v.editors[page.id], page } }, active: page.id }))
  }

  free (pageId: string) {
    this.update(v => ({ ...v, editors: { ...v.editors, [pageId]: undefined } }))
  }

  validMove (pageData: PageData, from: string, to: string) {
    if (to === from) return false // no dragging onto yourself
    const draggingParentPath = from.split('.').slice(0, -1).join('.')
    if (to === draggingParentPath) return false // no dragging onto your own new bar
    const draggingKey = get<ComponentData>(pageData, from).templateKey
    return this.validCopy(pageData, draggingKey, to)
  }

  validCopy (pageData: PageData, templateKey: string, to: string) {
    const d = get<ComponentData | ComponentData[]>(pageData, to) ?? []
    if (Array.isArray(d)) {
      const parts = to.split('.')
      const cpath = parts.slice(0, -2).join('.')
      const aname = parts[parts.length - 1]
      const tkey = get<ComponentData>(pageData, cpath).templateKey
      return !!templateRegistry.getTemplate(tkey)?.areas.get(aname)?.availableComponents?.has(templateKey)
    } else {
      const parts = to.split('.')
      const cpath = parts.slice(0, -3).join('.')
      const aname = parts[parts.length - 2]
      const tkey = get<ComponentData>(pageData, cpath).templateKey
      return !!templateRegistry.getTemplate(tkey)?.areas.get(aname)?.availableComponents?.has(templateKey)
    }
  }

  pasteDisabled (selectedPath: string, v: IPageEditorStore) {
    const editorState = v.editors[v.active!]
    if (!editorState?.selectedPath) return true
    const targetParentPath = editorState.selectedPath.split('.').slice(0, -1).join('.')
    const targetOnSamePage = v.clipboardPage === v.active
    const targetIsSibling = targetOnSamePage && v.clipboardPath?.split('.').slice(0, -1).join('.') === targetParentPath
    if ((editorState?.selectedMaxReached && !targetIsSibling) || !(v.clipboardData || (v.clipboardPath && targetOnSamePage))) return true
    if (v.active && v.clipboardPath) return !this.validMove(editorState.page.data, v.clipboardPath, selectedPath)
    if (v.clipboardData) return !this.validCopy(editorState.page.data, v.clipboardData.templateKey, selectedPath)
    return true
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

  async addComponentShowModal (path: string, refreshIframe: () => Promise<void>) {
    const pageId = this.value.active
    if (!pageId) return
    const editorState = this.value.editors[pageId]
    if (!editorState) return
    const m = path.match(/(.*)\.?areas\.(\w+)$/)
    if (!m) return
    const [_, componentPath, area] = Array.from(m)
    const parentData = isBlank(componentPath) ? editorState.page.data : get<ComponentData>(editorState.page.data, componentPath)
    const templateKey = parentData.templateKey
    const availableComponents = await api.getAvailableComponents(templateKey, area, pageId)
    const availableComponentsByCategory = Object.entries(groupby(availableComponents, 'displayCategory')).map(([category, templates]) => ({ category, templates }))
    this.update(v => set(v, `editors["${pageId}"]`, { ...editorState, modal: 'create', editing: undefined, creating: { path, componentEventualPath: path + '.' + (String(parentData.areas?.[area]?.length) ?? '0'), data: undefined, availableComponents, availableComponentsByCategory } }))
    if (availableComponents.length === 1) await this.addComponentChooseTemplate(availableComponents[0].templateKey, refreshIframe)
  }

  async addComponentChooseTemplate (templateKey: string, refreshIframe: () => Promise<void>) {
    const def = templateRegistry.getTemplate(templateKey)
    this.updateEditorState(editorState => ({ ...editorState, creating: { ...editorState.creating!, templateKey, data: undefined } }))
    if (def && def.dialog == null) {
      const data = def.randomId ? { [def.randomId]: randomid() } : {}
      const resp = await this.addComponentSubmit({ ...data, areas: def.genDefaultContent({ ...data, templateKey }) })
      if (resp?.success) await refreshIframe()
    }
  }

  async addComponentSubmit (data: any, validateOnly?: boolean) {
    const pageId = this.value.active
    if (!pageId) return { success: false, messages: [] as Feedback[], data }
    const editorState = this.value.editors[pageId]
    if (!editorState?.creating?.templateKey) return { success: false, messages: [] as Feedback[], data }
    const def = templateRegistry.getTemplate(editorState.creating.templateKey)
    const resp = await api.createComponent(pageId, editorState.page.version.version, editorState.page.data, editorState.creating.path, { ...data, templateKey: editorState.creating.templateKey, areas: def?.genDefaultContent({ ...data, templateKey: editorState.creating.templateKey }) }, { validateOnly })
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
    if (!pageId) return { success: false, messages: [] as Feedback[], data }
    const editorState = this.value.editors[pageId]
    if (!editorState?.editing) return { success: false, messages: [] as Feedback[], data }
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
      this.updateEditorState(editorState => ({ ...editorState, page: resp.page, modal: undefined, editing: undefined, creating: undefined, clipboardPath: undefined }), true)
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

  versionsShowModal () {
    this.updateEditorState(editorState => ({ ...editorState, modal: 'versions' }))
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

  select (path?: string, label?: string, maxreached?: boolean, mayDelete?: boolean) {
    this.updateEditorState(editorState => ({ ...editorState, selectedPath: path, selectedLabel: label, selectedMaxReached: !!maxreached, selectedMayDelete: !!mayDelete }))
  }

  cutComponent (path?: string) {
    if (!path || !this.value.editors[this.value.active!]?.cutAllowed) return
    this.update(v => ({ ...v, clipboardData: undefined, clipboardLabel: v.editors[v.active!]!.selectedLabel, clipboardPath: path, clipboardPage: v.active }))
    toast(`${this.value.clipboardLabel ?? 'Component'} cut initiated. Paste somewhere to complete the move.`, 'success')
  }

  copyComponent (path?: string) {
    if (!path || !this.value.editors[this.value.active!]?.copyAllowed) return
    this.update(v => ({ ...v, clipboardData: get(v.editors[v.active!]!.page.data, path), clipboardLabel: v.editors[v.active!]!.selectedLabel, clipboardPath: undefined, clipboardPage: v.active }))
    toast(`${this.value.clipboardLabel ?? 'Component'} copied.`, 'success')
  }

  clearClipboard () {
    this.updateEditorState(es => es, true)
  }

  async pasteComponent (path?: string) {
    const editorState = this.value.editors[this.value.active!]
    if (!path || !editorState?.pasteAllowed) return
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

  saveState (state: any) {
    this.updateEditorState(es => ({ ...es, state }))
  }

  compareVersions (from: PageEditorVersionPreview, to: PageEditorVersionPreview) {
    this.updateEditorState(es => ({ ...es, previewing: { version: to, fromVersion: from } }))
  }

  previewVersion (version: PageEditorVersionPreview) {
    this.updateEditorState(es => ({ ...es, previewing: { version } }))
  }

  setPreviewMode (mode: 'desktop' | 'mobile') {
    this.updateEditorState(es => ({ ...es, previewing: es.previewing ? { ...es.previewing, mode } : undefined }))
  }

  initRestore (version: number) {
    this.updateEditorState(es => ({ ...es, restoreVersion: version }))
  }

  cancelRestore () {
    this.updateEditorState(es => ({ ...es, restoreVersion: undefined }))
  }

  async restoreVersion () {
    const editorState = this.value.editors[this.value.active!]
    if (!editorState?.page) return
    const version = editorState.restoreVersion
    if (version == null) return
    const resp = await api.restorePage(editorState.page.id, version)
    if (resp.success) {
      this.updateEditorState(es => ({ ...es, page: resp.page, previewing: undefined, restoreVersion: undefined }))
    }
  }

  cancelPreview () {
    this.updateEditorState(es => ({ ...es, previewing: undefined }))
  }
}

export const pageEditorStore = new PageEditorStore()

// hacked these together to never be undefined, only to be used on the page detail page
export const editorStore = derivedStore(pageEditorStore, s => (s.active ? s.editors[s.active] : undefined)!)
export const pageStore = derivedStore(editorStore, 'page')
export const actionsStore = derivedStore(pageEditorStore, v => ({ clipboardData: v.clipboardData, clipboardPath: v.active === v.clipboardPage ? v.clipboardPath : undefined, clipboardPage: v.clipboardPage, clipboardLabel: v.clipboardLabel, selectedPath: v.editors[v.active!]?.selectedPath, clipboardActive: v.clipboardData || (v.clipboardPath && v.clipboardPage === v.active) }))
