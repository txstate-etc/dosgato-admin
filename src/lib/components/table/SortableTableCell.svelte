<script lang="ts">
  import { get } from 'txstate-utils'
  import type { SortableTableHeader } from './sortabletable'
  import { Icon } from '@dosgato/dialog'

  export let header: SortableTableHeader
  export let item: any
  $: icon = typeof header.icon === 'function' ? header.icon(item) : header.icon
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
{:else if header.actions}
  {#each header.actions as action (action.label)}
    <button on:click={() => action.onClick(item)}>
      <div class="button-content">
        <span class="button-icon"><Icon icon={action.icon} hiddenLabel={action.hiddenLabel} width="1.5em"/></span>
      </div>
    </button>
  {/each}
{/if}

<style>
  button {
    border: 0;
    background-color: transparent;
  }
</style>