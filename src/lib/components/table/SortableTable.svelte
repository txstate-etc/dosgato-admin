<script lang="ts">
  import type { SortableTableHeader } from './sortabletable'
  import SortableTableCell from './SortableTableCell.svelte'
  import { ScreenReaderOnly } from '@txstate-mws/svelte-components'
  import sortAscendingIcon from '@iconify-icons/ph/sort-ascending'
  import sortDescendingIcon from '@iconify-icons/ph/sort-descending'
  import { sortby } from 'txstate-utils'
  import { Icon } from '@dosgato/dialog'
  export let items: any[]
  export let headers: SortableTableHeader[]

  $: sortedItems = items
  let sortBy: { column: string, desc: boolean} | undefined = undefined

  function sortItems (header: SortableTableHeader) {
    const sort = header.sortFunction ?? header.id
    if (sortBy?.column === header.id) {
      sortedItems = sortby(sortedItems, sort, !sortBy.desc)
      sortBy = { column: header.id, desc: !sortBy.desc }
    } else {
      sortedItems = sortby(sortedItems, sort)
      sortBy = { column: header.id, desc: false }
    }
  }
</script>

<table>
  <thead>
    {#each headers as header (header.id) }
      {#if header.hideHeader}
        <th><ScreenReaderOnly>{header.label}</ScreenReaderOnly></th>
      {:else}
        <th class:sortable={header.sortable}>
          <span>{header.label}</span>
          {#if header.sortable}
            <button class="sort-button" type="button" on:click={() => sortItems(header)}>
              {#if sortBy && sortBy.column === header.id && !sortBy.desc}
                <Icon icon={sortDescendingIcon} width="1.5em" hiddenLabel="Sort descending"/>
              {:else}
                <Icon icon={sortAscendingIcon} width="1.5em" hiddenLabel="Sort ascending"/>
              {/if}
            </button>
          {/if}
        </th>
      {/if}
  {/each}
  </thead>
  <tbody>
    {#each sortedItems as item (item.id)}
    <tr>
      {#each headers as header (header.id)}
        <td>
          <SortableTableCell {item} {header}/>
        </td>
      {/each}
    </tr>
  {/each}
  </tbody>
</table>

<style>
  table {
    width: 100%;
    border-collapse: collapse;
  }
  thead {
    border-bottom: 2px solid #A5A5A5;
  }
  thead th {
    text-align: left
  }
  thead th.sortable button, thead th.sortable span {
    vertical-align: middle;
  }
  .sort-button {
    border: 0;
    background-color: transparent;
  }
  tbody tr { border-bottom: 1px dashed #707070 }
  tbody tr td { padding: 0.5em 0; }
</style>