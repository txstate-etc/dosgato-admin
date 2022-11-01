<script lang="ts">
  import { Icon } from '@dosgato/dialog'
  import type { IconifyIcon } from '@iconify/svelte'

  export let label: string
  export let icon: IconifyIcon
  export let size = '2.5em'
  export let buttonelement: HTMLButtonElement | undefined = undefined
</script>

<button bind:this={buttonelement} class="reset" on:click style:max-width="calc(1.2 * {size})"><Icon {icon} width={size} /><div style:font-size="calc(0.3 * {size})">{label}</div></button>

<style>
  button {
    display: block;
    color: inherit;
    text-decoration: none;
    text-align: center;
    line-height: 0.75;
  }
</style>
