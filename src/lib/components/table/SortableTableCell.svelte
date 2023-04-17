<script lang="ts">
  import { get } from 'txstate-utils'
  import type { SortableTableHeader } from './sortabletable'
  import { Dialog, Icon } from '@dosgato/dialog'

  export let header: SortableTableHeader
  export let item: any
  let showModal: boolean = false
  $: icon = typeof header.icon === 'function' ? header.icon(item) : header.icon
  $: actions = typeof header.actions === 'function' ? header.actions(item) : header.actions
</script>

{#if header.render}
  {@html header.render(item)}
{:else if header.icon}
  <span class="icon"><Icon icon={icon?.icon} hiddenLabel={icon?.hiddenLabel} inline /></span>
{:else if header.get}
  {#if get(item, header.get)}
    {get(item, header.get)}
  {:else}
    &nbsp;
  {/if}
{:else if actions?.length}
  <div class="actions-container">
    {#each actions as action (action.label)}
      <button on:click={() => action.onClick(item)} class="icon-button">
        <div class="button-content">
          <span class="button-icon"><Icon icon={action.icon} hiddenLabel={action.hiddenLabel ?? action.label} width="1.5em"/></span>
        </div>
      </button>
    {/each}
    <button class="collapse-button" on:click={() => { showModal = true }}>{header.combinedActionsLabel ?? 'Manage'}</button>
  </div>
  {#if showModal}
    <Dialog continueText='Cancel' on:continue={() => { showModal = false }}>
      <div class="consolidated-actions">
        {#each actions as action (action.label)}
          <button class='consolidated-action' on:click={() => { showModal = false; action.onClick(item) }}>
            <Icon icon={action.icon} width="60%"/><br>{action.label}
          </button>
        {/each}
      </div>
    </Dialog>
  {/if}
{/if}
<style>
  button {
    border: 0;
    background-color: transparent;
  }
  .consolidated-actions {
    display: flex;
    justify-content: space-between;
  }
  .collapse-button {
    display: none;
    background-color: #501214;
    color: #ffffff;
    padding: 0.2em 0.5em;
    border-radius: 2px;
  }
  :global([data-eq~="100px"]) button.icon-button {
    display: none;
  }
  :global([data-eq~="100px"]) button.collapse-button {
    display: block;
  }
</style>
