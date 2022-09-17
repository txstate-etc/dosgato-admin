<script lang="ts">
  import { Modal } from '@txstate-mws/svelte-components'
  import { createEventDispatcher } from 'svelte'
  import { isNotBlank, randomid } from 'txstate-utils'
  import Button from './Button.svelte'
  const dispatch = createEventDispatcher()

  export let initialfocus: string|undefined = undefined
  export let title = ''
  export let size: 'tiny'|'small'|'normal'|'large' = 'normal'
  export let cancelText: string|undefined = undefined
  export let continueText: string = 'Ok'
  export let escapable = isNotBlank(cancelText)

  export let labelid = randomid()
  export let descid = randomid()
</script>

<Modal {escapable} {initialfocus} hidefocus={false} on:escape>
  <section class="{size}">
    <header id={labelid}>
      {title}
    </header>
    <div id={descid} class="content">
      <slot></slot>
    </div>
    <footer class="actions">
      <slot name="buttons">
        {#if isNotBlank(cancelText)}
          <Button cancel describedby="{labelid} {descid}" on:click={() => dispatch('escape')}>{cancelText}</Button>
        {/if}
        <Button class="primary" describedby="{labelid} {descid}" on:click={() => dispatch('continue')}>{continueText}</Button>
      </slot>
    </footer>
  </section>
</Modal>

<style>
  section {
    position: relative;
    background-color: #f4f4f4;
    border-radius: 0.5em;
    padding: 1em;
  }
  section.tiny {
    width: 30vw;
    min-width: 200px;
    max-width: 250px;
  }
  section.small {
    width: 50vw;
    min-width: 220px;
    max-width: 400px;
  }
  section.normal {
    width: 75vw;
    min-width: 250px;
    max-width: 650px;
  }
  section.large {
    width: 90vw;
    min-width: 300px;
    max-width: 1000px;
  }

  header {
    font-weight: bold;
    margin: -1em;
    margin-bottom: 0;
    padding: 1em;
    background-color: var(--dosgato-dialog-header-bg, #DDDDDD);
    color: var(--dosgato-dialog-header-text, black);
  }

  .content {
    margin: 0 -1em;
    padding: 1em;
    min-height: 5em;
    overflow: auto;
    background-color: var(--dosgato-dialog-content-bg, #f4f4f4);
  }

  footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    flex-wrap: wrap;
    background-color: var(--dosgato-dialog-footer-bg, #DDDDDD);
    margin: -1em;
    margin-top: 0;
    padding: 0.5em 1em;
  }

  footer > :global(*:not(:last-child)) {
    margin-right: 0.5em;
  }

  :global(.dialog-field-container) {
    background-color: transparent !important;
    border-bottom: 0px !important;
  }
</style>
