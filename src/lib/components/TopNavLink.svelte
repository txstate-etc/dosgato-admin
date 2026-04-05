<script lang="ts">
  import { uiLog } from '$lib'
  import { Icon } from '@dosgato/dialog'
  import type { IconifyIcon } from '@iconify/svelte'
  import { getContext } from 'svelte'

  export let href: string
  export let label: string
  export let icon: IconifyIcon

  const getSection: (() => string | undefined) | undefined = getContext('LogSection')

  function logInteraction () {
    const section = getSection?.()
    uiLog.log({ eventType: 'TopNavLink', action: label, target: href, ...(section && { section }) })
  }
</script>

<a {href} on:click={() => logInteraction()} >
  <Icon {icon} width="1.5em"/>
  <div>{label}</div>
</a>

<style>
  a {
    display: flex;
    align-items: center;
    gap: 0.125em;
    color: inherit;
    text-decoration: none;
    text-align: center;
    font-size: 0.9em;
    line-height: 1;
    font-weight: 700;
    border-radius: 12px;
    height: 44px;
    padding: 0.25em 0.75em 0.25em 0.375em;
  }
</style>
