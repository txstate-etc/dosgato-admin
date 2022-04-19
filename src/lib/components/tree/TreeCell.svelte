<script lang="ts">
  import { Icon } from '@dosgato/dialog'
  import { get } from 'txstate-utils'
  import type { TreeHeader, TreeItemFromDB, TypedTreeItem } from './treestore'

  type T = $$Generic<TreeItemFromDB>

  export let header: TreeHeader<T>
  export let item: TypedTreeItem<T>
</script>

{#if header.icon}
  <span class="icon"><Icon icon={header.icon(item)} inline /></span>
{/if}
{#if header.component}
  <svelte:component this={header.component} {item} {header} />
{:else if header.render}
  {@html header.render(item)}
{:else if header.get}
  {#if get(item, header.get)}{get(item, header.get)}{:else}&nbsp;{/if}
{/if}
