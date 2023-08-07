<script lang="ts" context="module">
  const hidden = writable<boolean | undefined>(undefined)
</script>
<script lang="ts">
  import { Icon } from '@dosgato/dialog'
  import arrowCircleLeftLight from '@iconify-icons/ph/arrow-circle-left-light'
  import arrowCircleRightLight from '@iconify-icons/ph/arrow-circle-right-light'
  import magnifyingGlass from '@iconify-icons/ph/magnifying-glass'
  import { elementqueries, eq, modifierKey, offset, OffsetStore, ScreenReaderOnly } from '@txstate-mws/svelte-components'
  import { Store } from '@txstate-mws/svelte-store'
  import { createEventDispatcher, getContext, onMount, tick } from 'svelte'
  import { writable } from 'svelte/store'
  import type { ActionPanelAction, ActionPanelGroup } from './actionpanel'
  import { uiLog } from '$lib/logging'

  export let actionsTitle: string|undefined = ''
  export let actions: (ActionPanelAction | ActionPanelGroup)[]
  export let panelelement: HTMLElement | undefined = undefined
  export let filterinput = false
  let searchInput: HTMLInputElement

  interface $$Events {
    returnfocus: CustomEvent
    filter: CustomEvent<string>
  }
  const dispatch = createEventDispatcher()
  const { getTarget } = getContext('ActionPanelTarget') as { getTarget: () => string | undefined }

  function onAction (action: ActionPanelAction) {
    return () => {
      uiLog.log({ eventType: 'ActionPanel', action: action.label, ...(action.hiddenLabel && { additionalProperties: { hiddenLabel: action.hiddenLabel } }) }, getTarget())
      action.onClick()
    }
  }

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
  async function onClickSearchButton () {
    onClick()
    await tick()
    searchInput.focus()
  }

  function onKeydown (e: KeyboardEvent) {
    if (modifierKey(e)) return
    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      dispatch('returnfocus')
    }
  }

  function onFilterChange (e: (KeyboardEvent | InputEvent) & { currentTarget: HTMLInputElement }) {
    dispatch('filter', e.currentTarget?.value ?? '')
  }

  function reactToScreenWidth (..._: any) {
    $hidden = $eqstore.width <= 600
  }
  $: reactToScreenWidth($eqstore)

  let scrollY
  const offsetStore = new OffsetStore()
  $: height = `calc(${supportsDVH ? '100dvh' : '100vh'} - ${Math.max(0, $offsetStore.bottom ?? 0)}px - ${Math.max(0, ($offsetStore.top ?? 0))}px)`
  let arialive
  let supportsDVH = false
  onMount(() => {
    arialive = 'polite'
    supportsDVH = CSS.supports('height: 100dvh')
  })
</script>

<svelte:window bind:scrollY />
<div bind:this={panelelement} class="action-panel" class:hidden={$hidden} use:eq={{ store: eqstore }} use:offset={{ store: offsetStore }} style:height>
  <section use:eq class="work">
    <slot />
  </section>
  <div class="right-panel">
    <section class="actions">
      <!-- svelte-ignore a11y-click-events-have-key-events -->
      <header on:click={allowCollapse ? onClick : undefined}>
        {#if $hidden}<ScreenReaderOnly>{actionsTitle}</ScreenReaderOnly>{:else}{actionsTitle}{/if}
        {#if allowCollapse}<button type="button" class="reset" on:click|stopPropagation={onClick} on:keydown={onKeydown}><Icon width="1.2em" icon={$hidden ? arrowCircleLeftLight : arrowCircleRightLight} hiddenLabel="Minimize Menu" inline /></button>{/if}
      </header>
      {#if filterinput}
          <div class="search-area">
            {#if $hidden}
              <button type="button" class="reset" on:click|stopPropagation={onClickSearchButton}><Icon icon={magnifyingGlass} hiddenLabel="Search"/></button>
            {:else}
              <input bind:this={searchInput} type="text" placeholder="Search..." on:keyup={onFilterChange} on:change={onFilterChange} />
            {/if}
          </div>
      {/if}
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
            <li class:enabled={!action.disabled} class={action.class}><button type="button" class="reset" disabled={action.disabled} on:click={onAction(action)} on:keydown={onKeydown}><Icon width="{`${action.iconWidth ?? 1.2}em`}" icon={action.icon} />{action.label}<ScreenReaderOnly>{action.hiddenLabel}</ScreenReaderOnly></button></li>
          {/each}
        </ul>
      {/each}
    </section>
    {#if $$slots.preview}
      <section class="action-panel-preview">
        <slot name="preview" />
      </section>
    {/if}
    {#if $$slots.bottom}
      <section class="action-panel-bottom">
        <slot name="bottom" />
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
    width: calc(100% - min(max(20%, 14em), 18em) - 0.5em - 3px);
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
    display: inline-flex;
    flex-direction: column;
    overflow-y: auto;
  }

  .action-panel-preview {
    margin-top: auto;
    max-height: 30%;
  }
  .action-panel-bottom {
    margin-top: auto;
    padding: 0.5em 0;
    text-align: center;
    border-top: 2px solid var(--action-panel-divider, #999999)
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

  .search-area {
    padding: 0.3em;
    border-bottom: 2px solid var(--action-panel-divider, #999999);
  }
  .search-area button {
    padding-left: 0.2em;
  }
  .search-area input {
    width: 100%;
    line-height: 1.6;
  }
  .actions ul {
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
