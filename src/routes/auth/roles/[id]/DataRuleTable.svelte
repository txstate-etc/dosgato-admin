<script lang="ts">
  import SortableTable from '$lib/components/table/SortableTable.svelte'
  import checkIcon from '@iconify-icons/ph/check-bold'
  import minusIcon from '@iconify-icons/ph/minus-bold'
  import pencilIcon from '@iconify-icons/mdi/pencil'
  import deleteIcon from '@iconify-icons/ph/trash'
  import type { DataRule } from '$lib'
  import { createEventDispatcher } from 'svelte'

  const dispatch = createEventDispatcher()

  export let rules: DataRule[]

</script>

{#if rules.length}
  <SortableTable cardedOnMobile mobileHeader={(item) => { return item.site ? item.site.name : 'All Sites' }} items={rules}
    headers={[
      { id: 'site', label: 'Site', render: (item) => { return item.site ? item.site.name : 'All Sites' } },
      { id: 'path', label: 'Path', get: 'path' },
      { id: 'template', label: 'Template', render: (item) => { return item.template ? item.template.name : 'All Templates' } },
      { id: 'create', label: 'Create', icon: (item) => { return item.grants.create ? { icon: checkIcon, hiddenLabel: 'Create Permitted' } : { icon: minusIcon, hiddenLabel: 'Create not permitted' } } },
      { id: 'update', label: 'Update', icon: (item) => { return item.grants.update ? { icon: checkIcon, hiddenLabel: 'Update Permitted' } : { icon: minusIcon, hiddenLabel: 'Update not permitted' } } },
      { id: 'move', label: 'Move', icon: (item) => { return item.grants.move ? { icon: checkIcon, hiddenLabel: 'Move Permitted' } : { icon: minusIcon, hiddenLabel: 'Move not permitted' } } },
      { id: 'publish', label: 'Publish & Unpublish', icon: (item) => { return item.grants.publish ? { icon: checkIcon, hiddenLabel: 'Publish Permitted' } : { icon: minusIcon, hiddenLabel: 'Publish not permitted' } } },
      { id: 'delete', label: 'Delete', icon: (item) => { return item.grants.delete ? { icon: checkIcon, hiddenLabel: 'Delete Permitted' } : { icon: minusIcon, hiddenLabel: 'Delete not permitted' } } },
      { id: 'undelete', label: 'Restore', icon: (item) => { return item.grants.undelete ? { icon: checkIcon, hiddenLabel: 'Restore Permitted' } : { icon: minusIcon, hiddenLabel: 'Restore not permitted' } } },
      { id: 'editaction', label: 'Edit', actions: [{ icon: pencilIcon, label: 'Edit', onClick: (item) => { dispatch('editrule', { id: item.id, type: 'data', rule: item }) } }] },
      { id: 'deleteaction', label: 'Delete', actions: [{ icon: deleteIcon, label: 'Delete', onClick: (item) => { dispatch('deleterule', { id: item.id, type: 'data' }) } }] }
    ]} />
{:else}
  <span>This role has no data rules.</span>
{/if}