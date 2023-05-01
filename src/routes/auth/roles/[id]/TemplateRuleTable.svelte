<script lang="ts">
  import SortableTable from '$lib/components/table/SortableTable.svelte'
  import checkIcon from '@iconify-icons/ph/check-bold'
  import minusIcon from '@iconify-icons/ph/minus-bold'
  import pencilIcon from '@iconify-icons/mdi/pencil'
  import deleteIcon from '@iconify-icons/ph/trash'
  import type { TemplateRule } from '$lib'
  import { createEventDispatcher } from 'svelte'

  const dispatch = createEventDispatcher()

  export let rules: TemplateRule[]

</script>

{#if rules.length}
  <SortableTable cardedOnMobile mobileHeader={(item) => item.template ? item.template.name : 'All Templates'} items={rules}
    headers={[
      { id: 'template', label: 'Template', render: (item) => { return item.template ? item.template.name : 'All Templates' } },
      { id: 'use', label: 'Use', icon: (item) => { return item.grants.use ? { icon: checkIcon, hiddenLabel: 'May use template' } : { icon: minusIcon, hiddenLabel: 'May not use template' } } },
      { id: 'editaction', label: 'Edit', actions: [{ icon: pencilIcon, label: 'Edit', onClick: (item) => { dispatch('editrule', { id: item.id, type: 'template', rule: item }) } }] },
      { id: 'deleteaction', label: 'Delete', actions: [{ icon: deleteIcon, label: 'Delete', onClick: (item) => { dispatch('deleterule', { id: item.id, type: 'template' }) } }] }
    ]} />
{:else}
  <div>This role has no template rules.</div>
{/if}