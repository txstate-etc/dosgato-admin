<script lang="ts">
  import SortableTable from '$lib/components/table/SortableTable.svelte'
  import checkIcon from '@iconify-icons/ph/check-bold'
  import minusIcon from '@iconify-icons/ph/minus-bold'
  import pencilIcon from '@iconify-icons/mdi/pencil'
  import deleteIcon from '@iconify-icons/ph/trash'
  import type { AssetRule } from '$lib'
  import { createEventDispatcher } from 'svelte'
  import { resolve } from '$app/paths'

  const dispatch = createEventDispatcher()

  export let rules: AssetRule[]

</script>

{#if rules.length}
  <SortableTable cardedOnMobile mobileHeader={item => item.site ? item.site.name : 'All Sites'} items={rules}
    headers={[
      { id: 'site', label: 'Site', render: item => item.site ? `<a href="${resolve('/sites/[id]', { id: item.site.id })}">${item.site.name}</a>` : 'All Sites' },
      { id: 'pagetreetype', label: 'Pagetree Type', render: item => item.pagetreeType ? item.pagetreeType : 'All types' },
      { id: 'path', label: 'Path', get: 'path' },
      { id: 'mode', label: 'Mode', get: 'mode' },
      { id: 'create', label: 'Create', icon: item => item.grants.create ? { icon: checkIcon, hiddenLabel: 'Create Permitted' } : { icon: minusIcon, hiddenLabel: 'Create not permitted' } },
      { id: 'update', label: 'Update', icon: item => item.grants.update ? { icon: checkIcon, hiddenLabel: 'Update Permitted' } : { icon: minusIcon, hiddenLabel: 'Update not permitted' } },
      { id: 'move', label: 'Move', icon: item => item.grants.move ? { icon: checkIcon, hiddenLabel: 'Move Permitted' } : { icon: minusIcon, hiddenLabel: 'Move not permitted' } },
      { id: 'delete', label: 'Delete', icon: item => item.grants.delete ? { icon: checkIcon, hiddenLabel: 'Delete Permitted' } : { icon: minusIcon, hiddenLabel: 'Delete not permitted' } },
      { id: 'undelete', label: 'Recover', icon: item => item.grants.undelete ? { icon: checkIcon, hiddenLabel: 'Restore Permitted' } : { icon: minusIcon, hiddenLabel: 'Restore not permitted' } },
      { id: 'editaction', label: 'Edit', actions: [{ icon: pencilIcon, label: 'Edit', onClick: item => { dispatch('editrule', { id: item.id, type: 'asset', rule: item }) } }] },
      { id: 'deleteaction', label: 'Delete', actions: [{ icon: deleteIcon, label: 'Delete', onClick: item => { dispatch('deleterule', { id: item.id, type: 'asset' }) } }] }
    ]} />
{:else}
  <span>This role has no asset rules.</span>
{/if}
