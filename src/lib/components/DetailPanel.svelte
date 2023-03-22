<script lang="ts">
  import type { DetailPanelButton } from './detailpanel'
  import { Icon } from '@dosgato/dialog'
  import { eq } from '@txstate-mws/svelte-components'
  import { shouldUseWhiteText, toArray } from 'txstate-utils'
  export let header: string
  export let button: DetailPanelButton | DetailPanelButton[] | undefined = undefined
  export let headerColor: string = '#00507A'
  $: buttons = toArray(button)
  const color = shouldUseWhiteText(headerColor) ? '#FFF' : '#000'
</script>


<div class="panel" use:eq>
  <div class="header" style="background-color: {headerColor}; color: {color}">
    <h2>{header}</h2>
    {#each buttons as button, i}
      <button class="reset" class:leftmost={i === 0} on:click={button.onClick}><Icon icon={button.icon} hiddenLabel={button.hiddenLabel} width="1.5em" /></button>
    {/each}
  </div>
  <div class="body">
    <slot/>
  </div>
</div>

<style>
  .panel {
    width: calc(100% - 2em);
    border: 2px solid black;
    border-radius: 4px;
  }
  .header {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    padding: 0em 1.5em;
  }
  .header h2 {
    font-size: 1.3em;
    font-weight: normal;
    margin: 0;
    padding: 0.5em 0;
    border-bottom: 2px solid black;
  }
  .header button {
    line-height: 1;
    cursor: pointer;
    margin-left: 0.5em;
  }
  .header button.leftmost {
    margin-left: auto;
  }
  .body {
    background-color: #f4f4f4;
  }
  .panel :global(.body > *:not(:last-child)) {
    margin-bottom: 1em;
  }
  .panel :global(.body > *:last-child) {
    padding-bottom: 1em;
  }
</style>
