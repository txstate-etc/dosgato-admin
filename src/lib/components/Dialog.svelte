<script lang="ts">
  import { Modal } from '@txstate-mws/svelte-components'
  import { createEventDispatcher } from 'svelte'
  import { randomid } from 'txstate-utils'
  import Button from './Button.svelte'
  const dispatch = createEventDispatcher()

  export let escapable = false
  export let initialfocus: string|undefined = 'div.actions button.primary'
  export let title = ''
  export let size: 'tiny'|'small'|'normal'|'large' = 'normal'
  export let cancelText: string|undefined = undefined
  export let continueText: string = 'Ok'

  export let labelid = randomid()
  export let descid = randomid()
</script>

<Modal {escapable} {initialfocus} hidefocus={false} on:dismiss>
  <section class="{size}">
    <header id={labelid}>
      {title}
    </header>
    <div id={descid} class="content">
      <slot></slot>
    </div>
    <footer class="actions">
      <slot name="buttons">
        {#if cancelText}
          <Button cancel describedby="{labelid} {descid}" on:click={() => dispatch('dismiss')}>{cancelText}</Button>
        {/if}
        <Button describedby="{labelid} {descid}" on:click={() => dispatch('continue')}>{continueText}</Button>
      </slot>
    </footer>
  </section>
</Modal>

<style>
  section {
    position: relative;
    background-color: white;
    border-radius: 0.5em;
    padding: 1em;
    overflow: hidden;
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
    padding: 1em;
    background-color: var(--dosgato-dialog-header-bg, #595959);
    color: var(--dosgato-dialog-header-text, white);
  }

  header, .content {
    margin-bottom: 1em;
  }

  .content {
    min-height: 5em;
    overflow: auto;
  }

  footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    flex-wrap: wrap;
  }

  footer > :global(*:not(:last-child)) {
    margin-right: 0.5em;
  }
</style>
