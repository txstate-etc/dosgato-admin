<script lang="ts">
  import type { DetailPanelButton } from './detailpanel'
  import { Icon } from '@dosgato/dialog'
  import { eq } from '@txstate-mws/svelte-components'
  import { toArray } from 'txstate-utils'
  export let header: string
  export let button: DetailPanelButton | DetailPanelButton[] | undefined = undefined
  $: buttons = toArray(button)
</script>


<div class="panel" use:eq>
  <div class="header">
    <div>{header}</div>
    {#each buttons as button, i}
      <button class="reset" class:leftmost={i === 0} on:click={button.onClick}><Icon icon={button.icon} hiddenLabel={button.hiddenLabel} width="1.3em" /></button>
    {/each}
  </div>
  <div class="body">
    <slot/>
  </div>
</div>

<style>
  .panel {
    width: calc(100% - 2em);
    margin: 0 auto 3em auto;
    max-width: 60em;
  }
  .header {
    background-color: #00507A;
    color: #fff;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    padding: 0.8em 1em;
    font-weight: bold;
    border-top-left-radius: 3px;
    border-top-right-radius: 3px;
  }
  .header button {
    color: white;
    line-height: 1;
    cursor: pointer;
    margin-left: 0.5em;
  }
  .header button.leftmost {
    margin-left: auto;
  }
  .body {
    border: 1px solid #666;
    border-top-width: 0;
    padding: 0.8em 1em;
    border-bottom-left-radius: 3px;
    border-bottom-right-radius: 3px;
  }
</style>
