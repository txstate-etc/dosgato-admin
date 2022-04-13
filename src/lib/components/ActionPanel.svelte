<script lang="ts">
  import { Icon } from '@dosgato/dialog'
  import type { IconifyIcon } from '@iconify/svelte'
  export let actionsTitle: string|undefined = undefined
  export let actions: { label: string, icon?: IconifyIcon, onClick: () => void|Promise<void> }[]
</script>

<div class="action-panel">
  <section class="work">
    <slot />
  </section>
  <section class="actions">
    {#if actionsTitle}<header>{actionsTitle}</header>{/if}
    <ul>
      {#each actions as action}
        <li><button class="reset" on:click={action.onClick}><Icon icon={action.icon} />{action.label}</button></li>
      {/each}
    </ul>
  </section>
</div>

<style>
  .action-panel {
    height: 100%;
    display: flex;
  }
  .work, .actions {
    background-color: white;
    border: 1px solid #888888;
    height: 100%;
    overflow: auto;
    position: relative;
  }
  .actions {
    margin-left: 1em;
    flex-grow: 1;
    max-width: 20em;
    min-width: 10em;
  }
  .work {
    flex-grow: 4;
  }
</style>
