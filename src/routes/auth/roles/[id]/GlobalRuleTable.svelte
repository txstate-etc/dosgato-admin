<script lang="ts">
  import SortableTable from '$lib/components/table/SortableTable.svelte'
  import checkIcon from '@iconify-icons/ph/check-bold'
  import minusIcon from '@iconify-icons/ph/minus-bold'
  import pencilIcon from '@iconify-icons/mdi/pencil'
  import deleteIcon from '@iconify-icons/ph/trash'
  import type { GlobalRule } from '$lib'
  import { createEventDispatcher } from 'svelte'

  const dispatch = createEventDispatcher()

  export let rules: GlobalRule[]

</script>

{#if rules.length}
  <SortableTable cardedOnMobile mobileHeader={(item) => 'Global Rule'} items={rules}
    headers={[
      { id: 'manageaccess', label: 'Manage Access', icon: (item) => { return item.grants.manageAccess ? { icon: checkIcon, hiddenLabel: 'May manage access' } : { icon: minusIcon, hiddenLabel: 'May not manage access' } } },
      { id: 'manageparentroles', label: 'Manage Parent Roles', icon: (item) => { return item.grants.manageParentRoles ? { icon: checkIcon, hiddenLabel: 'May manage parent roles' } : { icon: minusIcon, hiddenLabel: 'May not manage parent roles' } } },
      { id: 'createsites', label: 'Create Sites', icon: (item) => { return item.grants.createSites ? { icon: checkIcon, hiddenLabel: 'May create sites' } : { icon: minusIcon, hiddenLabel: 'May not create sites' } } },
      { id: 'manageglobaldata', label: 'Manage Global Data', icon: (item) => { return item.grants.manageGlobalData ? { icon: checkIcon, hiddenLabel: 'May manage global data' } : { icon: minusIcon, hiddenLabel: 'May not manage global data' } } },
      { id: 'managetemplates', label: 'Manage Templates', icon: (item) => { return item.grants.manageTemplates ? { icon: checkIcon, hiddenLabel: 'May manage templates' } : { icon: minusIcon, hiddenLabel: 'May not manage templates' } } },
      { id: 'editaction', label: 'Edit', actions: [{ icon: pencilIcon, label: 'Edit', onClick: (item) => { dispatch('editrule', { id: item.id, type: 'global', rule: item }) } }] },
      { id: 'deleteaction', label: 'Delete', actions: [{ icon: deleteIcon, label: 'Delete', onClick: (item) => { dispatch('deleterule', { id: item.id, type: 'global' }) } }] }
    ]} />
{:else}
  <span>This role has no global rules.</span>
{/if}
