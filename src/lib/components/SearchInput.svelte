<script lang="ts">
  import { isNotBlank } from 'txstate-utils'
  import { Icon } from '@dosgato/dialog'
  import searchIconBold from '@iconify-icons/ph/magnifying-glass-bold'
  import xIcon from '@iconify-icons/ph/x'
  import { createEventDispatcher } from 'svelte'

  export let searchStore

  interface $$Events {
    escape: CustomEvent
  }
  const dispatch = createEventDispatcher()

  function handleInput (e: Event & { currentTarget: HTMLInputElement }) {
    const value = e.currentTarget.value
    searchStore.update(v => ({ ...v, searchInput: value }))
    if ($searchStore.asYouType) {
      searchStore.topSearchFn?.(value)
    }
  }

  function handleKeydown (e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault()
      // only run search on enter if not as-you-type to avoid double-searching
      if (!$searchStore.asYouType) searchStore.topSearchFn?.($searchStore.searchInput)
    } else if (e.key === 'Escape') {
      dispatch('escape')
    }
  }

  function onCancelSearch () {
    searchStore.reset()
    searchStore.topSearchFn?.('')
  }
</script>

{#if $searchStore.show}
  <div class="search-input">
    <input value={$searchStore.searchInput} type="text" on:keydown|stopPropagation={handleKeydown} aria-label="Search" placeholder="{$searchStore.placeholder ?? 'Search...'}" on:input={handleInput} />
    <div class="search-buttons">
      {#if isNotBlank($searchStore.searchInput)}
        <button type="button" class="reset cancelsearch" on:click|stopPropagation={onCancelSearch}><Icon icon={xIcon} hiddenLabel="Cancel Search" inline /></button>
      {/if}
      {#if !$searchStore.asYouType}
        <button type="button" class="reset search" aria-label="Search" on:click|stopPropagation={() => searchStore.topSearchFn?.($searchStore.searchInput)}>
          <Icon icon={searchIconBold}/>
        </button>
      {/if}
    </div>
  </div>
{/if}

<style>
  .search-input {
    position: relative;
  }
  .search-input input {
    width: 100%;
    height: 36px;
    padding: 0.15em 3.5em 0.15em 0.3em;
    border: 1px solid var(--action-panel-accent, #666666);
    border-radius: 4px;
  }
  .search-buttons {
    position: absolute;
    top: 50%;
    right: 0.3em;
    transform: translateY(-50%);
    display: flex;
    gap: 0.3em;
  }
  .search-input button.search {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 28px;
    height: 28px;
    background-color: var(--dg-button-bg, #501214);
    color: var(--dg-button-text, white);
    border-width: 0;
    border-radius: 4px;
  }
</style>
