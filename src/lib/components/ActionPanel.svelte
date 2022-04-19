<script lang="ts">
  import { Icon } from '@dosgato/dialog'
  import { eq, offset, OffsetStore, ScreenReaderOnly } from '@txstate-mws/svelte-components'
  import type { IconifyIcon } from '@iconify/svelte'
  import { onMount } from 'svelte'

  export let actionsTitle: string|undefined = undefined
  export let actions: { label: string, icon?: IconifyIcon, disabled?: boolean, onClick: () => void|Promise<void> }[]

  $: enabled = actions.filter(a => !a.disabled)
  $: disabledCount = actions.length - enabled.length

  let scrollY
  const offsetStore = new OffsetStore()
  $: maxHeight = `calc(100vh - ${Math.max(0, $offsetStore.bottom ?? 0)}px - ${Math.max(0, ($offsetStore.top ?? 0) - scrollY)}px)`
  let arialive
  onMount(() => {
    arialive = 'polite'
  })
</script>

<svelte:window bind:scrollY />
<div class="action-panel" use:eq use:offset={{ store: offsetStore }}>
  <section use:eq class="work">
    <slot />
  </section>
  <section class="actions" style:max-height={maxHeight}>
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
    height: 100%;
    display: flex;
    align-items: flex-start;
  }
  .work, .actions {
    min-height: 15em;
    border: 1px solid #888888;
  }
  .actions {
    background-color: var(--action-panel-bg, #555555);
    color: var(--action-panel-text, white);
    margin-left: 1em;
    max-width: 20em;
    min-width: 10em;
    position: sticky;
    top: 0;
    right: 0;
    overflow: auto;
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
  .work {
    position: relative;
    flex-grow: 1;
  }
</style>
