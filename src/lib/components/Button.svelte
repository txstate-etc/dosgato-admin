<script lang="ts">
  export let type: 'button'|'submit' = 'button'
  export let disabled = false
  export let compact = false
  export let cancel = false
  export let destructive = false
  export let secondary = false
  export let describedby: string|undefined = undefined
  export let element: HTMLElement|undefined = undefined
</script>

<button {disabled} bind:this={element} {type} class="reset" class:cancel class:destructive class:secondary class:compact aria-describedby={describedby} on:click><slot /></button>

<style>
  button.reset {
    padding: 0.5em 1em;
    border-radius: 0.3em;
    background-color: var(--dosgato-btn-bg, #501214);
    color: var(--dosgato-btn-text, white);
  }
  button.reset.compact {
    padding: 0.1em;
  }

  button.reset:hover {
    background-color: var(--dosgato-btn-hover-bg, #622a2c);
    color: var(--dosgato-btn-hover-text, white);
  }

  button.secondary {
    background-color: var(--dosgato-btn-secondary-bg, rgb(18, 184, 134));
    color: var(--dosgato-btn-secondary-text, white);
  }
  button.secondary:hover {
    background-color: var(--dosgato-btn-secondary-hover-bg, rgb(12, 166, 120));
    color: var(--dosgato-btn-secondary-hover-text, white);
  }

  button.cancel {
    background-color: var(--dosgato-btn-cancel-bg, #757575);
    color: var(--dosgato-btn-cancel-text, white);
  }
  button.cancel:hover {
    background-color: var(--dosgato-btn-cancel-hover-bg, #595959);
    color: var(--dosgato-btn-cancel-hover-text, white);
  }

  button.destructive {
    background-color: var(--dosgato-btn-delete-bg, rgb(250, 82, 82));
    color: var(--dosgato-btn-delete-text, white);
  }
  button.destructive:hover {
    background-color: var(--dosgato-btn-delete-hover-bg, rgb(240, 62, 62));
    color: var(--dosgato-btn-delete-hover-text, white);
  }
</style>
