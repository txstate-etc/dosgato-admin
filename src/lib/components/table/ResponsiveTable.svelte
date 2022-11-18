<script lang="ts">
  import type { ResponsiveTableHeader, ResponsiveTableRowAction } from './responsivetable'
  import { isNotBlank, isNotNull } from 'txstate-utils'
  import { ScreenReaderOnly } from '@txstate-mws/svelte-components'
  import ResponsiveTableCell from './ResponsiveTableCell.svelte'
  import { Icon } from '@dosgato/dialog'

  export let items: any[]
  export let headers: (ResponsiveTableHeader)[]
  export let rowActions: ResponsiveTableRowAction[] = []
  export let caption: string | undefined = undefined
</script>

<table>
  {#if isNotNull(caption)}
    <caption>{caption}</caption>
  {/if}
  <thead>
    <tr class="headers">
      {#each headers as header (header.id) }
        <th>{header.label}</th>
      {/each}
      {#if rowActions.length}
        <td><ScreenReaderOnly>No data</ScreenReaderOnly></td>
      {/if}
    </tr>
  </thead>
  <tbody>
    {#each items as item (item.id)}
      <tr>
        {#each headers as header (header.id)}
          <td>
            {#if isNotBlank(header.label)}<div class="carded-label">{header.label}:</div>{/if}
            <ResponsiveTableCell {item} {header}/>
          </td>
        {/each}
        {#if rowActions.length}
          <td class="actions">
            {#each rowActions as action (action.label)}
              <button on:click={() => action.onClick(item)}>
                <div class="button-content">
                  <span class="button-icon"><Icon icon={action.icon} hiddenLabel={action.hiddenLabel}/></span>
                  <span class="button-label">{action.label}</span>
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
  table tr { border-bottom: 1px dashed #ebebeb }
  table tr.headers {
    border-bottom: 1px solid #ebebeb;
  }
  table tr:nth-child(even) { background-color: #f6f7f9 }
  table tr td { text-align: center }
  td .carded-label {
    display: none;
    font-weight: bold;
  }
  button {
    border: 0;
    padding: 0;
    background-color: transparent;
    cursor: pointer;
  }
  button .button-label {
    display: none;
  }
  button:not(:last-child) {
    margin-right: 0.5em;
  }
  :global([data-eq~="700px"]) table {
    border-collapse: separate;
    border-spacing: 0 1em;
  }
  :global([data-eq~="700px"]) table tr {
    background-color: #f6f7f9;
  }
  :global([data-eq~="700px"]) table tr.headers {
    display: none;
  }
  :global([data-eq~="700px"]) table tr td {
    display: flex;
    justify-content: space-between;
    padding: 0.5em;
  }
  :global([data-eq~="700px"]) table tr td:not(:last-child) {
    border-bottom: 1px dashed #ebebeb;
  }
  :global([data-eq~="700px"]) td .carded-label {
    display: block;
  }
  :global([data-eq~="700px"]) table tr td.actions {
    justify-content: center;
  }
  :global([data-eq~="700px"]) button {
    background-color: #ddd5c9;
    border-radius: 3px;
    color: black;
    padding: 0.3em 0.5em;
  }
  :global([data-eq~="700px"]) button .button-icon {
    display: none;
  }
  :global([data-eq~="700px"]) button .button-label {
    display: block;
    font-weight: bold;
  }
</style>
