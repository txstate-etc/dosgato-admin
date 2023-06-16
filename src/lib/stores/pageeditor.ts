import type { ComponentData, PageData, UITemplate } from '@dosgato/templating'
import { derivedStore, Store } from '@txstate-mws/svelte-store'
import { get, groupby, isBlank, randomid, set, isEmpty, sortby } from 'txstate-utils'
import { api, type PageEditorPage, templateRegistry, toast, uiLog } from '$lib'
import type { Feedback } from '@txstate-mws/svelte-forms'
import type { DateTime } from 'luxon'

interface ISuccess { success: boolean }
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

const eventType = 'PageEditor'

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
    uiLog.log({ eventType, action: 'Open', additionalProperties: { id: page.id } }, page.path)
  }

  free (pageId: string) {
    this.update(v => ({ ...v, editors: { ...v.editors, [pageId]: undefined } }))
    uiLog.log({ eventType, action: 'Free' }, pageId)
  }

  /** Convenience function for logging when actions trigger the setting of a modal state that displays a modal. */
  logActionShown (action: string, target?: string, extraInfo?: Record<string, string | undefined>) {
    const editor = this.getActiveState()
    const additionalProperties = { ...(editor && { id: editor.state.page.id, path: editor.state.page.path }), ...extraInfo }
    uiLog.log({ eventType, action, ...(!isEmpty(additionalProperties) && { additionalProperties }) }, target)
  }

  /** Convenience function for logging response information associated with an action implemented by a PageEditorStore api call.
   * - `additionalProperties` is a good location to put info needed for the action, including
   * the initial target in cases where the action response ends up acting on a different target. */
  logActionResponse<R extends ISuccess> (resp: R, eventContext: string, target?: string, extraInfo?: Record<string, string | undefined>) {
    const editor = this.getActiveState()
    const additionalProperties = { ...(editor && { id: editor.state.page.id, path: editor.state.page.path }), ...extraInfo }
    const logInfo = {
      eventType: `${eventType}-${eventContext}-modal`,
      action: resp.success ? 'Success' : 'Failed',
      ...(!isEmpty(additionalProperties) && { additionalProperties })
    }
    uiLog.log(logInfo, target)
  }

  /** Convenience function for getting a reference to the active editor state along with the active pageId. */
  private getActiveState () {
    const pageId = this.value.active
    const state = pageId ? this.value.editors[pageId] : undefined
    return state ? { pageId, state } : undefined
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
    const editor = this.getActiveState()
    if (!editor) return
    const m = path.match(/(.*)\.?areas\.(\w+)$/)
    if (!m) return
    const [_, componentPath, area] = Array.from(m)
    const parentData = isBlank(componentPath) ? editor.state.page.data : get<ComponentData>(editor.state.page.data, componentPath)
    const templateKey = parentData.templateKey
    const availableComponents = await api.getAvailableComponents(templateKey, area, editor.pageId)
    const availableComponentsByCategory = Object.entries(groupby(availableComponents, 'displayCategory')).map(([category, templates]) => ({ category, templates }))
    this.update(v => set(v, `editors["${editor.pageId}"]`, { ...editor.state, modal: 'create', editing: undefined, creating: { path, componentEventualPath: path + '.' + (String(parentData.areas?.[area]?.length) ?? '0'), data: undefined, availableComponents, availableComponentsByCategory } }))
    this.logActionShown('Add Component', path)
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
    const editor = this.getActiveState()
    if (!editor?.state.creating?.templateKey) return { success: false, messages: [] as Feedback[], data }
    const [page, creating] = [editor.state.page, editor.state.creating]
    const def = templateRegistry.getTemplate(creating.templateKey!)
    const saveData = { ...data, templateKey: creating.templateKey, areas: def?.genDefaultContent({ ...data, templateKey: creating.templateKey }) }
    if (def?.randomId) saveData[def.randomId] = randomid()
    const resp = await api.createComponent(editor.pageId, page.version.version, page.data, creating.path, { ...data, templateKey: creating.templateKey, areas: def?.genDefaultContent({ ...data, templateKey: creating.templateKey }) }, { validateOnly })
    if (!validateOnly) {
      this.logActionResponse(resp, 'addComponent', creating.componentEventualPath, { componentKey: def?.templateKey, component: def?.name })
      if (resp.success) {
        this.updateEditorState(editorState => ({ ...editorState, page: resp.page, modal: undefined, editing: undefined, creating: undefined, clipboardPath: undefined }), true)
      }
    }
    return resp
  }

  editComponentShowModal (path: string) {
    this.logActionShown('Edit Component', path)
    this.updateEditorState(editorState => {
      const data = get<ComponentData>(editorState.page.data, path)
      return { ...editorState, modal: 'edit', editing: { path, data, templateKey: data.templateKey }, creating: undefined }
    })
  }

  async editComponentSubmit (data: any, validateOnly?: boolean) {
    const editor = this.getActiveState()
    if (!editor?.state?.editing) return { success: false, messages: [] as Feedback[], data }
    const [page, editing] = [editor.state.page, editor.state.editing]
    const resp = await api.editComponent(editor.pageId, page.version.version, page.data, editing.path, data, { validateOnly })
    if (!validateOnly) {
      this.logActionResponse(resp, 'editComponent', editing.path, { componentKey: editing.templateKey, component: editor.state.selectedLabel })
      if (resp.success) {
        this.updateEditorState(editorState => ({ ...editorState, page: resp.page, modal: undefined, editing: undefined, creating: undefined, clipboardPath: undefined }), true)
      }
    }
    return resp
  }

  removeComponentShowModal (path: string) {
    this.logActionShown('Remove Component', path)
    this.updateEditorState(editorState => {
      const data = get<ComponentData>(editorState.page.data, path)
      return { ...editorState, modal: 'delete', editing: { path, data, templateKey: data.templateKey }, creating: undefined }
    })
  }

  async removeComponentSubmit () {
    const editor = this.getActiveState()
    if (!editor?.state?.editing) return
    const [page, editing] = [editor.state.page, editor.state.editing]
    const resp = await api.removeComponent(editor.pageId, page.version.version, page.data, editing.path)
    this.logActionResponse(resp, 'removeComponent', editing.path, { componentKey: editing.templateKey, component: editor.state.selectedLabel })
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
    const editor = this.getActiveState()
    if (!editor?.state?.editing) return
    const resp = await api.editPageProperties(editor.pageId, editor.state.page.version.version, data, { validateOnly })
    if (!validateOnly) {
      this.logActionResponse(resp, 'editProperties', eventType)
      if (resp.success) {
        this.updateEditorState(editorState => ({ ...editorState, page: resp.page, modal: undefined, editing: undefined, creating: undefined }))
      }
    }
    return resp
  }

  versionsShowModal () {
    this.logActionShown('Show Versions')
    this.updateEditorState(editorState => ({ ...editorState, modal: 'versions' }))
  }

  async moveComponent (from: string, to: string) {
    const editor = this.getActiveState()
    if (!editor) return
    const resp = await api.moveComponent(editor.pageId, editor.state.page.version.version, editor.state.page.data, from, to)
    const isDrop = !this.value.clipboardPath
    const component = isDrop ? editor.state.selectedLabel : this.value.clipboardLabel
    this.logActionResponse(resp, 'moveComponent', to, { from, component, type: isDrop ? 'Drop' : 'Paste' })
    if (resp.success) {
      this.updateEditorState(editorState => ({ ...editorState, page: resp.page }), true)
    }
  }

  cancelModal () {
    const editor = this.getActiveState()
    if (editor) {
      const logInfo = {
        eventType: `${eventType}-${editor.state.modal ?? 'undefined'}-modal`,
        action: 'Cancel',
        additionalProperties: { id: editor.state.page.id, path: editor.state.page.path }
      }
      uiLog.log(logInfo, eventType)
    }
    this.updateEditorState(editorState => ({ ...editorState, modal: undefined, editing: undefined, creating: undefined }))
  }

  select (path?: string, label?: string, maxreached?: boolean, mayDelete?: boolean) {
    // TODO: Determine if we want to log every component select.
    this.updateEditorState(editorState => ({ ...editorState, selectedPath: path, selectedLabel: label, selectedMaxReached: !!maxreached, selectedMayDelete: !!mayDelete }))
  }

  cutComponent (path?: string) {
    if (!path || !this.value.editors[this.value.active!]?.cutAllowed) return
    this.update(v => ({ ...v, clipboardData: undefined, clipboardLabel: v.editors[v.active!]!.selectedLabel, clipboardPath: path, clipboardPage: v.active }))
    toast(`${this.value.clipboardLabel ?? 'Component'} cut initiated. Paste somewhere to complete the move.`, 'success')
    const editor = this.getActiveState()
    this.logActionShown('Component Cut Initiated', path, editor ? { component: editor.state.selectedLabel } : {})
  }

  copyComponent (path?: string) {
    if (!path || !this.value.editors[this.value.active!]?.copyAllowed) return
    this.update(v => ({ ...v, clipboardData: get(v.editors[v.active!]!.page.data, path), clipboardLabel: v.editors[v.active!]!.selectedLabel, clipboardPath: undefined, clipboardPage: v.active }))
    toast(`${this.value.clipboardLabel ?? 'Component'} copied.`, 'success')
    const editor = this.getActiveState()
    this.logActionShown('Component Copied', path, editor ? { component: editor.state.selectedLabel } : {})
  }

  clearClipboard () {
    this.updateEditorState(es => es, true)
    this.logActionShown('Clipboard Cleared')
  }

  async pasteComponent (path?: string) {
    const editorState = this.value.editors[this.value.active!]
    if (!path || !editorState?.pasteAllowed) return
    if (this.value.clipboardPath) { // move
      if (this.value.active === this.value.clipboardPage) await this.moveComponent(this.value.clipboardPath, path)
    } else if (this.value.clipboardData) { // copy
      // copy, potentially from another page
      const saveData = { ...this.value.clipboardData }
      const def = templateRegistry.getTemplate(saveData.templateKey)
      if (def?.randomId) saveData[def.randomId] = randomid()
      const resp = await api.insertComponent(editorState.page.id, editorState.page.version.version, editorState.page.data, path, saveData)
      this.logActionResponse(resp, 'pasteComponent', path, editorState ? { component: this.value.clipboardLabel } : {})
      if (resp.success) {
        this.updateEditorState(editorState => ({ ...editorState, page: resp.page, modal: undefined, editing: undefined, creating: undefined }), true)
      }
    }
  }

  saveState (state: any) {
    // TODO: Determine if we want to log saveState.
    this.updateEditorState(es => ({ ...es, state }))
  }

  compareVersions (from: PageEditorVersionPreview, to: PageEditorVersionPreview) {
    this.updateEditorState(es => ({ ...es, previewing: { version: to, fromVersion: from } }))
    this.logActionShown('Compare Versions')
  }

  previewVersion (version: PageEditorVersionPreview) {
    this.updateEditorState(es => ({ ...es, previewing: { version } }))
    this.logActionShown('Preview Version - Started')
  }

  setPreviewMode (mode: 'desktop' | 'mobile') {
    this.updateEditorState(es => ({ ...es, previewing: es.previewing ? { ...es.previewing, mode } : undefined }))
    this.logActionShown(`Preview Mode - ${mode}`)
  }

  initRestore (version: number) {
    this.updateEditorState(es => ({ ...es, restoreVersion: version }))
    this.logActionShown('Version Restore - Started')
  }

  cancelRestore () {
    this.updateEditorState(es => ({ ...es, restoreVersion: undefined }))
    this.logActionShown('Version Restore - Cancled')
  }

  async restoreVersion () {
    const editorState = this.value.editors[this.value.active!]
    if (!editorState?.page) return
    const version = editorState.restoreVersion
    if (version == null) return
    const resp = await api.restorePage(editorState.page.id, version)
    this.logActionResponse(resp, 'restoreVersion', editorState.page.path, { id: editorState.page.id, version: version.toLocaleString() })
    if (resp.success) {
      this.updateEditorState(es => ({ ...es, page: resp.page, previewing: undefined, restoreVersion: undefined }))
    }
  }

  cancelPreview () {
    this.updateEditorState(es => ({ ...es, previewing: undefined }))
    this.logActionShown('Preview Version - Cancled')
  }
}

export const pageEditorStore = new PageEditorStore()

// hacked these together to never be undefined, only to be used on the page detail page
export const editorStore = derivedStore(pageEditorStore, s => (s.active ? s.editors[s.active] : undefined)!)
export const pageStore = derivedStore(editorStore, 'page')
export const actionsStore = derivedStore(pageEditorStore, v => ({ clipboardData: v.clipboardData, clipboardPath: v.active === v.clipboardPage ? v.clipboardPath : undefined, clipboardPage: v.clipboardPage, clipboardLabel: v.clipboardLabel, selectedPath: v.editors[v.active!]?.selectedPath, clipboardActive: v.clipboardData || (v.clipboardPath && v.clipboardPage === v.active) }))
