<script lang="ts">
  import type { SortableTableHeader } from './sortabletable'
  import SortableTableCell from './SortableTableCell.svelte'
  import { eq, ScreenReaderOnly } from '@txstate-mws/svelte-components'
  import sortAscendingIcon from '@iconify-icons/ph/sort-ascending'
  import sortDescendingIcon from '@iconify-icons/ph/sort-descending'
  import { isNotNull, sortby } from 'txstate-utils'
  import { Icon } from '@dosgato/dialog'
  import { Accordion } from '..'
  export let items: any[]
  export let headers: SortableTableHeader[]
  export let cardedOnMobile = false
  export let mobileHeader: (item: any) => string = (item: any) => 'Row'

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

<table class:carded={cardedOnMobile}>
  <thead>
    {#each headers as header (header.id) }
      {#if header.hideHeader}
        <th style="{header.widthPercent ? `width: ${header.widthPercent}px` : ''}"><ScreenReaderOnly>{header.label}</ScreenReaderOnly></th>
      {:else}
        <th class:sortable={header.sortable} style="{header.widthPercent ? `width: ${header.widthPercent}%` : ''}">
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
  {/each}
  </tbody>
</table>
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
              <button on:click={() => action.onClick(item)}>
                <div class="button-content">
                  <span class="button-label">{action.label}</span>
                </div>
              </button>
            {/each}
          </div>
        {/if}
      </Accordion>
    </div>
  {/each}
</div>

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
  }
  .actions button:not(:last-child) {
    margin-right: 1.5em;
  }
</style>