<script lang="ts">
  import applicationOutline from '@iconify-icons/mdi/application-outline'
  import circleIcon from '@iconify-icons/mdi/circle'
  import contentCopy from '@iconify-icons/mdi/content-copy'
  import contentPaste from '@iconify-icons/mdi/content-paste'
  import cube from '@iconify-icons/ph/cube'
  import cursorMove from '@iconify-icons/mdi/cursor-move'
  import deleteOutline from '@iconify-icons/mdi/delete-outline'
  import deleteRestore from '@iconify-icons/mdi/delete-restore'
  import deleteEmpty from '@iconify-icons/mdi/delete-empty'
  import fileX from '@iconify-icons/ph/file-x'
  import folderOutline from '@iconify-icons/mdi/folder-outline'
  import folderPlusOutline from '@iconify-icons/mdi/folder-plus-outline'
  import pencilIcon from '@iconify-icons/mdi/pencil'
  import publishIcon from '@iconify-icons/mdi/publish'
  import publishOffIcon from '@iconify-icons/mdi/publish-off'
  import plusIcon from '@iconify-icons/mdi/plus'
  import squareIcon from '@iconify-icons/mdi/square'
  import triangleIcon from '@iconify-icons/mdi/triangle'
  import renameIcon from '@iconify-icons/material-symbols/format-color-text-rounded'
  import { Dialog, FieldText, FormDialog, Tree, TreeStore, type TypedTreeItem } from '@dosgato/dialog'
  import { MessageType, SubForm } from '@txstate-mws/svelte-forms'
  import { DateTime } from 'luxon'
  import { htmlEncode, unique, get } from 'txstate-utils'
  import { api, ActionPanel, DataTreeNodeType, messageForDialog, type DataItem, type DataFolder, type DataSite, type DataWithData, DeleteState, type MoveDataTarget, type ActionPanelAction, environmentConfig, ChooserClient, uiLog, templateRegistry, type EnhancedDataTemplate } from '$lib'
  import '../index.css'
  import { afterNavigate } from '$app/navigation'
  import { setContext } from 'svelte'

  let loadedData: { mayManageGlobalData: boolean, template: EnhancedDataTemplate }
  export { loadedData as data }

  $: templateKey = loadedData.template.templateKey
  $: tmpl = loadedData.template

  let modal: 'addfolder' | 'adddata' | 'deletefolder' | 'renamefolder' | 'editdata' | 'publishdata' | 'unpublishdata' | 'deletedata' | 'publishdeletedata' | 'undeletedata' | undefined

  const chooserClient = new ChooserClient()

  const statusIcon = {
    published: triangleIcon,
    modified: circleIcon,
    unpublished: squareIcon
  }

  interface TreeDataItem extends Omit<Omit<DataItem, 'modifiedAt'>, 'publishedAt'> {
    type: DataTreeNodeType.DATA
    hasChildren: boolean
    modifiedAt: DateTime
    publishedAt: DateTime
    status: string
    deleteState: number
  }

  interface TreeDataFolder extends Omit<DataFolder, 'data'> {
    type: DataTreeNodeType.FOLDER
    hasChildren: boolean
  }

  interface TreeDataSite extends Omit<Omit<DataSite, 'data'>, 'datafolders'> {
    type: DataTreeNodeType.SITE
    hasChildren: boolean
    siteId?: string
    permissions: {
      create: boolean
    }
  }

  type AnyDataTreeItem = TreeDataItem | TreeDataFolder | TreeDataSite

  type TypedDataTreeItem = TypedTreeItem<AnyDataTreeItem>

  async function fetchChildren (item?: TypedDataTreeItem) {
    if (item) {
      if (item.type === DataTreeNodeType.DATA) return []
      if (item.type === DataTreeNodeType.FOLDER) {
        const data = await api.getDataByFolderId(item.id)
        return data.map(d => {
          const modifiedAt = DateTime.fromISO(d.modifiedAt)
          const publishedAt = DateTime.fromISO(d.publishedAt)
          return {
            ...d,
            type: DataTreeNodeType.DATA,
            hasChildren: false,
            modifiedAt,
            publishedAt,
            status: d.published ? (publishedAt >= modifiedAt ? 'published' : 'modified') : 'unpublished'
          } as AnyDataTreeItem
        })
      }
      if (item.type === DataTreeNodeType.SITE) {
        const dataroot = item.siteId ? await api.getSiteDataByTemplateKey(item.siteId, templateKey) : await api.getGlobalDataRootByTemplateKey(templateKey)
        const ret: AnyDataTreeItem[] = []
        for (const f of dataroot.datafolders) {
          ret.push({
            ...f,
            type: DataTreeNodeType.FOLDER,
            hasChildren: !!f.data.length
          })
        }
        for (const d of dataroot.data) {
          const modifiedAt = DateTime.fromISO(d.modifiedAt)
          const publishedAt = DateTime.fromISO(d.publishedAt)
          ret.push({
            ...d,
            type: DataTreeNodeType.DATA,
            hasChildren: false,
            modifiedAt,
            publishedAt,
            status: d.published ? (publishedAt >= modifiedAt ? 'published' : 'modified') : 'unpublished'
          })
        }
        return ret
      }
    } else {
      const [globaldataroot, sitedataroots] = await Promise.all([
        api.getGlobalDataRootByTemplateKey(templateKey),
        loadedData.template?.global ? [] : api.getSiteDataRootsByTemplateKey(templateKey)
      ])
      const ret: AnyDataTreeItem[] = []
      ret.push({
        type: DataTreeNodeType.SITE,
        id: globaldataroot.id,
        hasChildren: !!globaldataroot.datafolders.length || !!globaldataroot.data.length,
        name: 'Global Data',
        permissions: {
          create: loadedData.mayManageGlobalData
        }
      })
      for (const dr of sitedataroots) {
        ret.push({
          id: dr.id,
          name: dr.site!.name,
          siteId: dr.site!.id,
          type: DataTreeNodeType.SITE,
          hasChildren: !!dr.data.length || !!dr.datafolders.length,
          permissions: { create: dr.permissions.create }
        })
      }
      return ret
    }
    return []
  }

  function getPathIcon (item: AnyDataTreeItem) {
    const type = item.type
    if (type === DataTreeNodeType.DATA) return item.deleteState === DeleteState.MARKEDFORDELETE ? deleteEmpty : cube
    else if (type === DataTreeNodeType.FOLDER) return folderOutline
    else return applicationOutline
  }

  async function moveHandler (selectedItems: TypedDataTreeItem[], dropTarget: TypedDataTreeItem, above: boolean) {
    const ids = selectedItems.map(d => d.id)
    if (selectedItems[0].type === DataTreeNodeType.DATA) {
      let target: MoveDataTarget = {}
      if (above) {
        if (dropTarget.type === DataTreeNodeType.FOLDER) {
          if (!dropTarget.parent!.id.includes('global-')) target = { siteId: (dropTarget.parent! as TreeDataSite).siteId }
        } else {
          target = { aboveTarget: dropTarget.id }
        }
      } else {
        if (dropTarget.type === DataTreeNodeType.FOLDER) {
          target = { folderId: dropTarget.id }
        } else {
          if (!dropTarget.id.includes('global-')) target = { siteId: (dropTarget as TreeDataSite).siteId }
        }
      }
      await api.moveData(ids, target)
    } else if (selectedItems[0].type === DataTreeNodeType.FOLDER) {
      const siteId = dropTarget.id.includes('global-') ? undefined : (dropTarget as TreeDataSite).siteId
      await api.moveDataFolders(ids, siteId)
    }
    return true
  }

  function dragEligible (items: TypedDataTreeItem[]) {
    return items.every(itm => itm.type !== DataTreeNodeType.SITE && itm.permissions.move)
  }

  function dropEffect (selectedItems: TypedDataTreeItem[], dropTarget: TypedDataTreeItem, above: boolean) {
    // only want to drop items if they are the same type of item
    if (unique(selectedItems.map(i => i.type)).length > 1) return 'none'
    if (selectedItems[0].type === DataTreeNodeType.FOLDER) {
      if (dropTarget.type !== DataTreeNodeType.SITE) return 'none'
      return above || !dropTarget.permissions.create ? 'none' : 'move'
    } else {
      // Data item(s) moving
      if (above) {
        // can't move anything above a site
        if (dropTarget.type === DataTreeNodeType.SITE) return 'none'
        else if (dropTarget.type === DataTreeNodeType.FOLDER) {
          // moving it above a folder means moving it into a site
          const parent = dropTarget.parent as TreeDataSite
          return parent.permissions.create ? 'move' : 'none'
        } else {
          // moving it above another data item
          const parent = dropTarget.parent!.type === DataTreeNodeType.SITE ? dropTarget.parent as TreeDataSite : dropTarget.parent as TreeDataFolder
          return parent.permissions.create ? 'move' : 'none'
        }
      } else {
        // data items can't contain other data items
        if (dropTarget.type === DataTreeNodeType.DATA) return 'none'
        else {
          // It doesn't make sense to drag something into its own parent
          const parents = selectedItems.map(i => i.parent!.id)
          if (parents.includes(dropTarget.id)) return 'none'
          return dropTarget.permissions.create ? 'move' : 'none'
        }
      }
    }
  }

  const store: TreeStore<AnyDataTreeItem> = new TreeStore(fetchChildren, { moveHandler, dragEligible, dropEffect })

  function singleActions (item: TypedDataTreeItem) {
    if (item.type === DataTreeNodeType.DATA) {
      const actions: ActionPanelAction[] = [
        { label: 'Edit', icon: pencilIcon, disabled: !item.permissions?.update, onClick: onClickEdit }
      ]
      if ($store.copied.size) {
        actions.push({ label: `Cancel ${$store.cut ? 'Move' : 'Copy'}`, icon: fileX, onClick: () => { store.cancelCopy() } })
      } else {
        actions.push({ label: 'Move', icon: cursorMove, disabled: !store.cutEligible(), onClick: () => store.cut() })
      }
      if (item.deleteState === DeleteState.NOTDELETED) {
        actions.push({ label: 'Publish', icon: publishIcon, disabled: !item.permissions?.publish, onClick: () => { modal = 'publishdata' } })
      } else if (item.deleteState === DeleteState.MARKEDFORDELETE) {
        actions.push({ label: 'Publish Deletion', icon: deleteOutline, disabled: !item.permissions.delete, onClick: () => { modal = 'publishdeletedata' } })
      }
      actions.push({ label: 'Unpublish', icon: publishOffIcon, disabled: !item.permissions?.unpublish, onClick: () => { modal = 'unpublishdata' } })
      if (item.deleteState === DeleteState.NOTDELETED) actions.push({ label: 'Delete', icon: deleteOutline, disabled: !item.permissions?.delete, onClick: () => { modal = 'deletedata' } })
      else if (item.deleteState === DeleteState.MARKEDFORDELETE) {
        actions.push({ label: 'Restore Data', icon: deleteRestore, disabled: !item.permissions?.undelete, onClick: () => { modal = 'undeletedata' } })
      }
      return actions
    } else if (item.type === DataTreeNodeType.FOLDER) {
      return [
        { label: 'Rename', icon: renameIcon, disabled: !item.permissions?.update, onClick: () => { modal = 'renamefolder' } },
        { label: 'Add Data', icon: plusIcon, disabled: !item.permissions?.create, onClick: () => { modal = 'adddata' } },
        { label: 'Delete', icon: deleteOutline, disabled: !item.permissions?.delete, onClick: () => { modal = 'deletefolder' } },
        { label: 'Undelete', icon: deleteRestore, disabled: !item.permissions?.undelete, onClick: () => {} },
        { label: $store.cut ? 'Move Into' : 'Paste', hiddenLabel: `${$store.cut ? '' : 'into '}${item.name}`, icon: contentPaste, disabled: !store.pasteEligible(), onClick: () => { store.paste() } }
      ]
    } else {
      return [
        { label: 'Add Data', icon: plusIcon, disabled: !item.permissions.create, onClick: () => { modal = 'adddata' } },
        { label: 'Add Data Folder', icon: folderPlusOutline, disabled: !item.permissions.create, onClick: () => { modal = 'addfolder' } }
      ]
    }
  }

  function publishMultipleDeletionDisabled (items: TypedTreeItem<TreeDataItem>[]) {
    if (items.some((item: TypedTreeItem<TreeDataItem>) => !item.permissions.delete)) return true
    if (items.some((item: TypedTreeItem<TreeDataItem>) => item.deleteState === DeleteState.NOTDELETED)) return true
    return false
  }

  function multipleActions (items: TypedDataTreeItem[]) {
    // the only data/datafolder actions available for sites are Adding data and datafolders
    // and that doesn't make sense in the context of multiple selections
    if (items.some((item) => item.type === DataTreeNodeType.SITE)) return []
    if (items.every((item) => item.type === DataTreeNodeType.FOLDER)) {
      return [
        { label: 'Delete', icon: deleteOutline, disabled: false, onClick: () => { modal = 'deletefolder' } },
        { label: 'Undelete', icon: deleteRestore, disabled: false, onClick: () => {} }
      ]
    }
    if (items.every((item) => item.type === DataTreeNodeType.DATA)) {
      const actions: ActionPanelAction[] = [
        { label: 'Publish', icon: publishIcon, disabled: items.some((item: TypedTreeItem<TreeDataItem>) => !item.permissions.publish), onClick: () => { modal = 'publishdata' } },
        { label: 'Unpublish', icon: publishOffIcon, disabled: items.some((item: TypedTreeItem<TreeDataItem>) => !item.permissions.unpublish), onClick: () => { modal = 'unpublishdata' } },
        { label: 'Delete', icon: deleteOutline, disabled: items.some((item: TypedTreeItem<TreeDataItem>) => !item.permissions.delete), onClick: () => { modal = 'deletedata' } },
        { label: 'Publish Deletion', icon: deleteOutline, disabled: publishMultipleDeletionDisabled(items as TypedTreeItem<TreeDataItem>[]), onClick: () => { modal = 'publishdeletedata' } },
        { label: 'Restore Data', icon: deleteRestore, disabled: items.some((item: TypedTreeItem<TreeDataItem>) => !item.permissions.undelete), onClick: () => { modal = 'undeletedata' } }
      ]
      if ($store.copied.size) {
        actions.push({ label: `Cancel ${$store.cut ? 'Move' : 'Copy'}`, icon: fileX, onClick: () => { store.cancelCopy() } })
      } else {
        actions.push({ label: 'Move', icon: cursorMove, disabled: !store.cutEligible(), onClick: () => store.cut() })
      }
      return actions
    }
    return []
  }

  function getActions (selectedItems: TypedDataTreeItem[]) {
    if (selectedItems.length === 1) return singleActions(selectedItems[0])
    if (selectedItems.length > 1) return multipleActions(selectedItems)
    return []
  }

  async function onAddFolder (state) {
    const siteId: string|undefined = ($store.selectedItems[0] as TreeDataSite).siteId
    const resp = await api.addDataFolder(state.name, templateKey, siteId)
    uiLog.log(
      {
        eventType: `${modal}-modal`,
        action: resp.success ? 'Success' : 'Failed',
        additionalProperties: { parent: actionPanelTarget.target }
      }, resp.dataFolder?.name)
    return {
      success: resp.success,
      messages: messageForDialog(resp.messages, 'args'),
      data: resp.success
        ? {
            name: resp.dataFolder!.name
          }
        : undefined
    }
  }

  async function onAddFolderComplete () {
    store.openAndRefresh($store.selectedItems[0])
    modal = undefined
  }

  async function validateFolder (state) {
    const siteId: string|undefined = ($store.selectedItems[0] as TreeDataSite).siteId
    const resp = await api.addDataFolder(state.name, templateKey, siteId, true)
    return messageForDialog(resp.messages, 'args')
  }

  async function onDeleteFolder () {
    const resp = await api.deleteDataFolders($store.selectedItems.map(f => f.id))
    uiLog.log(
      {
        eventType: `${modal}-modal`,
        action: resp.success ? 'Success' : 'Failed'
      }, actionPanelTarget.target)
    if (resp.success) store.refresh()
    modal = undefined
  }

  async function onRenameFolder (state) {
    const resp = await api.renameDataFolder($store.selectedItems[0].id, state.name)
    uiLog.log(
      {
        eventType: `${modal}-modal`,
        action: resp.success ? 'Success' : 'Failed',
        additionalProperties: { newName: resp.dataFolder?.name }
      }, actionPanelTarget.target)
    return {
      success: resp.success,
      messages: messageForDialog(resp.messages, ''),
      data: resp.success
        ? {
            name: resp.dataFolder!.name
          }
        : undefined
    }
  }

  async function validateRenameFolder (state) {
    const resp = await api.renameDataFolder($store.selectedItems[0].id, state.name, true)
    return messageForDialog(resp.messages, '')
  }

  async function onPublishData () {
    const resp = await api.publishDataEntries($store.selectedItems.map(d => d.id))
    uiLog.log(
      {
        eventType: `${modal}-modal`,
        action: resp.success ? 'Success' : 'Failed'
      }, actionPanelTarget.target)
    if (resp.success) store.refresh()
    modal = undefined
  }

  async function onUnpublishData () {
    const resp = await api.unpublishDataEntries($store.selectedItems.map(d => d.id))
    uiLog.log(
      {
        eventType: `${modal}-modal`,
        action: resp.success ? 'Success' : 'Failed'
      }, actionPanelTarget.target)
    if (resp.success) store.refresh()
    modal = undefined
  }

  function getSiteAndFolder () {
    let siteId: string|undefined
    let folderId: string|undefined
    const selected = $store.selectedItems[0]
    if (selected.type === DataTreeNodeType.SITE) {
      siteId = selected.siteId
    } else if (selected.type === DataTreeNodeType.FOLDER) {
      folderId = selected.id
      siteId = (selected.parent as TreeDataSite).siteId
    }
    return { siteId, folderId }
  }

  async function validateAddData (state) {
    const { siteId, folderId } = getSiteAndFolder()
    const resp = await api.addDataEntry(state.data, templateKey, siteId, folderId, true)
    const messages = messageForDialog(resp.messages, 'args')
    const nameError = resp.messages.find(m => m.arg === 'name')
    if (nameError) messages.push({ type: nameError.type, message: nameError.message, path: nameError.arg })
    return messages
  }

  async function onAddData (state) {
    const { siteId, folderId } = getSiteAndFolder()
    const resp = await api.addDataEntry(state.data, templateKey, siteId, folderId)
    uiLog.log(
      {
        eventType: `${modal}-modal`,
        action: resp.success ? 'Success' : 'Failed',
        additionalProperties: { siteId, folderId }
      }, resp.data?.name)
    return {
      success: resp.success,
      messages: [...messageForDialog(resp.messages, ''), ...messageForDialog(resp.messages, 'args')],
      data: resp.success
        ? {
            name: resp.data!.name,
            data: state
          }
        : state
    }
  }

  async function onAddDataComplete () {
    store.openAndRefresh($store.selectedItems[0])
    modal = undefined
  }

  let itemEditing: DataWithData | undefined = undefined

  async function onClickEdit () {
    itemEditing = await api.getDataEntryById($store.selectedItems[0].id)
    modal = 'editdata'
  }

  async function onEditData (state) {
    if (!itemEditing) return { success: false, messages: [{ message: 'Something went wrong. Please contact support for help.', type: MessageType.ERROR }], data: state }
    const resp = await api.editDataEntry(itemEditing.id, state.data, templateKey, itemEditing.version.version)
    uiLog.log(
      {
        eventType: `${modal}-modal`,
        action: resp.success ? 'Success' : 'Failed'
      }, actionPanelTarget.target)
    return {
      success: resp.success,
      messages: messageForDialog(resp.messages, 'args'),
      data: resp.success ? resp.data : state
    }
  }

  async function validateEdit (state) {
    if (!itemEditing) return [{ message: 'Something went wrong. Please contact support for help.', type: MessageType.ERROR }]
    const resp = await api.editDataEntry(itemEditing.id, state.data, templateKey, itemEditing.version.version, true)
    return messageForDialog(resp.messages, 'args')
  }

  function onSaved () {
    store.refresh()
    modal = undefined
    if (itemEditing) itemEditing = undefined
  }

  async function onDeleteData () {
    const resp = await api.deleteDataEntries($store.selectedItems.map(d => d.id))
    uiLog.log(
      {
        eventType: `${modal}-modal`,
        action: resp.success ? 'Success' : 'Failed'
      }, actionPanelTarget.target)
    if (resp.success) store.refresh()
    modal = undefined
  }

  async function onPublishDeletion () {
    const resp = await api.publishDeleteData($store.selectedItems.map(d => d.id))
    uiLog.log(
      {
        eventType: `${modal}-modal`,
        action: resp.success ? 'Success' : 'Failed'
      }, actionPanelTarget.target)
    if (resp.success) store.refresh()
    modal = undefined
  }

  async function onUndeleteData () {
    const resp = await api.undeleteData($store.selectedItems.map(d => d.id))
    uiLog.log(
      {
        eventType: `${modal}-modal`,
        action: resp.success ? 'Success' : 'Failed'
      }, actionPanelTarget.target)
    if (resp.success) store.refresh()
    modal = undefined
  }

  afterNavigate(() => store.refresh().catch(console.error))

  const onEscapeModal = () => {
    uiLog.log({ eventType: `${modal}-modal`, action: 'Cancel' }, actionPanelTarget.target)
    modal = undefined
  }

  function getIcon (c: NonNullable<EnhancedDataTemplate['columns']>[0]) {
    if (!c || !c.icon) return undefined
    return (item: TypedTreeItem<TreeDataItem>) => {
      return { icon: c.icon!(item.data) }
    }
  }

  const actionPanelTarget: { target: string | undefined } = { target: undefined }
  setContext('ActionPanelTarget', { getTarget: () => actionPanelTarget.target })
  $: actionPanelTarget.target = uiLog.targetFromTreeStore($store, 'name')
</script>

<ActionPanel actionsTitle={$store.selected.size === 1 ? $store.selectedItems[0].name : 'Data'} actions={getActions($store.selectedItems)}>
  <Tree {store} headers={[
    { label: 'Path', id: 'name', grow: 1, icon: item => ({ icon: getPathIcon(item) }), get: 'name' },
    ...(tmpl?.columns?.map(c => ({
      label: c.title,
      id: 'custom-' + c.title,
      grow: c.grow,
      fixed: c.fixed,
      icon: getIcon(c),
      render: item => 'data' in item ? ((typeof c.get === 'string' ? htmlEncode(String(get(item.data, c.get))) : c.get(item.data)) ?? '') : ''
    })) ?? []),
    { label: 'Status', id: 'status', fixed: '5em', icon: item => ({ icon: item.type === DataTreeNodeType.DATA ? (item.deleteState === DeleteState.MARKEDFORDELETE ? deleteOutline : statusIcon[item.status]) : undefined, label: item.type === DataTreeNodeType.DATA ? item.deleteState === DeleteState.NOTDELETED ? item.status : 'deleted' : undefined }), class: item => item.type === DataTreeNodeType.DATA ? (item.deleteState === DeleteState.MARKEDFORDELETE ? 'deleted' : item.status) : '' },
    { label: 'Modified', id: 'modified', fixed: '10em', render: item => item.type === DataTreeNodeType.DATA ? `<span>${item.modifiedAt.toFormat('LLL d yyyy h:mma').replace(/(AM|PM)$/, v => v.toLocaleLowerCase())}</span>` : '' },
    { label: 'By', id: 'modifiedBy', fixed: '5em', get: 'modifiedBy.id' }
  ]} searchable='name' on:choose={onClickEdit} />
</ActionPanel>
{#if modal === 'addfolder'}
  <FormDialog
    submit={onAddFolder}
    validate={validateFolder}
    name='addfolder'
    title= 'Add Data Folder'
    on:escape={onEscapeModal}
    on:saved={onAddFolderComplete}>
    <FieldText path='name' label='Name' required></FieldText>
  </FormDialog>
{:else if modal === 'deletefolder'}
  <Dialog
    title={`Delete Data Folder${$store.selectedItems.length > 1 ? 's' : ''}`}
    continueText='Delete Folder{$store.selectedItems.length > 1 ? 's' : ''}'
    cancelText='Cancel'
    on:continue={onDeleteFolder}
    on:escape={onEscapeModal} >
    {$store.selectedItems.length > 1 ? `Delete ${$store.selectedItems.length} data folders?` : `Delete data folder ${$store.selectedItems[0].name}?`}
  </Dialog>
{:else if modal === 'renamefolder'}
  <FormDialog
    submit={onRenameFolder}
    validate={validateRenameFolder}
    name='renamefolder'
    title='Rename Data Folder'
    preload={{ name: $store.selectedItems[0].name }}
    on:escape={onEscapeModal}
    on:saved={onSaved}>
    <FieldText path='name' label='Name' required></FieldText>
  </FormDialog>
{:else if modal === 'publishdata'}
  <Dialog
    title='Publish Data'
    continueText='Publish'
    cancelText='Cancel'
    on:continue={onPublishData}
    on:escape={onEscapeModal} >
    {$store.selectedItems.length > 1 ? `Publish ${$store.selectedItems.length} data entries?` : `Publish data ${$store.selectedItems[0].name}?`}
  </Dialog>
{:else if modal === 'unpublishdata'}
  <Dialog
    title='Unpublish Data'
    continueText='Unpublish'
    cancelText='Cancel'
    on:continue={onUnpublishData}
    on:escape={onEscapeModal} >
    {$store.selectedItems.length > 1 ? `Unpublish ${$store.selectedItems.length} data entries?` : `Unpublish data ${$store.selectedItems[0].name}?`}
  </Dialog>
{:else if modal === 'adddata'}
  <FormDialog
    {chooserClient}
    submit={onAddData}
    validate={validateAddData}
    title='Add Data'
    on:escape={onEscapeModal}
    on:saved={onAddDataComplete} let:data>
    {#if loadedData.template.dialog}
      <SubForm path='data' let:value>
        <svelte:component this={loadedData.template.dialog} creating={true} {environmentConfig} data={value ?? {}} />
      </SubForm>
    {/if}
  </FormDialog>
{:else if modal === 'editdata'}
  <FormDialog
    {chooserClient}
    submit={onEditData}
    validate={validateEdit}
    title='Edit Data'
    on:escape={onEscapeModal}
    on:saved={onSaved}
    preload={{ data: itemEditing ? itemEditing.data : {} }}>
    {#if loadedData.template.dialog}
      <SubForm path='data' let:value>
        <svelte:component this={loadedData.template.dialog} creating={false} {environmentConfig} data={value ?? {}} />
      </SubForm>
    {/if}
  </FormDialog>
{:else if modal === 'deletedata'}
  <Dialog
    title='Delete'
    continueText='Delete'
    cancelText='Cancel'
    on:continue={onDeleteData}
    on:escape={onEscapeModal}>
    Delete this data?
  </Dialog>
{:else if modal === 'publishdeletedata'}
  <Dialog
    title='Publish Deletion'
    continueText='Delete'
    cancelText='Cancel'
    on:continue={onPublishDeletion}
    on:escape={onEscapeModal}>
    Publish this deletion? The selected data will no longer appear in sites.
  </Dialog>
{:else if modal === 'undeletedata'}
  <Dialog
    title='Restore Deleted Data'
    continueText='Restore'
    cancelText='Cancel'
    on:continue={onUndeleteData}
    on:escape={onEscapeModal}>
    Restore this deleted data?
  </Dialog>
{/if}
