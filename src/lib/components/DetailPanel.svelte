<script lang="ts">
  import type { DetailPanelButton } from './detailpanel'
  import { Icon } from '@dosgato/dialog'
  import { eq } from '@txstate-mws/svelte-components'
  export let header: string
  export let button: DetailPanelButton|undefined = undefined
</script>


<div class="panel" use:eq>
  <div class="header">
    <div>{header}</div>
    {#if button}
      <button class="edit" on:click={button.onClick}><Icon icon={button.icon} hiddenLabel={button.hiddenLabel}/></button>
    {/if}
  </div>
  <div class="body">
    <slot/>
  </div>
</div>

<style>
  .panel {
    width: 50%;
    margin: 0 auto 3em auto;
  }
  .header {
    background-color: #00507A;
    color: #fff;
    display: flex;
    justify-content: space-between;
    padding: 0.8em 1em;
    font-weight: bold;
    border-top-left-radius: 3px;
    border-top-right-radius: 3px;
  }
  .header button.edit {
    color: white;
    background: transparent;
    border: 0;
  }
  .body {
    border: 1px solid #666;
    border-top-width: 0;
    padding: 0.8em 1em;
    border-bottom-left-radius: 3px;
    border-bottom-right-radius: 3px;
  }
</style>
