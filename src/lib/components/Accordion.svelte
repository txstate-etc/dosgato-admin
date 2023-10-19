<script lang="ts">
  import { slide } from 'svelte/transition'
  import { randomid } from 'txstate-utils'
  import downIcon from '@iconify-icons/ph/caret-down'
  import upIcon from '@iconify-icons/ph/caret-up'
  import { Icon } from '@dosgato/dialog'
  import { eq } from '@txstate-mws/svelte-components'
  let showPanel: boolean = false
  const bodyId: string = randomid()
  export let title
</script>

<div class="accordion" use:eq>
  <div class="header">
    <button type="button" on:click={() => { showPanel = !showPanel }} aria-expanded={showPanel} aria-controls={bodyId} class:shown={showPanel}>
      <span>{title}</span>
      <Icon icon={showPanel ? upIcon : downIcon} width="1.5em"/>
    </button>
  </div>
  {#if showPanel}
  <div id={bodyId} class="body" transition:slide>
    <slot/>
  </div>
  {/if}
</div>

<style>
  button {
    border: 0;
    background-color: transparent;
    font-weight: bold;
    padding: 0;
    display: flex;
    align-items: center;
    color: black;
  }
  button.shown {
    padding-bottom: 0.5em;
    border-bottom: 2px solid black;
    margin-bottom: 1em;
  }
  button span {
    margin-right: 1em;
  }
</style>
