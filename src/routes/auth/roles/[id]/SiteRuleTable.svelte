<script lang="ts">
  import SortableTable from '$lib/components/table/SortableTable.svelte'
  import checkIcon from '@iconify-icons/ph/check-bold'
  import minusIcon from '@iconify-icons/ph/minus-bold'
  import pencilIcon from '@iconify-icons/mdi/pencil'
  import deleteIcon from '@iconify-icons/ph/trash'
  import type { SiteRule } from '$lib'
  import { createEventDispatcher } from 'svelte'

  const dispatch = createEventDispatcher()

  export let rules: SiteRule[]

</script>

{#if rules.length}
  <SortableTable cardedOnMobile mobileHeader={(item) => { return item.site ? item.site.name : 'All Sites' }} items={rules}
    headers={[
      { id: 'site', label: 'Site', render: (item) => { return item.site ? item.site.name : 'All Sites' } },
      { id: 'launch', label: 'Launch', icon: (item) => { return item.grants.launch ? { icon: checkIcon, hiddenLabel: 'May launch site' } : { icon: minusIcon, hiddenLabel: 'May not launch site' } } },
      { id: 'rename', label: 'Rename', icon: (item) => { return item.grants.rename ? { icon: checkIcon, hiddenLabel: 'May rename site' } : { icon: minusIcon, hiddenLabel: 'May not rename site' } } },
      { id: 'governance', label: 'Governance', icon: (item) => { return item.grants.governance ? { icon: checkIcon, hiddenLabel: 'May update site management' } : { icon: minusIcon, hiddenLabel: 'May not update site management' } } },
      { id: 'managestate', label: 'Manage State', icon: (item) => { return item.grants.manageState ? { icon: checkIcon, hiddenLabel: 'May manage pagetree state' } : { icon: minusIcon, hiddenLabel: 'May not manage pagetree state' } } },
      { id: 'delete', label: 'Delete & Restore', icon: (item) => { return item.grants.delete ? { icon: checkIcon, hiddenLabel: 'May delete or restore site' } : { icon: minusIcon, hiddenLabel: 'May not delete or restore site' } } },
      { id: 'editaction', label: 'Edit', actions: [{ icon: pencilIcon, label: 'Edit', onClick: (item) => { dispatch('editrule', { id: item.id, type: 'site', rule: item }) } }] },
      { id: 'deleteaction', label: 'Delete', actions: [{ icon: deleteIcon, label: 'Delete', onClick: (item) => { dispatch('deleterule', { id: item.id, type: 'site' }) } }] }
    ]} />
{:else}
  <div>This role has no site rules.</div>
{/if}

