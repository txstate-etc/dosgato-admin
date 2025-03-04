<script lang="ts">
  import { Icon } from '@dosgato/dialog'
  import magnifyingGlass from '@iconify-icons/ph/magnifying-glass'
  import xIcon from '@iconify-icons/ph/x'
  import { createEventDispatcher, tick } from 'svelte'
  import { isNotBlank } from 'txstate-utils'

  export let value = ''
  export let asYouType = false
  export let searchInput: HTMLInputElement | undefined = undefined
  export let minimized = false
  export let searchLabel = 'Search'

  interface $$Events {
    search: CustomEvent<string>
    maximize: CustomEvent
  }
  const dispatch = createEventDispatcher()

  function onChange (e: (KeyboardEvent | InputEvent) & { currentTarget: HTMLInputElement }) {
    value = e.currentTarget?.value
    if (asYouType || ('key' in e && e.key === 'Enter')) dispatch('search', e.currentTarget?.value ?? '')
  }

  function onSearch (e: MouseEvent) {
    dispatch('search', searchInput?.value ?? '')
  }

  function onMaximize () {
    dispatch('maximize')
  }

  async function onCancel () {
    value = ''
    dispatch('search', '')
    await tick()
    searchInput?.focus()
  }
</script>

<div class="search-input">
  {#if minimized}
    <button type="button" class="reset maximize" on:click|stopPropagation={onMaximize}><Icon icon={magnifyingGlass} hiddenLabel="Search"/></button>
  {:else}
    <input bind:this={searchInput} {value} type="text" placeholder="Search..." on:keydown|stopPropagation on:keyup|preventDefault={onChange} on:change={onChange} aria-label={searchLabel} />
    <div class="search-buttons">
      {#if isNotBlank(value)}
        <button type="button" class="reset cancelsearch" on:click|stopPropagation={onCancel}><Icon icon={xIcon} hiddenLabel="Cancel Search" inline /></button>
      {/if}
      {#if !asYouType}
        <button type="button" class="reset search" on:click|stopPropagation={onSearch}>Search</button>
      {/if}
    </div>
  {/if}
</div>

<style>
  .search-input {
    position: relative;
  }
  input {
    width: 100%;
    border: 1px solid var(--action-panel-accent, #666666);
    border-radius: 0.2em;
    padding: 0.15em 5em 0.15em 0.3em;
    line-height: 1.6;
  }
  .search-buttons {
    position: absolute;
    top: 50%;
    right: 0.3em;
    transform: translateY(-50%);
  }
  .maximize {
    width: 100%;
    padding: 0.2em;
    text-align: center;
  }
  .search {
    background-color: var(--dg-button-bg, #501214);
    color: var(--dg-button-text, white);
    border: 1px solid var(--action-panel-accent, #666666);
    border-radius: 0.3em;
    padding: 0.3em;
    font-size: 0.8em;
  }
  .cancelsearch {
    padding: 0.3em 0.2em;
    color: #222222;
  }
</style>
