<script lang="ts">
  import type { SortableTableHeader } from './sortabletable'
  import SortableTableCell from './SortableTableCell.svelte'
  import { eq, ScreenReaderOnly } from '@txstate-mws/svelte-components'
  import sortAscendingIcon from '@iconify-icons/ph/sort-ascending'
  import sortDescendingIcon from '@iconify-icons/ph/sort-descending'
  import { isNotNull, randomid, sortby } from 'txstate-utils'
  import { Icon } from '@dosgato/dialog'
  import { Accordion } from '..'
  export let items: any[]
  export let headers: SortableTableHeader[]
  export let cardedOnMobile = false
  export let mobileHeader: (item: any) => string = (item: any) => 'Row'
  export let emptyMessage = ''

  $: sortedItems = items
  let sortBy: { column: string, desc: boolean } | undefined = undefined
  let sortColumn: string | undefined = undefined
  const sortId = randomid()

  function sortItems () {
    if (!sortColumn) {
      sortBy = undefined
      return
    }
    const header = headers.find(h => h.id === sortColumn)
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
  {#if headers.some(h => h.sortable)}
    <div class="sort-table">
      <label for="sortby-select-{sortId}">Sort by</label>
      <select id="sortby-select-{sortId}" bind:value={sortColumn} on:change={() => sortItems()}>
        <option value="">-- Select --</option>
        {#each headers.filter(h => h.sortable) as header}
          <option value={header.id}>{header.label}</option>
        {/each}
      </select>
    </div>
  {/if}
</div>
<table class:carded={cardedOnMobile}>
  <thead>
    <tr>
      {#each headers as header (header.id) }
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
        {#each headers as header (header.id)}
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
      <tr><td colspan={headers.length}>{emptyMessage}</td></tr>
    {/each}
  </tbody>
</table>
{#if cardedOnMobile}
  <div class="mobile-list" class:carded={cardedOnMobile}>
    {#each sortedItems as item, idx (item.id)}
      <div class:background={idx % 2 === 0}>
        <Accordion title={mobileHeader(item)}>
          <dl>
            {#each headers as header (header.id)}
              {#if !header.actions}
                <span>
                  <dt>{header.label}:</dt><dd><SortableTableCell {item} {header}/></dd>
                </span>
              {/if}
            {/each}
          </dl>
          {@const actions = headers.filter(h => h.actions?.length).map(h => h.actions).filter(isNotNull).flat().map(a => (typeof a === 'function') ? a(item) : a).flat() }
          {#if actions.length}
            <div class="actions">
              {#each actions as action}
                <button type="button" on:click={async () => await action.onClick(item)}>
                  <div class="button-content">
                    <span class="button-label">{action.label}</span>
                  </div>
                </button>
              {/each}
            </div>
          {/if}
        </Accordion>
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
  thead th.sortable button, thead th.sortable span {
    vertical-align: middle;
  }
  .sort-button {
    border: 0;
    background-color: transparent;
    color: black;
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
  .mobile-list div.background {
    background-color: #e5e5e5;
  }
  dl {
    display: flex;
    flex-direction: column;
  }
  dl span {
    padding: 0.5em 0;
    border-bottom: 1px dashed #707070;
    display: flex;
    justify-content: space-between;
  }
  dt, dd {
    display: inline;
  }
  .actions {
    display: flex;
    justify-content: center;
  }
  .actions button {
    background-color: #501214;
    color: #ffffff;
    border: 0;
    border-radius: 4px;
    padding: 5px 10px;
    cursor: pointer;
  }
  .actions button:not(:last-child) {
    margin-right: 1.5em;
  }
</style>
