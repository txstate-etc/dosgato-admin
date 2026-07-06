<script lang="ts">
  import { uiLog } from '$lib'
  import { Icon } from '@dosgato/dialog'
  import type { IconifyIcon } from '@iconify/svelte'
  import { getContext } from 'svelte'
  import type { ResolvedPathname } from '$app/types'

  export let href: ResolvedPathname
  export let label: string
  export let icon: IconifyIcon
  export let size = '2.5em'

  const getSection: (() => string | undefined) | undefined = getContext('LogSection')

  function logInteraction () {
    const section = getSection?.()
    uiLog.log({ eventType: 'LabeledIcon', action: label, target: href, ...(section && { section }) })
  }
</script>

<a {href} style:max-width="calc(1.2 * {size})"
 on:click={() => logInteraction()} >
  <Icon {icon} width={size} />
  <div style:font-size="calc(0.3 * {size})">{label}</div>
</a>

<style>
  a {
    display: block;
    color: inherit;
    text-decoration: none;
    text-align: center;
    line-height: 0.75;
  }
</style>
