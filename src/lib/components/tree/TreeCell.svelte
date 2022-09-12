<script lang="ts">
  import { Icon } from '@dosgato/dialog'
  import { get } from 'txstate-utils'
  import type { TreeHeader, TreeItemFromDB, TypedTreeItem } from './treestore'

  type T = $$Generic<TreeItemFromDB>

  export let header: TreeHeader<T>
  export let item: TypedTreeItem<T>
  $: icon = typeof header.icon === 'function' ? header.icon(item) : header.icon
</script>

{#if header.icon}
  <span class="icon"><Icon {icon} inline width="1.5em" /></span>
{/if}
{#if header.component}
  <svelte:component this={header.component} {item} {header} />
{:else if header.render}
  {@html header.render(item)}
{:else if header.get}
  {#if get(item, header.get)}{get(item, header.get)}{:else}&nbsp;{/if}
{/if}
