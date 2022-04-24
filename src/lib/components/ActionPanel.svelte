<script lang="ts">
  import { Icon } from '@dosgato/dialog'
  import { eq, offset, OffsetStore, ScreenReaderOnly } from '@txstate-mws/svelte-components'
  import { onMount } from 'svelte'
  import type { ActionPanelAction } from './actionpanel'

  export let actionsTitle: string|undefined = undefined
  export let actions: ActionPanelAction[]

  $: enabled = actions.filter(a => !a.disabled)
  $: disabledCount = actions.length - enabled.length

  let scrollY
  const offsetStore = new OffsetStore()
  $: height = `calc(100vh - ${Math.max(0, $offsetStore.bottom ?? 0)}px - ${Math.max(0, ($offsetStore.top ?? 0))}px)`
  let arialive
  onMount(() => {
    arialive = 'polite'
  })
</script>

<svelte:window bind:scrollY />
<div class="action-panel" use:eq use:offset={{ store: offsetStore }} style:height>
  <section use:eq class="work">
    <slot />
  </section>
  <section class="actions">
    {#if actionsTitle}<header>{actionsTitle}</header>{/if}
    <ScreenReaderOnly {arialive}>
      {#if actions.length}
        {enabled.length} actions available, {disabledCount} disabled
      {:else}
        no actions available
      {/if}
    </ScreenReaderOnly>
    {#if actions.length}
      <ul>
        {#each actions as action}
          <li><button class="reset" disabled={action.disabled} on:click={action.onClick}><Icon icon={action.icon} inline />{action.label}</button></li>
        {/each}
      </ul>
    {/if}
  </section>
</div>

<style>
  .action-panel {
    display: flex;
    align-items: flex-start;
  }
  .work, .actions {
    position: relative;
    height: 100%;
    border: 1px solid #888888;
    overflow: auto;
  }
  .work {
    flex-grow: 1;
  }
  .actions {
    background-color: var(--action-panel-bg, #555555);
    color: var(--action-panel-text, white);
    margin-left: 1em;
    max-width: 20em;
    min-width: 10em;
  }
  .actions ul {
    padding: 0;
    margin: 0;
    list-style: none;
  }
  .actions li {
    padding: 0.3em 0.5em;
  }
  .actions li :global(svg) {
    margin-right: 0.2em;
  }
  .actions li button {
    display: block;
  }
</style>
