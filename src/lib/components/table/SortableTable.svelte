<script lang="ts">
  import type { SortableTableHeader } from './sortabletable'
  import SortableTableCell from './SortableTableCell.svelte'
  import { eq, ScreenReaderOnly } from '@txstate-mws/svelte-components'
  import { get, isNotNull, sortby } from 'txstate-utils'
  import Dropdown from './Dropdown.svelte'
  import SortableTableAccordion from './SortableTableAccordion.svelte'
  export let items: any[]
  export let headers: (SortableTableHeader | undefined)[]
  // Filter out undefined headers, make TypeScript narrow the result to SortableTableHeader[]
  $: filteredHeaders = headers.filter((h): h is SortableTableHeader => !!h)
  export let cardedOnMobile = false
  export let mobileHeader: (item: any) => string = (item: any) => 'Row'
  export let emptyMessage = ''

  $: sortedItems = items
  let sortBy: { column: string, desc: boolean } | undefined = undefined
  let sortColumn: string | undefined = undefined

  function sortItems () {
    if (!sortColumn) {
      sortBy = undefined
      return
    }
    const header = filteredHeaders.find(h => h.id === sortColumn)
    if (!header) return
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

<div class="table-actions">
  {#if filteredHeaders.some(h => h.sortable)}
    <div class="sort-table">
      <Dropdown label="Sort by" options={filteredHeaders.filter(h => h.sortable).map(h => ({ label: h.label, value: h.id }))} onSelect={(value) => { sortColumn = value; sortItems() }} />
    </div>
  {/if}
</div>
<table class:carded={cardedOnMobile}>
  <thead>
    <tr>
      {#each filteredHeaders as header (header.id) }
        {#if header.hideHeader}
          <th style="{header.widthPercent ? `width: ${header.widthPercent}px` : ''}"><ScreenReaderOnly>{header.label}</ScreenReaderOnly></th>
        {:else}
          <th class:sortable={header.sortable} style="{header.widthPercent ? `width: ${header.widthPercent}%` : ''}">
            <span>{header.label}</span>
          </th>
        {/if}
      {/each}
    </tr>
  </thead>
  <tbody>
    {#each sortedItems as item (item.id)}
      <tr>
        {#each filteredHeaders as header (header.id)}
          {#if header.actions?.length}
            <td use:eq>
              <SortableTableCell {item} {header}/>
            </td>
          {:else}
            <td>
              <SortableTableCell {item} {header}/>
            </td>
          {/if}
        {/each}
      </tr>
    {:else}
      <tr><td colspan={filteredHeaders.length}>{emptyMessage}</td></tr>
    {/each}
  </tbody>
</table>
{#if cardedOnMobile}
  {@const titleHeader = filteredHeaders.find(h => h.mobileRole === 'title')}
  {@const subtitleHeaders = filteredHeaders.filter(h => h.mobileRole === 'subtitle')}
  {@const bodyHeaders = filteredHeaders.filter(h => !h.mobileRole && !h.actions?.length)}
  {@const actionHeaders = filteredHeaders.filter(h => h.actions?.length)}
  <div class="mobile-list" class:carded={cardedOnMobile}>
    {#each sortedItems as item, idx (item.id)}
      {@const actions = actionHeaders.map(h => typeof h.actions === 'function' ? h.actions(item) : h.actions).filter(isNotNull).flat()}
      <div class:background={idx % 2 === 0}>
        <SortableTableAccordion
          title={titleHeader?.render?.(item) ?? (titleHeader?.get ? get(item, titleHeader.get) : mobileHeader(item))}
          {item}
          {subtitleHeaders}
          {bodyHeaders}
          {actions}
        />
      </div>
    {:else}
      {emptyMessage}
    {/each}
  </div>
{/if}

<style>
  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 1em;
  }
  :global([data-eq~="500px"]) table.carded {
    display: none;
  }
  thead {
    background-color: #ddd;
    border-top: 1px solid #000;
    border-bottom: 1px solid #000;
  }
  thead th {
    text-align: left;
    padding: 0.5em 0;
  }
  .table-actions {
    display: flex;
    justify-content: flex-end;
  }
  .sort-table {
    margin-bottom: 1em;
    display: flex;
    align-items: center;
    gap: 0.5em;
  }

  tbody tr { border-bottom: 1px dashed #707070 }
  tbody tr td { padding: 0.5em 0; }

  /* Left padding on first cell in each row */
  table tr > th:first-child,
  table tr > td:first-child {
    padding-left: 0.5em;
  }

  /* Right padding on last cell in each row */
  table tr > th:last-child,
  table tr > td:last-child {
    padding-right: 0.5em;
  }


  .mobile-list {
    display: none;
  }
  :global([data-eq~="500px"]) .mobile-list.carded {
    display: block;
  }
</style>
