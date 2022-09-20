<script lang="ts">
  import folderOutline from '@iconify-icons/mdi/folder-outline'
  import applicationOutline from '@iconify-icons/mdi/application-outline'
  import cubeLight from '@iconify-icons/ph/cube-light'
  import triangleIcon from '@iconify-icons/mdi/triangle'
  import circleIcon from '@iconify-icons/mdi/circle'
  import squareIcon from '@iconify-icons/mdi/square'
  import pencilIcon from '@iconify-icons/mdi/pencil'
  import publishIcon from '@iconify-icons/mdi/publish'
  import publishOffIcon from '@iconify-icons/mdi/publish-off'
  import plusIcon from '@iconify-icons/mdi/plus'
  import folderPlusOutline from '@iconify-icons/mdi/folder-plus-outline'
  import cursorMove from '@iconify-icons/mdi/cursor-move'
  import deleteOutline from '@iconify-icons/mdi/delete-outline'
  import deleteRestore from '@iconify-icons/mdi/delete-restore'
  import { FieldText } from '@dosgato/dialog'
  import { DateTime } from 'luxon'
  import { isBlank, unique } from 'txstate-utils'
  import { api, ActionPanel, Tree, TreeStore, DataTreeNodeType, messageForDialog, ensureRequiredNotNull, type TypedTreeItem, templateStore, type DataItem, type DataFolder, type DataSite, templateRegistry } from '$lib'
  import Dialog from '$lib/components/Dialog.svelte'
  import FormDialog from '$lib/components/FormDialog.svelte'
  import '../index.css'
  import { SubForm } from '@txstate-mws/svelte-forms'

  export let data: { mayManageGlobalData: boolean }

  let modal: 'addfolder'|'adddata'|'deletefolder'|'renamefolder'|'publishdata'|'unpublishdata'|undefined

  $: templateKey = $templateStore?.id
  $: if ($templateStore) store.refresh()

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
        api.getSiteDataRootsByTemplateKey(templateKey)
      ])
      const ret: AnyDataTreeItem[] = []
      ret.push({
        type: DataTreeNodeType.SITE,
        id: globaldataroot.id,
        hasChildren: !!globaldataroot.datafolders.length || !!globaldataroot.data.length,
        name: 'Global Data',
        permissions: {
          create: data.mayManageGlobalData
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

  function getPathIcon (type: DataTreeNodeType) {
    if (type === DataTreeNodeType.DATA) return cubeLight
    else if (type === DataTreeNodeType.FOLDER) return folderOutline
    else return applicationOutline
  }

  async function dropHandler (selectedItems: TypedDataTreeItem[], dropTarget: TypedDataTreeItem, above: boolean) {
    // TODO: call move mutation here
    return true
  }

  function dragEligible (items: TypedDataTreeItem[]) {
    return items.every(itm => itm.type !== DataTreeNodeType.SITE && itm.permissions.move)
  }

  function dropEligible (selectedItems: TypedDataTreeItem[], dropTarget: TypedDataTreeItem, above: boolean) {
    // only want to drop items if they are the same type of item
    if (unique(selectedItems.map(i => i.type)).length > 1) return false
    if (selectedItems[0].type === DataTreeNodeType.FOLDER) {
      if (dropTarget.type !== DataTreeNodeType.SITE) return false
      if (above) {
        return data.mayManageGlobalData
      } else {
        return dropTarget.permissions.create
      }
    } else {
      // Data item(s) moving
      if (above) {
        if (dropTarget.type === DataTreeNodeType.SITE) return data.mayManageGlobalData
        else if (dropTarget.type === DataTreeNodeType.FOLDER) {
          // this could be global data or data in a site, not in a folder
          if (dropTarget.level === 1) return data.mayManageGlobalData
          else {
            return dropTarget.permissions.create
          }
        } else {
          // moving data above another data item
          if (!dropTarget.parent) return data.mayManageGlobalData
          else {
            // dropTarget is in a folder or site-level
            // TODO: TypeScript thinks the parent is a DataItem but it's a Site or Folder. WHY
            return (dropTarget.parent as TreeDataFolder|TreeDataSite).permissions.create
          }
        }
      } else {
        if (dropTarget.type === DataTreeNodeType.DATA) {
          // data items can't contain other data items
          return false
        } else {
          return dropTarget.permissions.create
        }
      }
    }
  }

  const store: TreeStore<AnyDataTreeItem> = new TreeStore(fetchChildren, { dropHandler, dragEligible, dropEligible })

  function singleActions (item: TypedDataTreeItem) {
    if (item.type === DataTreeNodeType.DATA) {
      const actions = [
        { label: 'Edit', icon: pencilIcon, disabled: !item.permissions?.update, onClick: () => {} },
        { label: 'Rename', icon: pencilIcon, disabled: !item.permissions?.update, onClick: () => {} },
        { label: 'Move', icon: cursorMove, disabled: !item.permissions?.move, onClick: () => {} }
      ]
      if (item.published) {
        actions.push({ label: 'Unpublish', icon: publishOffIcon, disabled: !item.permissions?.unpublish, onClick: () => { modal = 'unpublishdata' } })
      } else {
        actions.push({ label: 'Publish', icon: publishIcon, disabled: !item.permissions?.publish, onClick: () => { modal = 'publishdata' } })
      }
      if (item.deleted) {
        actions.push({ label: 'Undelete', icon: deleteRestore, disabled: !item.permissions?.undelete, onClick: () => {} })
      } else {
        actions.push({ label: 'Delete', icon: deleteOutline, disabled: !item.permissions?.delete, onClick: () => {} })
      }
      return actions
    } else if (item.type === DataTreeNodeType.FOLDER) {
      return [
        { label: 'Rename', icon: pencilIcon, disabled: !item.permissions?.update, onClick: () => { modal = 'renamefolder' } },
        { label: 'Add Data', icon: plusIcon, disabled: !item.permissions?.create, onClick: () => { modal = 'adddata' } },
        { label: 'Delete', icon: deleteOutline, disabled: !item.permissions?.delete, onClick: () => { modal = 'deletefolder' } },
        { label: 'Undelete', icon: deleteRestore, disabled: !item.permissions?.undelete, onClick: () => {} }
      ]
    } else {
      return [
        { label: 'Add Data', icon: plusIcon, disabled: !item.permissions.create, onClick: () => { modal = 'adddata' } },
        { label: 'Add Data Folder', icon: folderPlusOutline, disabled: !item.permissions.create, onClick: () => { modal = 'addfolder' } }
      ]
    }
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
      return [
        { label: 'Move', icon: cursorMove, disabled: false, onClick: () => {} },
        { label: 'Publish', icon: publishIcon, disabled: false, onClick: () => {} },
        { label: 'Unpublish', icon: publishOffIcon, disabled: false, onClick: () => {} },
        { label: 'Delete', icon: deleteOutline, disabled: false, onClick: () => {} },
        { label: 'Undelete', icon: deleteRestore, disabled: false, onClick: () => {} }
      ]
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

  async function validateFolder (state) {
    const siteId: string|undefined = ($store.selectedItems[0] as TreeDataSite).siteId
    const resp = await api.addDataFolder(state.name, templateKey, siteId, true)
    return messageForDialog(resp.messages, 'args')
  }

  async function onDeleteFolder () {
    const resp = await api.deleteDataFolders($store.selectedItems.map(f => f.id))
    if (resp.success) store.refresh()
    modal = undefined
  }

  async function onRenameFolder (state) {
    const resp = await api.renameDataFolder($store.selectedItems[0].id, state.name)
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
    if (resp.success) store.refresh()
    modal = undefined
  }

  async function onUnpublishData () {
    const resp = await api.unpublishDataEntries($store.selectedItems.map(d => d.id))
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
    const resp = await api.addDataEntry(state.name, state.data, templateKey, siteId, folderId, true)
    console.log(resp)
    const messages = messageForDialog(resp.messages, 'args')
    const nameError = resp.messages.find(m => m.arg === 'name')
    if (nameError) messages.push({ type: nameError.type, message: nameError.message, path: nameError.arg })
    console.log(messages)
    return messages
  }

  async function onAddData (state) {
    const { siteId, folderId } = getSiteAndFolder()
    const resp = await api.addDataEntry(state.name, state.data, templateKey, siteId, folderId)
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

  function onSaved () {
    store.refresh()
    modal = undefined
  }
</script>

<ActionPanel actions={getActions($store.selectedItems)}>
  <Tree {store} headers={[
    { label: 'Path', id: 'name', defaultWidth: 'calc(60% - 16.15em)', icon: item => getPathIcon(item.type), get: 'name' },
    { label: 'Status', id: 'status', defaultWidth: '5em', icon: item => item.type === DataTreeNodeType.DATA ? statusIcon[item.status] : undefined, class: item => item.type === DataTreeNodeType.DATA ? item.status : '' },
    { label: 'Modified', id: 'modified', defaultWidth: '10em', render: item => item.type === DataTreeNodeType.DATA ? `<span>${item.modifiedAt.toFormat('LLL d yyyy h:mma').replace(/(AM|PM)$/, v => v.toLocaleLowerCase())}</span>` : '' },
    { label: 'By', id: 'modifiedBy', defaultWidth: '3em', get: 'modifiedBy.id' }
  ]}></Tree>
</ActionPanel>
{#if modal === 'addfolder'}
  <FormDialog
    submit={onAddFolder}
    validate={validateFolder}
    name='addfolder'
    title= 'Add Data Folder'
    on:escape={() => { modal = undefined }}
    on:saved={onSaved}>
    <FieldText path='name' label='Name' required></FieldText>
  </FormDialog>
{:else if modal === 'deletefolder'}
  <Dialog
    title={`Delete Data Folder${$store.selectedItems.length > 1 ? 's' : ''}`}
    continueText='Delete Folder{$store.selectedItems.length > 1 ? 's' : ''}'
    cancelText='Cancel'
    on:continue={onDeleteFolder}
    on:escape={() => { modal = undefined }}>
    {$store.selectedItems.length > 1 ? `Delete ${$store.selectedItems.length} data folders?` : `Delete data folder ${$store.selectedItems[0].name}?`}
  </Dialog>
{:else if modal === 'renamefolder'}
  <FormDialog
    submit={onRenameFolder}
    validate={validateRenameFolder}
    name='renamefolder'
    title='Rename Data Folder'
    preload={{ name: $store.selectedItems[0].name }}
    on:escape={() => { modal = undefined }}
    on:saved={onSaved}>
    <FieldText path='name' label='Name' required></FieldText>
  </FormDialog>
{:else if modal === 'publishdata'}
  <Dialog
    title='Publish Data'
    continueText='Publish'
    cancelText='Cancel'
    on:continue={onPublishData}
    on:escape={() => { modal = undefined }}>
    {$store.selectedItems.length > 1 ? `Publish ${$store.selectedItems.length} data entries?` : `Publish data ${$store.selectedItems[0].name}?`}
  </Dialog>
{:else if modal === 'unpublishdata'}
  <Dialog
    title='Unpublish Data'
    continueText='Unpublish'
    cancelText='Cancel'
    on:continue={onUnpublishData}
    on:escape={() => { modal = undefined }}>
    {$store.selectedItems.length > 1 ? `Unpublish ${$store.selectedItems.length} data entries?` : `Unpublish data ${$store.selectedItems[0].name}?`}
  </Dialog>
{:else if modal === 'adddata'}
  <FormDialog
    submit={onAddData}
    validate={validateAddData}
    title='Add Data'
    on:escape={() => { modal = undefined }}
    on:saved={onSaved}>
    <!-- TODO: Need some description text explaining this field -->
    <FieldText path='name' label='Data Name' required></FieldText>
    {@const reg = templateRegistry.getTemplate($templateStore.id)}
    {#if reg}
      <SubForm path='data'>
        <svelte:component this={reg.dialog}></svelte:component>
      </SubForm>
    {/if}
  </FormDialog>
{/if}
