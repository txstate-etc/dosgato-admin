<script lang="ts" context="module">
  const hidden = writable<boolean | undefined>(undefined)
</script>
<script lang="ts">
  import { Icon } from '@dosgato/dialog'
  import arrowCircleLeftLight from '@iconify-icons/ph/arrow-circle-left-light'
  import arrowCircleRightLight from '@iconify-icons/ph/arrow-circle-right-light'
  import { elementqueries, eq, offset, OffsetStore, ScreenReaderOnly } from '@txstate-mws/svelte-components'
  import { Store } from '@txstate-mws/svelte-store'
  import { onMount } from 'svelte'
  import { writable } from 'svelte/store'
  import type { ActionPanelAction } from './actionpanel'

  export let actionsTitle: string|undefined = ''
  export let actions: ActionPanelAction[]

  $: enabled = actions.filter(a => !a.disabled)
  $: disabledCount = actions.length - enabled.length

  const eqstore = new Store({ width: 900 })
  $: allowCollapse = $eqstore.width <= 900
  function onClick () {
    $hidden = !$hidden
  }

  function reactToScreenWidth (..._: any) {
    $hidden = $eqstore.width <= 600
  }
  $: reactToScreenWidth($eqstore)

  let scrollY
  const offsetStore = new OffsetStore()
  $: height = `calc(100vh - ${Math.max(0, $offsetStore.bottom ?? 0)}px - ${Math.max(0, ($offsetStore.top ?? 0))}px)`
  let arialive
  onMount(() => {
    arialive = 'polite'
  })
</script>

<svelte:window bind:scrollY />
<div class="action-panel" class:hidden={$hidden} use:eq={{ store: eqstore }} use:offset={{ store: offsetStore }} style:height>
  <section use:eq class="work" on:transitionend={() => elementqueries.refresh()}>
    <slot />
  </section>
  <section class="actions">
    <header on:click={allowCollapse ? onClick : undefined}>
      {#if $hidden}<ScreenReaderOnly>{actionsTitle}</ScreenReaderOnly>{:else}{actionsTitle}{/if}
      {#if allowCollapse}<button class="reset" on:click|stopPropagation={onClick}><Icon width="1.2em" icon={$hidden ? arrowCircleLeftLight : arrowCircleRightLight} hiddenLabel="Minimize Menu" inline /></button>{/if}
    </header>
    <ScreenReaderOnly {arialive}>
      {#if actions.length}
        {enabled.length} actions available, {disabledCount} disabled
      {:else}
        no actions available
      {/if}
    </ScreenReaderOnly>
    {#if actions.length}
      <ul>
        {#each actions as action (action.id || action.label)}
          <li class:enabled={!action.disabled}><button class="reset" disabled={action.disabled} on:click={action.onClick}><Icon width="1.2em" icon={action.icon} />{action.label}</button></li>
        {/each}
      </ul>
    {/if}
  </section>
</div>

<style>
  header {
    position: relative;
    padding: 0.4em 0.4em;
    height: 2em;
    font-weight: bold;
    border-bottom: 1px solid var(--action-panel-divider, #999999);
  }
  header button {
    position: absolute;
    top: 50%;
    right: 0.6em;
    transform: translateY(-50%);
  }
  .action-panel {
    overflow: hidden;
    white-space: nowrap;
  }
  .work, .actions {
    white-space: normal;
    vertical-align: top;
    display: inline-block;
    position: relative;
    height: 100%;
    border: 1px solid #888888;
    transition: 0.3s;
  }
  @media (prefers-reduced-motion) {
    .work, .actions {
      transition: 0s;
    }
  }
  .work {
    width: calc(100% - min(max(calc(20% - 2em), 14em), 18em) - 1em);
    overflow: hidden auto;
  }
  .actions {
    background-color: var(--action-panel-bg, #555555);
    color: var(--action-panel-text, white);
    margin-left: 1em;
    width: 20%;
    max-width: 18em;
    min-width: 14em;
    z-index: 1;
  }

  .action-panel.hidden .actions {
    margin-left: 0.5em;
  }
  .action-panel.hidden .work {
    width: calc(100% - 2.7em);
  }
  .action-panel.hidden header button {
    left: 0.4em;
    right: auto;
  }

  .action-panel:global([data-eq~="800px"]) .actions header {
    cursor: pointer;
  }
  .action-panel:global([data-eq~="500px"]):not(.hidden) .actions {
    margin-left: -11em;
  }
  .action-panel:global([data-eq~="500px"]) .work {
    width: calc(100% - 2.7em);
  }

  .actions ul {
    overflow-y: auto;
    padding: 0;
    margin: 0;
    list-style: none;
  }
  .actions li {
    border-bottom: 1px dashed var(--action-panel-accent, #666666);
  }
  .actions li :global(svg) {
    margin-right: 0.3em;
  }
  .actions li button {
    display: flex;
    align-items: center;
    width: 100%;
    text-align: left;
    padding: 0.4em 0.4em;
  }
  .actions li.enabled:hover {
    background: var(--action-panel-accent, #666666);
  }
  .actions li button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
