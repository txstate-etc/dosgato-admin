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
  import { isNull } from 'txstate-utils'
  import { DateTime } from 'luxon'

  let templateKey

  export const load: Load = async ({ params }) => {
    const template = await api.getTemplateInfo(params.id)
    if (!template) return { status: 404 }
    templateKey = template.key
    dataListStore.open({ id: params.id, name: template.name })
    return {}
  }

  const statusIcon = {
    published: triangleIcon,
    modified: circleIcon,
    unpublished: squareIcon
  }

  enum DataTreeNodeType {
    DATA,
    FOLDER,
    SITE
  }

  interface DataItem {
    id: string
    name: string
    type: DataTreeNodeType
    hasChildren: boolean
    modifiedAt?: DateTime
    published?: boolean
    publishedAt?: DateTime
    status?: string
    children: any [] | undefined // ???
    permissions?: {
      create?: boolean
      update?: boolean
      delete?: boolean
      undelete?: boolean
      publish?: boolean
      unpublish?: boolean
      move?: boolean
    }
  }

  type TypedDataItem = TypedTreeItem<DataItem>

  async function fetchChildren (item?: TypedDataItem) {
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
            children: undefined,
            modifiedAt,
            publishedAt,
            status: d.published ? (publishedAt >= modifiedAt ? 'published' : 'modified') : 'unpublished'
          }
        })
      }
      if (item.type === DataTreeNodeType.SITE) {
        const [sitefolders, sitedata] = await Promise.all([
          api.getDataFoldersBySiteId(item.id, templateKey),
          api.getDataBySiteId(item.id, templateKey)
        ])
        const ret: DataItem[] = []
        for (const f of sitefolders) {
          ret.push({
            id: f.id,
            name: f.name,
            type: DataTreeNodeType.FOLDER,
            hasChildren: !!f.data.length,
            children: undefined
          })
        }
        for (const d of sitedata.filter(data => isNull(data.folder))) {
          const modifiedAt = DateTime.fromISO(d.modifiedAt)
          const publishedAt = DateTime.fromISO(d.publishedAt)
          ret.push({
            ...d,
            type: DataTreeNodeType.DATA,
            hasChildren: false,
            children: undefined,
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
      const ret: DataItem[] = []
      for (const f of globalFolders) {
        ret.push({
          id: f.id,
          name: f.name,
          type: DataTreeNodeType.FOLDER,
          hasChildren: !!f.data.length,
          children: undefined
        })
      }
      for (const d of globalData.filter(d => isNull(d.folder))) {
        const modifiedAt = DateTime.fromISO(d.modifiedAt)
        const publishedAt = DateTime.fromISO(d.publishedAt)
        ret.push({
          ...d,
          type: DataTreeNodeType.DATA,
          hasChildren: false,
          children: undefined,
          modifiedAt,
          publishedAt,
          status: d.published ? (publishedAt >= modifiedAt ? 'published' : 'modified') : 'unpublished'
        })
      }
      for (const s of sites) {
        ret.push({
          id: s.id,
          name: s.name,
          type: DataTreeNodeType.SITE,
          hasChildren: !!s.data.length || !!s.datafolders.length,
          children: undefined
        })
      }
      return ret
    }
    return []
  }

  function zeroactions () {
    // TODO: permissions here? Need to get the manageGlobalData permission from somewhere
    return [
      { label: 'Add Data', icon: plusIcon, disabled: false, onClick: () => {} },
      { label: 'Add Data Folder', icon: folderPlusOutline, disabled: false, onClick: () => {} }
    ]
  }

  function singleActions(item: TypedDataItem) {
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
        { label: 'Rename', icon: pencilIcon, disabled: !item.permissions?.update, onClick: () => {} },
        { label: 'Add Data', icon: plusIcon, disabled: !item.permissions?.create, onClick: () => {} },
        { label: 'Delete', icon: deleteOutline, disabled: !item.permissions?.delete, onClick: () => {} },
        { label: 'Undelete', icon: deleteRestore, disabled: !item.permissions?.undelete, onClick: () => {} }
      ]
    } else {
      // TODO: permissions here? The item is a site, which doesn't have permissions related to data.
      return [
        { label: 'Add Data', icon: plusIcon, disabled: false, onClick: () => {} },
        { label: 'Add Data Folder', icon: folderPlusOutline, disabled: false, onClick: () => {} }
      ]
    }
  }

  function multipleActions (items: TypedDataItem[]) {
    // the only data/datafolder actions available for sites are Adding data and datafolders
    // and that doesn't make sense in the context of multiple selections
    if (items.some((item) => item.type === DataTreeNodeType.SITE)) return []
    if (items.some((item) => item.type === DataTreeNodeType.FOLDER)) {
      // at least one folder is selected
      return [
        { label: 'Delete', icon: deleteOutline, disabled: false, onClick: () => {} },
        { label: 'Undelete', icon: deleteRestore, disabled: false, onClick: () => {} }
      ]
    } else {
      return [
        { label: 'Move', icon: cursorMove, disabled: false, onClick: () => {} },
        { label: 'Publish', icon: publishIcon, disabled: false, onClick: () => {} },
        { label: 'Unpublish', icon: publishOffIcon, disabled: false, onClick: () => {} },
        { label: 'Delete', icon: deleteOutline, disabled: false, onClick: () => {} },
        { label: 'Undelete', icon: deleteRestore, disabled: false, onClick: () => {} }
      ]
    }
  }

  function getActions (selectedItems: TypedDataItem[]) {
    if (selectedItems.length === 0) return zeroactions()
    if (selectedItems.length === 1) return singleActions(selectedItems[0])
    if (selectedItems.length > 1) return multipleActions(selectedItems)
    return []
  }

  function getPathIcon (type: DataTreeNodeType) {
    if (type === DataTreeNodeType.DATA) return databaseOutline
    else if (type === DataTreeNodeType.FOLDER) return folderOutline
    else return applicationOutline
  }

  const store: TreeStore<DataItem> = new TreeStore(fetchChildren)
</script>
<script lang="ts">
  import { api, ActionPanel, Tree, TreeStore, type TypedTreeItem, dataListStore } from '$lib'
  import './index.css'
</script>

<ActionPanel actions={getActions($store.selectedItems)}>
  <Tree {store} headers={[
    { label: 'Path', id: 'name', defaultWidth: 'calc(60% - 16.15em)', icon: item => getPathIcon(item.type), get: 'name' },
    { label: 'Status', id: 'status', defaultWidth: '5em', icon: item => item.status ? statusIcon[item.status] : undefined, class: item => item.status || '' },
    { label: 'Modified', id: 'modified', defaultWidth: '10em', render: item => `<span>${item.modifiedAt ? item.modifiedAt.toFormat('LLL d yyyy h:mma').replace(/(AM|PM)$/, v => v.toLocaleLowerCase()) : ''}</span>` },
    { label: 'By', id: 'modifiedBy', defaultWidth: '3em', get: 'modifiedBy.id' }
  ]}></Tree>
</ActionPanel>
