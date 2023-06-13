<script lang="ts">
  import accountMultiplePlusOutline from '@iconify-icons/mdi/account-multiple-plus-outline'
  import accountMultipleRemoveOutline from '@iconify-icons/mdi/account-multiple-remove-outline'
  import usersThree from '@iconify-icons/ph/users-three'
  import { goto } from '$app/navigation'
  import { base } from '$app/paths'
  import { Dialog, FieldText, FormDialog, Tree, TreeStore, type TypedTreeItem } from '@dosgato/dialog'
  import { ActionPanel, type ActionPanelAction, api, type GroupListGroup, messageForDialog, ModalContext, uiLog } from '$lib'
  import { setContext } from 'svelte'

  type TypedGroupItem = TypedTreeItem<GroupListGroup>

  async function fetchChildren (group?: TypedGroupItem) {
    const children = group ? await api.getSubgroups(group.id) : await api.getRootGroups()
    return children.map(g => ({ ...g, hasChildren: !!g.subgroups.length }))
  }

  function noneselectedactions () {
    const actions: ActionPanelAction[] = [
      { label: 'Add Group', icon: accountMultiplePlusOutline, disabled: false, onClick: () => { modalContext.modal = 'addgroup' } }
    ]
    return actions
  }

  function singleactions (user: TypedGroupItem) {
    const actions: ActionPanelAction[] = [
      { label: 'Add Group', icon: accountMultiplePlusOutline, disabled: false, onClick: () => { modalContext.modal = 'addgroup' } },
      { label: 'Delete', icon: accountMultipleRemoveOutline, disabled: false, onClick: () => { modalContext.modal = 'deletegroup' } }
    ]
    return actions
  }

  const store: TreeStore<GroupListGroup> = new TreeStore(fetchChildren)

  // TODO: Need to get with Rachel on what we want defined for target in this screen's context.
  const actionPanelTarget: { target: string | undefined } = { target: 'AuthGroupsPage' }
  setContext('ActionPanelTarget', { getTarget: () => uiLog.targetFromTreeStore($store, 'id') })

  type Modals = 'addgroup' | 'deletegroup'
  const modalContext = new ModalContext<Modals>(() => actionPanelTarget.target)

  async function onAddGroup (state) {
    const parentId: string|undefined = $store.selectedItems.length ? $store.selectedItems[0].id : undefined
    const resp = await api.addGroup(state.name, parentId)
    modalContext.logModalResponse(resp, resp.group?.name, parentId ? { parentId } : undefined)
    if (resp.success) {
      store.refresh()
      modalContext.modal = undefined
    }
    return {
      success: resp.success,
      messages: messageForDialog(resp.messages, ''),
      data: resp.success
        ? {
            name: resp.group!.name
          }
        : undefined
    }
  }

  async function validateAddGroup (state) {
    const resp = await api.addGroup(state.name, undefined, true)
    return resp.messages.map(m => ({ path: m.arg, type: m.type, message: m.message }))
  }

  async function onDeleteGroup () {
    const resp = await api.deleteGroup($store.selectedItems[0].id)
    modalContext.logModalResponse(resp, modalContext.target())
    if (resp.success) store.refresh()
    modalContext.modal = undefined
  }
</script>

<ActionPanel actionsTitle={$store.selected.size === 1 ? $store.selectedItems[0].name : 'Groups'} actions={$store.selected.size === 1 ? singleactions($store.selectedItems[0]) : noneselectedactions()}>
  <Tree singleSelect {store} on:choose={({ detail }) => goto(base + '/auth/groups/' + detail.id)} headers ={[
    { id: 'name', label: 'Name', get: 'name', fixed: '19em', icon: { icon: usersThree } },
    { id: 'members', label: 'Members', render: item => String(item.users.length), fixed: '7em' },
    { id: 'roles', label: 'Roles', render: item => (item.roles.map(r => r.name)).join(', '), grow: 5 }
  ]} searchable='name'/>
</ActionPanel>
{#if modalContext.modal === 'addgroup'}
  <FormDialog
    submit={onAddGroup}
    validate={validateAddGroup}
    title='Add Group'
    name='addgroup'
    on:escape={modalContext.onModalEscape}>
    <FieldText path='name' label='Group Name' required></FieldText>
  </FormDialog>
{:else if modalContext.modal === 'deletegroup' }
  <Dialog
    title='Delete Group'
    continueText='Delete'
    cancelText='Cancel'
    on:escape={modalContext.onModalEscape}
    on:continue={onDeleteGroup}>
    Delete {$store.selectedItems[0].name} {$store.selectedItems[0].subgroups.length ? 'and its subgroups?' : '?'}
  </Dialog>
{/if}
