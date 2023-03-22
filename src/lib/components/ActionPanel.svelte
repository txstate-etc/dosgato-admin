<script lang="ts" context="module">
  const hidden = writable<boolean | undefined>(undefined)
</script>
<script lang="ts">
  import { Icon } from '@dosgato/dialog'
  import arrowCircleLeftLight from '@iconify-icons/ph/arrow-circle-left-light'
  import arrowCircleRightLight from '@iconify-icons/ph/arrow-circle-right-light'
  import { elementqueries, eq, modifierKey, offset, OffsetStore, ScreenReaderOnly } from '@txstate-mws/svelte-components'
  import { Store } from '@txstate-mws/svelte-store'
  import { createEventDispatcher, onMount } from 'svelte'
  import { writable } from 'svelte/store'
  import type { ActionPanelAction, ActionPanelGroup } from './actionpanel'

  export let actionsTitle: string|undefined = ''
  export let actions: (ActionPanelAction | ActionPanelGroup)[]
  export let panelelement: HTMLElement | undefined = undefined

  interface $$Events {
    returnfocus: CustomEvent
  }
  const dispatch = createEventDispatcher()

  $: grouped = actions.reduce((grouped: ActionPanelGroup[], a) => {
    if ('actions' in a) grouped.push(a)
    else if (grouped.length && grouped[grouped.length - 1].id.startsWith('group_')) grouped[grouped.length - 1].actions.push(a)
    else grouped.push({ id: 'group_' + a.id, actions: [a] })
    return grouped
  }, []).filter(g => g.actions.length)
  $: allactions = grouped.flatMap(a => a.actions)
  $: enabled = allactions.filter(a => !a.disabled)
  $: disabledCount = allactions.length - enabled.length

  const eqstore = new Store({ width: 900 })
  $: allowCollapse = $eqstore.width <= 900
  function onClick () {
    $hidden = !$hidden
  }

  function onKeydown (e: KeyboardEvent) {
    if (modifierKey(e)) return
    if (e.key === 'm') {
      e.preventDefault()
      e.stopPropagation()
      dispatch('returnfocus')
    }
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
<div bind:this={panelelement} class="action-panel" class:hasPreview={$$slots.preview} class:hidden={$hidden} use:eq={{ store: eqstore }} use:offset={{ store: offsetStore }} style:height>
  <section use:eq class="work" on:transitionend={() => elementqueries.refresh()}>
    <slot />
  </section>
  <div class="right-panel">
    <section class="actions">
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <header on:click={allowCollapse ? onClick : undefined}>
        {#if $hidden}<ScreenReaderOnly>{actionsTitle}</ScreenReaderOnly>{:else}{actionsTitle}{/if}
        {#if allowCollapse}<button class="reset" on:click|stopPropagation={onClick} on:keydown={onKeydown}><Icon width="1.2em" icon={$hidden ? arrowCircleLeftLight : arrowCircleRightLight} hiddenLabel="Minimize Menu" inline /></button>{/if}
      </header>
      <ScreenReaderOnly {arialive}>
        {#if actions.length}
          {enabled.length} actions available, {disabledCount} disabled
        {:else}
          no actions available
        {/if}
      </ScreenReaderOnly>
      {#each grouped as group (group.id)}
        <ul>
          {#each group.actions as action (action.id || action.label)}
            <li class:enabled={!action.disabled} class={action.class}><button class="reset" disabled={action.disabled} on:click={action.onClick} on:keydown={onKeydown}><Icon width="1.2em" icon={action.icon} />{action.label}<ScreenReaderOnly>{action.hiddenLabel}</ScreenReaderOnly></button></li>
          {/each}
        </ul>
      {/each}
    </section>
    {#if $$slots.preview}
      <section class="action-panel-preview">
        <slot name="preview" />
      </section>
    {/if}
  </div>
</div>

<style>
  header {
    position: relative;
    padding: 0.4em 0.4em;
    min-height: 2em;
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
    border-radius: 4px;
  }
  .work, .right-panel {
    white-space: normal;
    vertical-align: top;
    display: inline-block;
    position: relative;
    height: 100%;
    border: 1.5px solid #757575;
    border-radius: 4px;
  }
  .work {
    width: calc(100% - min(max(calc(20% - 2em), 14em), 18em) - 0.5em - 3px);
    overflow: hidden auto;
  }
  .right-panel {
    background-color: var(--action-panel-bg, #757575);
    color: var(--action-panel-text, white);
    margin-left: 0.5em;
    width: 20%;
    max-width: 18em;
    min-width: 14em;
    z-index: 1;
  }

  .hasPreview .actions {
    height: 70%;
  }

  .action-panel-preview {
    height: 30%;
  }

  .action-panel.hidden .right-panel {
    margin-left: 0.5em;
  }
  .action-panel.hidden .work {
    width: calc(100% - 2.8em);
  }
  .action-panel.hidden header button {
    left: 0.4em;
    right: auto;
  }
  .action-panel[data-eq~="800px"] .actions header {
    cursor: pointer;
  }
  :global(.action-panel[data-eq~="500px"]) .work {
    width: calc(100% - 2.8em);
  }
  .action-panel:global(:not(.hidden)[data-eq~="500px"]) .right-panel {
    margin-left: -11em;
  }

  .actions ul {
    overflow-y: auto;
    padding: 0.3em 0;
    margin: 0;
    list-style: none;
    border-bottom: 2px solid var(--action-panel-divider, #999999);
  }
  .actions li {
    border-bottom: 1px dashed var(--action-panel-accent, #666666);
  }
  .actions li:last-child {
    border: 0;
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
