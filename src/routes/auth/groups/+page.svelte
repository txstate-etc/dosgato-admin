<script lang="ts">
  import accountMultiplePlusOutline from '@iconify-icons/mdi/account-multiple-plus-outline'
  import accountMultipleRemoveOutline from '@iconify-icons/mdi/account-multiple-remove-outline'
  import usersThreeLight from '@iconify-icons/ph/users-three-light'
  import { goto } from '$app/navigation'
  import { base } from '$app/paths'
  import { Dialog, FieldText, FormDialog } from '@dosgato/dialog'
  import { ActionPanel, type ActionPanelAction, api, Tree, TreeStore, type TypedTreeItem, type GroupListGroup, messageForDialog } from '$lib'

  type TypedGroupItem = TypedTreeItem<GroupListGroup>

  async function fetchChildren (group?: TypedGroupItem) {
    const children = group ? await api.getSubgroups(group.id) : await api.getRootGroups()
    return children.map(g => ({ ...g, hasChildren: !!g.subgroups.length }))
  }

  function noneselectedactions () {
    const actions: ActionPanelAction[] = [
      { label: 'Add Group', icon: accountMultiplePlusOutline, disabled: false, onClick: () => { modal = 'addgroup' } }
    ]
    return actions
  }

  function singleactions (user: TypedGroupItem) {
    const actions: ActionPanelAction[] = [
      { label: 'Add Group', icon: accountMultiplePlusOutline, disabled: false, onClick: () => { modal = 'addgroup' } },
      { label: 'Delete', icon: accountMultipleRemoveOutline, disabled: false, onClick: () => { modal = 'deletegroup' } }
    ]
    return actions
  }

  const store: TreeStore<GroupListGroup> = new TreeStore(fetchChildren)

  let modal: 'addgroup'|'deletegroup'|undefined

  async function onAddGroup (state) {
    const parentId: string|undefined = $store.selectedItems.length ? $store.selectedItems[0].id : undefined
    const resp = await api.addGroup(state.name, parentId)
    if (resp.success) {
      store.refresh()
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
    if (resp.success) store.refresh()
    modal = undefined
  }

</script>

<ActionPanel actionsTitle={$store.selected.size === 1 ? $store.selectedItems[0].name : 'Groups'} actions={$store.selected.size === 1 ? singleactions($store.selectedItems[0]) : noneselectedactions()}>
  <Tree singleSelect {store} on:choose={({ detail }) => goto(base + '/auth/groups/' + detail.id)} headers ={[
    { id: 'name', label: 'Name', get: 'name', defaultWidth: '35%', icon: usersThreeLight },
    { id: 'members', label: 'Members', render: item => String(item.users.length), defaultWidth: '15%' },
    { id: 'roles', label: 'Roles', render: item => (item.roles.map(r => r.name)).join(', '), defaultWidth: '40%' }
  ]}/>
</ActionPanel>
{#if modal === 'addgroup'}
  <FormDialog
    submit={onAddGroup}
    validate={validateAddGroup}
    title='Add Group'
    name='addgroup'
    on:escape={() => { modal = undefined }}>
    <FieldText path='name' label='Group Name' required></FieldText>
  </FormDialog>
{:else if modal === 'deletegroup' }
  <Dialog
    title='Delete Group'
    continueText='Delete'
    cancelText='Cancel'
    on:escape={() => { modal = undefined }}
    on:continue={onDeleteGroup}>
    Delete {$store.selectedItems[0].name} {$store.selectedItems[0].subgroups.length ? 'and its subgroups?' : '?'}
  </Dialog>
{/if}
