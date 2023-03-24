<script lang="ts">
    import type { ResponsiveTableHeader, ResponsiveTableRowAction } from './responsivetable'
    import { ScreenReaderOnly } from '@txstate-mws/svelte-components'
    import { Icon } from '@dosgato/dialog'
    import sortAscendingIcon from '@iconify-icons/ph/sort-ascending'
    import sortDescendingIcon from '@iconify-icons/ph/sort-descending'
    import ResponsiveTableCell from './ResponsiveTableCell.svelte'
    import { sortby } from 'txstate-utils'
    export let rowActions: ResponsiveTableRowAction[] = []
    export let items: any[]
    export let headers: ResponsiveTableHeader[]
    export let rowActionHeader: string | undefined = undefined

    $: sortedItems = items
    let sortBy: { column: string, desc: boolean} | undefined = undefined

    function sortItems (key: string) {
      if (sortBy?.column === key) {
        sortedItems = sortby(sortedItems, key, !sortBy.desc)
        sortBy = { column: key, desc: !sortBy.desc }
      } else {
        sortedItems = sortby(sortedItems, key)
        sortBy = { column: key, desc: false }
      }
    }

    // TODO: Add the option to make the table layout carded on small screens?
    // If I need to display anything other than an action button in the last column, the table can't do that yet. So right now, there
    // are trash cans next to indirect roles and groups on the User Detail page
    // the site detail page site stages table has a manage button that can show options instead of showing the individual buttons
</script>

<table>
  <thead>
    <tr class="headers">
      {#each headers as header (header.id) }
        <th class:sortable={header.sortable}>
          <span>{header.label}</span>
          {#if header.sortable}
            <button class="sort-button" type="button" on:click={() => sortItems(header.id)}>
              {#if sortBy && sortBy.column === header.id && !sortBy.desc}
                <Icon icon={sortDescendingIcon} width="1.5em" hiddenLabel="Sort descending"/>
              {:else}
                <Icon icon={sortAscendingIcon} width="1.5em" hiddenLabel="Sort ascending"/>
              {/if}
            </button>
          {/if}
        </th>
      {/each}
      {#if rowActions.length}
        {#if rowActionHeader}
          <th class="action-header ">{rowActionHeader}</th>
        {:else}
          <td><ScreenReaderOnly>No data</ScreenReaderOnly></td>
        {/if}
      {/if}
    </tr>
  </thead>
  <tbody>
    {#each sortedItems as item (item.id)}
      <tr>
        {#each headers as header (header.id)}
          <td>
            <ResponsiveTableCell {item} {header}/>
          </td>
        {/each}
        {#if rowActions.length}
          <td class="actions">
            {#each rowActions as action (action.label)}
              <button on:click={() => action.onClick(item)}>
                <div class="button-content">
                  <span class="button-icon"><Icon icon={action.icon} hiddenLabel={action.hiddenLabel}/></span>
                </div>
              </button>
            {/each}
          </td>
        {/if}
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
  thead th.action-header, td.actions {
    text-align: center;
  }
  .sort-button {
    border: 0;
    background-color: transparent;
  }
  tbody tr { border-bottom: 1px dashed #707070 }
  tbody tr td { padding: 0.5em 0; }
  .actions button {
    border: 0;
    background-color: transparent;
  }
</style>