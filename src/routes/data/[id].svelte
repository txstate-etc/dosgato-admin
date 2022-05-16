<script lang="ts" context="module">
  import folderOutline from '@iconify-icons/mdi/folder-outline'
  import applicationOutline from '@iconify-icons/mdi/application-outline'
  import databaseOutline from '@iconify-icons/mdi/database-outline'
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
  import type { Load } from '@sveltejs/kit'
  import { isNull, unique } from 'txstate-utils'
  import { DateTime } from 'luxon'

  let templateKey
  let mayManageGlobalData: boolean = false

  export const load: Load = async ({ params }) => {
    const template = await api.getTemplateInfo(params.id)
    if (!template) return { status: 404 }
    templateKey = template.key
    dataListStore.open({ id: params.id, name: template.name })
    mayManageGlobalData = await api.getGlobalDataAccessByTemplateKey(templateKey)
    return {}
  }

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
        const [sitefolders, sitedata] = await Promise.all([
          api.getDataFoldersBySiteId(item.id, templateKey),
          api.getDataBySiteId(item.id, templateKey)
        ])
        const ret: AnyDataTreeItem[] = []
        for (const f of sitefolders) {
          console.log(f)
          ret.push({
            ...f,
            type: DataTreeNodeType.FOLDER,
            hasChildren: !!f.data.length
          })
        }
        for (const d of sitedata.filter(data => isNull(data.folder))) {
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
      const [globalData, globalFolders, sites] = await Promise.all([
        api.getGlobalDataByTemplateKey(templateKey),
        api.getGlobalDataFoldersByTemplateKey(templateKey),
        api.getSitesAndData(templateKey)
      ])
      const ret: AnyDataTreeItem[] = []
      for (const f of globalFolders) {
        ret.push({
          ...f,
          type: DataTreeNodeType.FOLDER,
          hasChildren: !!f.data.length
        })
      }
      for (const d of globalData.filter(d => isNull(d.folder))) {
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
      for (const s of sites) {
        ret.push({
          ...s,
          type: DataTreeNodeType.SITE,
          hasChildren: !!s.data.length || !!s.datafolders.length
        })
      }
      return ret
    }
    return []
  }

  function getPathIcon (type: DataTreeNodeType) {
    if (type === DataTreeNodeType.DATA) return databaseOutline
    else if (type === DataTreeNodeType.FOLDER) return folderOutline
    else return applicationOutline
  }

  async function dropHandler (selectedItems: TypedDataTreeItem[], dropTarget: TypedDataTreeItem, above: boolean) {
    // TODO: call move mutation here
    return true
  }

  function dragEligible (item: TypedDataTreeItem) {
    if (item.type === DataTreeNodeType.SITE) return false
    return item.permissions.move
  }

  function dropEligible (selectedItems: TypedDataTreeItem[], dropTarget: TypedDataTreeItem, above: boolean) {
    // only want to drop items if they are the same type of item
    if (unique(selectedItems.map(i => i.type)).length > 1) return false
    if (selectedItems[0].type === DataTreeNodeType.FOLDER) {
      if (dropTarget.type !== DataTreeNodeType.SITE) return false
      if (above) {
        return mayManageGlobalData
      } else {
        // TODO: Can they create data or datafolders in a site?
        return true
      }
    } else {
      // Data item(s) moving
      if (above) {
        if (dropTarget.type === DataTreeNodeType.SITE) return mayManageGlobalData
        else if (dropTarget.type === DataTreeNodeType.FOLDER) {
          // this could be global data or data in a site, not in a folder
          if (dropTarget.level === 1) return mayManageGlobalData
          else {
            // TODO: Can they create data or datafolders in the site?
            return true
          }
        } else {
          // moving data above another data item
          if (dropTarget.level === 1) return mayManageGlobalData
          else {
            if (dropTarget.folder) {
              // moving data items above data item in folder
              return dropTarget.parent?.permissions.create
            } else {
              // moving data items above site-level data
              // TODO: Can they create data or datafolders in the site?
              return true
            }
          }
        }
      } else {
        if (dropTarget.type === DataTreeNodeType.SITE) {
          // moving data in site, not in folder
          // TODO: Can they create data or datafolders in the site?
          return true
        } else if (dropTarget.type === DataTreeNodeType.FOLDER) {
          // moving data inside a folder
          return dropTarget.permissions.create
        } else {
          // data items can't contain other data items
          return false
        }
      }
    }
  }

  const store: TreeStore<AnyDataTreeItem> = new TreeStore(fetchChildren, { dropHandler, dragEligible, dropEligible })
</script>
<script lang="ts">
  import { api, ActionPanel, Tree, TreeStore, DataTreeNodeType, type TypedTreeItem, dataListStore, type DataItem, type DataFolder, type DataSite } from '$lib'
  import './index.css'
  import { FieldText } from '@dosgato/dialog'
  import Dialog from '$lib/components/Dialog.svelte'
  import FormDialog from '$lib/components/FormDialog.svelte'
  import { MessageType, type Feedback } from '@txstate-mws/svelte-forms'

  let modal: 'addfolder'|'adddata'|'deletefolder'|'renamefolder'|undefined

  function zeroactions () {
    if (!mayManageGlobalData) return []
    return [
      { label: 'Add Data', icon: plusIcon, disabled: false, onClick: () => { modal = 'adddata' } },
      { label: 'Add Data Folder', icon: folderPlusOutline, disabled: false, onClick: () => { modal = 'addfolder' } }
    ]
  }

  function singleActions (item: TypedDataTreeItem) {
    if (item.type === DataTreeNodeType.DATA) {
      return [
        { label: 'Edit', icon: pencilIcon, disabled: !item.permissions?.update, onClick: () => {} },
        { label: 'Rename', icon: pencilIcon, disabled: !item.permissions?.update, onClick: () => {} },
        { label: 'Move', icon: cursorMove, disabled: !item.permissions?.move, onClick: () => {} },
        { label: 'Publish', icon: publishIcon, disabled: !item.permissions?.publish, onClick: () => {} },
        { label: 'Unpublish', icon: publishOffIcon, disabled: !item.permissions?.unpublish, onClick: () => {} },
        { label: 'Delete', icon: deleteOutline, disabled: !item.permissions?.delete, onClick: () => {} },
        { label: 'Undelete', icon: deleteRestore, disabled: !item.permissions?.undelete, onClick: () => {} }
      ]
    } else if (item.type === DataTreeNodeType.FOLDER) {
      return [
        { label: 'Rename', icon: pencilIcon, disabled: !item.permissions?.update, onClick: () => { modal = 'renamefolder' } },
        { label: 'Add Data', icon: plusIcon, disabled: !item.permissions?.create, onClick: () => {} },
        { label: 'Delete', icon: deleteOutline, disabled: !item.permissions?.delete, onClick: () => { modal = 'deletefolder' } },
        { label: 'Undelete', icon: deleteRestore, disabled: !item.permissions?.undelete, onClick: () => {} }
      ]
    } else {
      // TODO: permissions here? The item is a site, which doesn't have permissions related to data.
      return [
        { label: 'Add Data', icon: plusIcon, disabled: false, onClick: () => {} },
        { label: 'Add Data Folder', icon: folderPlusOutline, disabled: false, onClick: () => { modal = 'addfolder' } }
      ]
    }
  }

  function multipleActions (items: TypedDataTreeItem[]) {
    // the only data/datafolder actions available for sites are Adding data and datafolders
    // and that doesn't make sense in the context of multiple selections
    if (items.some((item) => item.type === DataTreeNodeType.SITE)) return []
    if (items.every((item) => item.type === DataTreeNodeType.FOLDER)) {
      return [
        { label: 'Delete', icon: deleteOutline, disabled: false, onClick: () => {} },
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
    if (selectedItems.length === 0) return zeroactions()
    if (selectedItems.length === 1) return singleActions(selectedItems[0])
    if (selectedItems.length > 1) return multipleActions(selectedItems)
    return []
  }

  async function onAddFolder (state) {
    let siteId: string|undefined
    if ($store.selectedItems.length === 1 && $store.selectedItems[0].type === DataTreeNodeType.SITE) {
      siteId = $store.selectedItems[0].id
    }
    const resp = await api.addDataFolder(state.name, templateKey, siteId)
    if (resp.success) store.refresh()
    modal = undefined
    return { success: resp.success, messages: resp.messages, data: resp.dataFolder }
  }

  async function validateFolder (state) {
    const feedback: Feedback[] = []
    if (isNull(state.name)) {
      feedback.push({ type: MessageType.ERROR, message: 'Name is required', path: 'name' })
    }
    return feedback
  }

  async function onDeleteFolder () {
    const resp = await api.deleteDataFolders($store.selectedItems.map(f => f.id))
    if (resp.success) store.refresh()
    modal = undefined
  }

  async function onRenameFolder (state) {
    const resp = await api.renameDataFolder($store.selectedItems[0].id, state.name)
    if (resp.success) store.refresh()
    modal = undefined
    return { success: resp.success, messages: resp.messages, data: resp.dataFolder }
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
    name="addfolder"
    title= "Add Data Folder"
    on:dismiss={() => { modal = undefined }}>
    <FieldText path="name" label="Name" required></FieldText>
  </FormDialog>
{:else if modal === 'deletefolder'}
  <Dialog
    title={`Delete Data Folder${$store.selectedItems.length > 1 ? 's' : ''}`}
    continueText="Delete Folder{$store.selectedItems.length > 1 ? 's' : ''}"
    cancelText="Cancel"
    on:continue={onDeleteFolder}
    on:dismiss={() => { modal = undefined }}>
    {$store.selectedItems.length > 1 ? `Delete ${$store.selectedItems.length} data folders?` : `Delete data folder ${$store.selectedItems[0].name}?`}
  </Dialog>
{:else if modal === 'renamefolder'}
  <FormDialog
    submit={onRenameFolder}
    validate={validateFolder}
    name="renamefolder"
    title="Rename Data Folder"
    preload={{ name: $store.selectedItems[0].name }}
    on:dismiss={() => { modal = undefined }}>
    <FieldText path="name" label="Name" required></FieldText>
  </FormDialog>
{/if}
