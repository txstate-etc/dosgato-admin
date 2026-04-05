<script lang="ts">
  import { Dialog, FieldText, FormDialog, Tree, TreeStore, type TypedTreeItem } from '@dosgato/dialog'
  import accountMultiplePlusOutline from '@iconify-icons/mdi/account-multiple-plus-outline'
  import accountMultipleRemoveOutline from '@iconify-icons/mdi/account-multiple-remove-outline'
  import usersThree from '@iconify-icons/ph/users-three'
  import { setContext, tick } from 'svelte'
  import { goto } from '$app/navigation'
  import { base } from '$app/paths'
  import { ActionPanel, type ActionPanelAction, api, type GroupListGroup, messageForDialog, uiLog, actionPanelStore } from '$lib'

  const actionPanelTarget: { target: string | undefined } = { target: undefined }
  setContext('ActionPanelTarget', { getTarget: () => actionPanelTarget.target })

  type Modals = 'addgroup' | 'deletegroup'
  let modal: Modals | undefined

  type TypedGroupItem = TypedTreeItem<GroupListGroup>

  async function fetchChildren (group?: TypedGroupItem) {
    const children = group ? await api.getSubgroups(group.id) : await api.getRootGroups()
    return children.map(g => ({ ...g, hasChildren: !!g.subgroups.length }))
  }

  function noneselectedactions () {
    const actions: ActionPanelAction[] = [
      { label: 'Add Group', icon: accountMultiplePlusOutline, disabled: false, onClick: () => openModal('addgroup') }
    ]
    return actions
  }

  function singleactions (user: TypedGroupItem) {
    const actions: ActionPanelAction[] = [
      { label: 'Add Group', icon: accountMultiplePlusOutline, disabled: false, onClick: () => openModal('addgroup') },
      { label: 'Delete', icon: accountMultipleRemoveOutline, disabled: false, onClick: () => openModal('deletegroup') }
    ]
    return actions
  }

  const store = new TreeStore<GroupListGroup>(fetchChildren)


  async function onAddGroup (state) {
    const parentId: string | undefined = $store.selectedItems.length ? $store.selectedItems[0].id : undefined
    const resp = await api.addGroup(state.name, parentId)
    uiLog.log({ eventType: 'GroupsPage-modal-' + modal, action: resp.success ? 'Success' : 'Failed', target: $store.selectedItems[0]?.name, additionalProperties: { name: resp.group?.name ?? state.name } })
    if (resp.success) {
      void store.refresh()
      modal = undefined
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
    uiLog.log({ eventType: 'GroupsPage-modal-' + modal, action: resp.success ? 'Success' : 'Failed', target: $store.selectedItems[0]?.name })
    if (resp.success) void store.refresh()
    modal = undefined
  }

  function onModalEscape () {
    uiLog.log({ eventType: 'GroupsPage-modal-' + modal, action: 'Cancel', target: actionPanelTarget.target })
    modal = undefined
  }

  function openModal (m: Modals) {
    uiLog.log({ eventType: 'GroupsPage-modal-' + m, action: 'Open', target: actionPanelTarget.target })
    modal = m
  }

  $: actionPanelTarget.target = uiLog.targetFromTreeStore($store, 'name')

  function handleResponsiveHeaders (treeWidth: number) {
    if (treeWidth > 500) {
      return ['name', 'members', 'roles']
    } else {
      return ['name', 'roles']
    }
  }
</script>

<ActionPanel actionsTitle={$store.selected.size === 1 ? $store.selectedItems[0].name : 'Groups'} actions={$store.selected.size === 1 ? singleactions($store.selectedItems[0]) : noneselectedactions()}>
  <Tree singleSelect {store} on:choose={async ({ detail }) => await goto(base + '/auth/groups/' + detail.id)} headers ={[
    { id: 'name', label: 'Name', get: 'name', grow: 2, icon: { icon: usersThree } },
    { id: 'members', label: 'Members', render: item => String(item.users.length), fixed: '7em' },
    { id: 'roles', label: 'Roles', render: item => (item.roles.map(r => r.name)).join(', '), grow: 3 }
  ]} enableResize responsiveHeaders={handleResponsiveHeaders}/>
</ActionPanel>
{#if modal === 'addgroup'}
  <FormDialog
    submit={onAddGroup}
    validate={validateAddGroup}
    title='Add Group'
    name='addgroup'
    on:escape={onModalEscape}>
    <FieldText path='name' label='Group Name' required></FieldText>
  </FormDialog>
{:else if modal === 'deletegroup' }
  <Dialog
    title='Delete Group'
    continueText='Delete'
    cancelText='Cancel'
    on:escape={onModalEscape}
    on:continue={onDeleteGroup}>
    Delete {$store.selectedItems[0].name} {$store.selectedItems[0].subgroups.length ? 'and its subgroups?' : '?'}
  </Dialog>
{/if}
