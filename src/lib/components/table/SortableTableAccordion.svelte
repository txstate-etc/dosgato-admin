<script lang="ts">
  import { slide } from 'svelte/transition'
  import { randomid } from 'txstate-utils'
  import downIcon from '@iconify-icons/ph/caret-down-bold'
  import upIcon from '@iconify-icons/ph/caret-up-bold'
  import { Icon } from '@dosgato/dialog'
  import type { SortableTableHeader, SortableTableRowAction } from './sortabletable'
  import SortableTableCell from './SortableTableCell.svelte'

  export let title: string
  export let item: any
  export let subtitleHeaders: SortableTableHeader[] = []
  export let bodyHeaders: SortableTableHeader[] = []
  export let actions: SortableTableRowAction[] = []

  let showPanel = false
  const bodyId = randomid()
</script>

<div class="table-accordion">
  <div class="header" class:open={showPanel}>
    <button type="button" on:click={() => { showPanel = !showPanel }} aria-expanded={showPanel} aria-controls={bodyId}>
      <div class="header-content">
        <span class="title">{title}</span>
        {#if subtitleHeaders.length}
          <dl class="subtitles">
            {#each subtitleHeaders as header (header.id)}
              <span>
                <dt>{header.label}:</dt>
                <dd><SortableTableCell {item} {header}/></dd>
              </span>
            {/each}
          </dl>
        {/if}
      </div>
      <div class="caret">
        <Icon icon={showPanel ? upIcon : downIcon} width="1.5em"/>
      </div>
    </button>
  </div>
  {#if showPanel}
    <div id={bodyId} class="body" transition:slide>
      <dl>
        {#each bodyHeaders as header (header.id)}
          <span>
            <dt>{header.label}:</dt>
            <dd><SortableTableCell {item} {header}/></dd>
          </span>
        {/each}
      </dl>
      {#if actions.length}
        <div class="actions">
          {#each actions as action}
            <button type="button" on:click={async () => await action.onClick(item)}>
              <div class="button-content">
                <Icon icon={action.icon} width="1.5em" class={action.class}/>
                <span class="button-label">{action.label}</span>
              </div>
            </button>
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .header {
    background-color: #DDDDDD;
    border-top: 1px solid #000;
    border-bottom: 1px solid #000;
  }
  .header.open {
    border-bottom: 1px dashed #000;
  }
  button {
    border: 0;
    background-color: transparent;
    padding: 0.5em;
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    cursor: pointer;
    color: #000;
  }
  .header-content {
    text-align: left;
  }
  .title {
    font-size: 1em;
  }
  .subtitles {
    margin: 0.25em 0 0 0;
    padding: 0;
    display: flex;
    flex-direction: column;
  }
  .subtitles span {
    display: flex;
    gap: 0.5em;
    font-size: 0.85em;
  }
  .subtitles dt {
    font-weight: 700;
  }
  .subtitles dt, .subtitles dd {
    display: inline;
    margin: 0;
  }
  .caret {
    background-color: #fff;
    border-radius: 4px;
    color: #006699;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.25em;
    flex-shrink: 0;
  }
  .body {
    padding: 1em 0.5em;
  }
  .body dl {
    margin-bottom: 1em;
  }
  .body dl span {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.75em;
    gap: 2em;
  }
  .body dt {
    font-weight: 700;
  }
  .body dd {
    margin-left: 0;
  }
  .actions {
    display: flex;
  }
  .actions button {
    background-color: transparent;
    color: #006699;
    font-weight: 500;
    border: 0;
    border-radius: 4px;
    padding: 0;
    cursor: pointer;
    width: auto;
  }
  .actions button .button-content {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .actions button:not(:last-child) {
    margin-right: 1.5em;
  }
</style>
