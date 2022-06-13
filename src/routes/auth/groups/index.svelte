<script lang="ts" context="module">
  import accountMultiplePlusOutline from '@iconify-icons/mdi/account-multiple-plus-outline'
  import accountMultipleRemoveOutline from '@iconify-icons/mdi/account-multiple-remove-outline'
  import { ActionPanel, type ActionPanelAction, api, Tree, TreeStore, type TypedTreeItem, type GroupListGroup } from '$lib'

  type TypedGroupItem = TypedTreeItem<GroupListGroup>

  async function fetchChildren (group?: TypedGroupItem) {
    const children = group ? await api.getSubgroups(group.id) : await api.getRootGroups()
    return children.map(g => ({ ...g, hasChildren: !!g.subgroups.length }))
  }

  const store: TreeStore<GroupListGroup> = new TreeStore(fetchChildren)
</script>

<script lang="ts">
  import { goto } from '$app/navigation'
  import { base } from '$app/paths'
  import Dialog from '$lib/components/Dialog.svelte'
  import FormDialog from '$lib/components/FormDialog.svelte'
  import { FieldText } from '@dosgato/dialog'
import { Field } from '@txstate-mws/svelte-forms'

  let modal: 'addgroup'|'deletegroup'|undefined

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

  async function onAddGroup (state) {
    const parentId: string|undefined = $store.selectedItems.length ? $store.selectedItems[0].id : undefined
    const resp = await api.addGroup(state.name, parentId)
    if (resp.success) {
      store.refresh()
      modal = undefined
    }
    // TODO: What data should be returned?
    return { success: resp.success, messages: resp.messages, data: {} }
  }

</script>

<ActionPanel actions={$store.selected.size === 1 ? singleactions($store.selectedItems[0]) : noneselectedactions()}>
  <Tree singleSelect {store} on:choose={({ detail }) => goto(base + '/auth/groups/' + detail.id)} headers ={[
    { id: 'name', label: 'Name', get: 'name', defaultWidth: '30%' },
    { id: 'managers', label: 'Managers', render: item => (item.managers.map(m => m.name)).join(', '), defaultWidth: '30%' },
    { id: 'roles', label: 'Roles', render: item => (item.roles.map(r => r.name)).join(', '), defaultWidth: '30%' }
  ]}/>
</ActionPanel>
{#if modal === 'addgroup'}
  <FormDialog
    submit={onAddGroup}
    title='Add Group'
    name='addgroup'
    on:dismiss={() => { modal = undefined }}>
    <FieldText path='name' label='Group Name' required></FieldText>
  </FormDialog>
{:else if modal === 'deletegroup' }
delete group
{/if}
