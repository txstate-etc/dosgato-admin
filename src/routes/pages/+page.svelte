<script lang="ts">
  import applicationOutline from '@iconify-icons/mdi/application-outline'
  import circleIcon from '@iconify-icons/mdi/circle'
  import pencilIcon from '@iconify-icons/mdi/pencil'
  import plusIcon from '@iconify-icons/mdi/plus'
  import publishIcon from '@iconify-icons/mdi/publish'
  import squareIcon from '@iconify-icons/mdi/square'
  import triangleIcon from '@iconify-icons/mdi/triangle'
  import type { PopupMenuItem } from '@txstate-mws/svelte-components'
  import { goto } from '$app/navigation'
  import { base } from '$app/paths'
  import { api, ActionPanel, Tree, FormDialog, messageForDialog } from '$lib'
  import CreateWithPageDialog from '$lib/components/dialogs/CreateWithPageDialog.svelte'
  import { store, type TypedPageItem } from './+page'
  import './index.css'
  import { FieldText } from '@dosgato/dialog'

  let modal: 'addpage' | 'renamepage' | undefined = undefined

  const statusIcon = {
    published: triangleIcon,
    modified: circleIcon,
    unpublished: squareIcon
  }

  function singlepageactions (page: TypedPageItem) {
    return [
      { label: 'Add Page', icon: plusIcon, disabled: !page.permissions.create, onClick: () => { onClickAddPage() } },
      { label: 'Edit', icon: pencilIcon, disabled: !page.permissions.update, onClick: () => goto(base + '/pages/' + page.id) },
      { label: 'Rename', icon: pencilIcon, disabled: !page.permissions.move || !page.parent, onClick: () => { modal = 'renamepage' } },
      { label: 'Publish', icon: publishIcon, disabled: !page.permissions.publish, onClick: () => {} }
    ]
  }
  function multipageactions (pages: TypedPageItem[]) {
    if (!pages?.length) return []
    return [
      { label: 'Move', disabled: pages.some(p => !p.permissions.move), onClick: () => {} },
      { label: 'Publish', disabled: pages.some(p => !p.permissions.publish), onClick: () => {} }
    ]
  }

  let availableTemplates: PopupMenuItem[] = []

  async function onClickAddPage () {
    availableTemplates = await api.getTemplatesByPage($store.selectedItems[0].id)
    modal = 'addpage'
  }

  async function validateAddPage (state) {
    const resp = await api.createPage(state.name, state.templateKey, state.data, $store.selectedItems[0].id, false, true)
    return resp.messages.map(m => ({ ...m, path: (m.arg === 'name' || m.arg === 'templateKey') ? m.arg : `data.${m.arg}` }))
  }

  async function onAddPage (state) {
    const resp = await api.createPage(state.name, state.templateKey, state.data, $store.selectedItems[0].id, false)
    return {
      success: resp.success,
      messages: resp.messages.map(m => ({ ...m, path: m.arg })),
      data: state
    }
  }

  function onAddPageComplete () {
    availableTemplates = []
    store.openAndRefresh($store.selectedItems[0])
    modal = undefined
  }

  async function validateRename (state) {
    const resp = await api.renamePage($store.selectedItems[0].id, state.name, true)
    return messageForDialog(resp.messages, '')
  }

  async function onRenamePage (state) {
    const resp = await api.renamePage($store.selectedItems[0].id, state.name)
    return {
      success: resp.success,
      messages: messageForDialog(resp.messages, ''),
      data: resp.success ? resp.page!.name : state
    }
  }

  function onRenamePageComplete () {
    store.refresh()
    modal = undefined
  }
</script>

<ActionPanel actions={$store.selected.size === 1 ? singlepageactions($store.selectedItems[0]) : multipageactions($store.selectedItems)}>
  <Tree {store} on:choose={({ detail }) => goto(base + '/pages/' + detail.id)}
    headers={[
      { label: 'Path', id: 'name', defaultWidth: 'calc(60% - 16.15em)', icon: item => applicationOutline, get: 'name' },
      { label: 'Title', id: 'title', defaultWidth: 'calc(40% - 10.75em)', get: 'title' },
      { label: 'Template', id: 'template', defaultWidth: '8.5em', get: 'template.name' },
      { label: 'Status', id: 'status', defaultWidth: '4em', icon: item => statusIcon[item.status], class: item => item.status },
      { label: 'Modified', id: 'modified', defaultWidth: '10em', render: item => `<span>${item.modifiedAt.toFormat('LLL d yyyy h:mma').replace(/(AM|PM)$/, v => v.toLocaleLowerCase())}</span>` },
      { label: 'By', id: 'modifiedBy', defaultWidth: '3em', get: 'modifiedBy.id' }
    ]}
  />
</ActionPanel>
{#if modal === 'addpage'}
  <CreateWithPageDialog
    submit={onAddPage}
    validate={validateAddPage}
    title="Add New Page"
    templateChoices={availableTemplates}
    on:escape={() => { modal = undefined }}
    on:saved={onAddPageComplete}/>
{:else if modal === 'renamepage'}
  <FormDialog
    submit={onRenamePage}
    validate={validateRename}
    name='renamepage'
    title='Rename Page'
    preload={{ name: $store.selectedItems[0].name }}
    on:escape={() => { modal = undefined }}
    on:saved={onRenamePageComplete}>
    <FieldText path='name' label='Name' required />
  </FormDialog>
{/if}
