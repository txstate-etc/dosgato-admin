<script lang="ts">
  import type { DetailPanelButton } from './detailpanel'
  import { Icon } from '@dosgato/dialog'
  import { eq } from '@txstate-mws/svelte-components'
  import { shouldUseWhiteText, toArray } from 'txstate-utils'
  let className = ''
  export { className as class }
  export let header: string
  export let button: DetailPanelButton | DetailPanelButton[] | undefined = undefined
  export let headerColor: string = '#00507A'
  $: buttons = toArray(button)
  const color = shouldUseWhiteText(headerColor) ? '#FFF' : '#000'
</script>


<div class="panel {className}" use:eq>
  <div class="header" class:useborder={!shouldUseWhiteText(headerColor)} style="background-color: {headerColor}; color: {color}">
    <h2>{header}</h2>
    {#each buttons as button, i}
      <button type="button" class="reset" disabled={button.disabled} class:leftmost={i === 0} on:click={button.onClick}><Icon icon={button.icon} hiddenLabel={button.hiddenLabel} width="1.5em" /></button>
    {/each}
  </div>
  <div class="body">
    <slot/>
  </div>
</div>

<style>
  .panel {
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
  }
  .header.useborder h2 {
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
  .header button:disabled {
    color: #404040;
  }
  .body {
    background-color: #f4f4f4;
  }
</style>
