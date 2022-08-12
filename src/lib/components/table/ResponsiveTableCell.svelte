<script lang="ts">
  import { get } from 'txstate-utils'
  import type { ResponsiveTableHeader } from './responsivetable'
  import { Icon } from '@dosgato/dialog'

  export let header: ResponsiveTableHeader
  export let item: any
  $: icon = typeof header.icon === 'function' ? header.icon(item) : header.icon
</script>

{#if header.render}
  {@html header.render(item)}
{:else if header.icon}
  <span class="icon"><Icon icon={icon?.icon} hiddenLabel={icon?.hiddenLabel} inline /></span>
{:else if header.get}
  {#if get(item, header.get)}
    {get(item, header.get)}
  {:else}
    &nbsp;
  {/if}
{/if}