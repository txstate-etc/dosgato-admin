<script lang="ts">
  import { uiLog } from '$lib'
  import { Icon } from '@dosgato/dialog'
  import type { IconifyIcon } from '@iconify/svelte'
  import { createEventDispatcher, getContext } from 'svelte'

  export let label: string
  export let icon: IconifyIcon
  export let size = '2.5em'
  export let buttonelement: HTMLButtonElement | HTMLElement | undefined = undefined

  const dispatch = createEventDispatcher()
  const { getTarget } = getContext<any>('LabeledIconButtonTarget')

  function logInteraction () {
    uiLog.log({ eventType: 'LabeledIconButton', action: label }, getTarget())
    dispatch('click')
  }

</script>

<button type="button" bind:this={buttonelement} class="reset" style:max-width="calc(1.2 * {size})"
 on:click={() => logInteraction()} {...$$restProps}>
  <Icon {icon} width={size} />
  <div style:font-size="calc(0.3 * {size})">{label}</div>
</button>

<style>
  button {
    display: block;
    color: inherit;
    text-decoration: none;
    text-align: center;
    line-height: 0.75;
  }
</style>
