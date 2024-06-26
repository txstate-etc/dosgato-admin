<script lang="ts">
  import { get, isNotNull } from 'txstate-utils'
  import type { SortableTableHeader } from './sortabletable'
  import { Dialog, Icon } from '@dosgato/dialog'

  export let header: SortableTableHeader
  export let item: any
  let showModal: boolean = false
  $: icon = typeof header.icon === 'function' ? header.icon(item) : header.icon
  $: actions = (typeof header.actions === 'function' ? header.actions(item) : header.actions)?.filter(a => { return a.allowed ? a.allowed(item) : true })
  const combineActions: boolean = isNotNull(header.combinedActionsLabel)
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
      {@const hiddenLabel = action.hiddenLabel ? (typeof action.hiddenLabel === 'function' ? action.hiddenLabel(item) : action.hiddenLabel) : action.label}
      <button type="button" on:click={async () => await action.onClick(item)} class="icon-button" class:combine={combineActions}>
        <div class="button-content">
          <span class="button-icon"><Icon icon={action.icon} {hiddenLabel} width="1.5em"/></span>
        </div>
      </button>
    {/each}
    {#if combineActions}
      <button type="button" class="collapse-button" on:click={() => { showModal = true }}>{header.combinedActionsLabel}</button>
    {/if}
  </div>
  {#if combineActions && showModal}
    <Dialog continueText='Cancel' on:continue={() => { showModal = false }} title={header.combinedActionsLabel}>
      <div class="consolidated-actions">
        {#each actions as action (action.label)}
          <button type="button" class='consolidated-action' on:click={() => { showModal = false; void action.onClick(item) }}>
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
    color: black;
    cursor: pointer;
  }
  .actions-container {
    display: flex;
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
  :global([data-eq~="100px"]) button.icon-button.combine {
    display: none;
  }
  :global([data-eq~="100px"]) button.collapse-button {
    display: block;
  }
</style>
