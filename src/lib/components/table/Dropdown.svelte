<script lang="ts">
  import type { IconifyIcon } from '@iconify/svelte'
  import { Icon } from '@dosgato/dialog'
  import updownIcon from '@iconify-icons/ph/caret-up-down-fill'
  import { randomid } from 'txstate-utils'
  import { tick } from 'svelte'
  
  let dropdownid = randomid()
  export let label: string
  export let options: { label: string, value: string }[] = []
  export let includeNone: boolean = false
  export let icon: IconifyIcon = updownIcon
  export let onSelect: (value: string | undefined) => void = () => {}

  let open = false
  let selected: { label: string, value: string } | undefined = undefined
  let buttonEl: HTMLButtonElement
  let dropdownEl: HTMLDivElement
  let listboxEl: HTMLUListElement
  let focusedIndex = -1

  $: allOptions = includeNone ? [{ label: 'None', value: '' }, ...options] : options
  $: if (!open) focusedIndex = -1

  async function toggle() {
    open = !open
    if (open) {
      focusedIndex = 0
      await tick()
      listboxEl?.focus()
    }
  }

  function select(option: { label: string, value: string }) {
    if (option.value === '') {
      selected = undefined
      onSelect(undefined)
    } else {
      selected = option
      onSelect(option.value)
    }
    open = false
    buttonEl.focus()
  }

  function close() {
    open = false
    buttonEl.focus()
  }

  function handleKeydown(e: KeyboardEvent) {
    if (!open) return
    switch (e.key) {
      case 'Escape':
        e.preventDefault()
        close()
        break
      case 'ArrowDown':
        e.preventDefault()
        focusedIndex = (focusedIndex + 1) % allOptions.length
        break
      case 'ArrowUp':
        e.preventDefault()
        focusedIndex = (focusedIndex - 1 + allOptions.length) % allOptions.length
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (focusedIndex >= 0) select(allOptions[focusedIndex])
        break
      case 'Home':
        e.preventDefault()
        focusedIndex = 0
        break
      case 'End':
        e.preventDefault()
        focusedIndex = allOptions.length - 1
        break
    }
  }

  function handleClickOutside(e: MouseEvent) {
    if (open && dropdownEl && !dropdownEl.contains(e.target as Node)) {
      open = false
    }
  }
</script>

<svelte:window on:mousedown={handleClickOutside} />

<div class="dropdown" class:open bind:this={dropdownEl}>
  <span class="dropdown-label" id={`dropdown-label-${dropdownid}`}>{label}</span>
  <button class="dropdown-toggle" bind:this={buttonEl} on:click={toggle} aria-haspopup="listbox" aria-expanded={open} aria-labelledby={`dropdown-label-${dropdownid}`}>
    <span class="label">{selected?.label ?? 'Select...'}</span>
    <Icon {icon} hiddenLabel="" />
  </button>
  {#if open}
    <ul class="dropdown-menu" role="listbox" tabindex="-1" bind:this={listboxEl} on:keydown={handleKeydown} aria-labelledby={`dropdown-label-${dropdownid}`} aria-activedescendant={focusedIndex >= 0 ? `dropdown-option-${dropdownid}-${focusedIndex}` : undefined}>
      {#each allOptions as option, i (option.value)}
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <li id="dropdown-option-{dropdownid}-{i}" role="option" aria-selected={selected?.value === option.value} class:focused={focusedIndex === i} on:click={() => select(option)} on:mouseenter={() => { focusedIndex = i }}>{option.label}</li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .dropdown {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 0.5em;
  }

  .dropdown-label {
    white-space: nowrap;
  }

  .dropdown-toggle {
    display: inline-flex;
    align-items: center;
    gap: 0.5em;
    padding: 0.4em 0.75em;
    border: 1px solid #ccc;
    border-radius: 4px;
    background: #fff;
    cursor: pointer;
    font-size: inherit;
  }

  .dropdown-toggle:hover {
    border-color: #999;
  }

  .dropdown-menu {
    position: absolute;
    top: 100%;
    left: 0;
    margin: 0.25em 0 0;
    padding: 0;
    list-style: none;
    background: #fff;
    border: 1px solid #ccc;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    min-width: 100%;
    z-index: 10;
  }

  .dropdown-menu li {
    padding: 0.4em 0.75em;
    cursor: pointer;
    white-space: nowrap;
  }

  .dropdown-menu li:hover,
  .dropdown-menu li.focused {
    background: #f0f0f0;
  }

  .dropdown-menu li[aria-selected="true"] {
    font-weight: 600;
  }
</style>
