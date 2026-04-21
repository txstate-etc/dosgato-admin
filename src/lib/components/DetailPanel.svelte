<script lang="ts">
  import type { DetailPanelButton } from './detailpanel'
  import { Icon } from '@dosgato/dialog'
  import { eq } from '@txstate-mws/svelte-components'
  import { omit, randomid, shouldUseWhiteText, toArray } from 'txstate-utils'
  import { slide } from 'svelte/transition'
  import downIcon from '@iconify-icons/ph/caret-down'
  import upIcon from '@iconify-icons/ph/caret-up'
  import LoadIcon from './LoadIcon.svelte'
  let className = ''
  export { className as class }
  export let header: string
  export let button: DetailPanelButton | DetailPanelButton[] | undefined = undefined
  export let headerColor: string = '#00507A'
  export let loading = false
  export let collapsible = false

  let open = true
  $: buttons = toArray(button)
  const color = shouldUseWhiteText(headerColor) ? '#FFF' : '#000'
  const h2id = randomid()
  const bodyId = randomid()
</script>


<section class="panel {className}" aria-labelledby={h2id} use:eq>
  <header class:useborder={!shouldUseWhiteText(headerColor)} class:collapsed={collapsible && !open} style="background-color: {headerColor}; color: {color}">
    <h2 id={h2id}>{header}</h2>{#if loading}<LoadIcon size="2em" />{/if}
    {#if buttons.length || collapsible}
      <div class="panel-actions">
        {#each buttons as button, i}
          <button type="button" class="reset" disabled={button.disabled} class:leftmost={i === 0 && !collapsible} on:click={button.onClick} {...omit(button, 'onClick', 'disabled', 'hiddenLabel', 'icon')}><Icon icon={button.icon} hiddenLabel={button.hiddenLabel} width="1.5em" /></button>
        {/each}
        {#if collapsible}
          <button type="button" class="reset collapse-toggle" class:leftmost={buttons.length === 0} on:click={() => { open = !open }} aria-expanded={open} aria-controls={bodyId}><Icon icon={open ? upIcon : downIcon} hiddenLabel={open ? 'Collapse panel' : 'Expand panel'} width="1.5em" /></button>
        {/if}
      </div>
    {/if}
  </header>
  {#if !collapsible}
    <div class="body">
      <slot/>
    </div>
  {:else if open}
    <div id={bodyId} class="body" transition:slide>
      <slot/>
    </div>
  {/if}
</section>

<style>
  .panel {
    border: 1px solid #808080;
    border-radius: 8px;
  }
  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0em 1.5em;
    border-top-right-radius: 8px;
    border-top-left-radius: 8px;
  }
  header h2 {
    font-size: 1.3em;
    font-weight: normal;
    margin: 0;
    padding: 0.5em 0;
  }
  header.useborder:not(.collapsed) h2 {
    border-bottom: 2px solid #808080;
  }
  header .panel-actions {
    display: flex;
    align-items: center;
  }
  header button {
    line-height: 1;
    cursor: pointer;
    margin-left: 0.5em;
  }
  header button.leftmost {
    margin-left: auto;
  }
  header button:disabled {
    color: #404040;
  }
  header.collapsed {
    border-bottom-left-radius: 8px;
    border-bottom-right-radius: 8px;
  }
</style>
