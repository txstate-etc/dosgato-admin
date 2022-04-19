<script lang="ts">
  import { Icon } from '@dosgato/dialog'
  import homeIcon from '@iconify-icons/mdi/home'
  import { Loading, resize, ResizeStore } from '@txstate-mws/svelte-components'
  import { afterUpdate, beforeUpdate, onDestroy, onMount, setContext } from 'svelte'
  import { hashid } from 'txstate-utils'
  import TreeNode from './TreeNode.svelte'
  import { TreeStore, TREE_STORE_CONTEXT } from './treestore'
  import type { DragEligibleFn, DropEligibleFn, DropHandlerFn, DropEffectFn, FetchChildrenFn, TreeHeader, TreeItemFromDB, TypedTreeItem } from './treestore'

  type T = $$Generic<TreeItemFromDB>

  interface $$Slots {
    default: {
      item: TypedTreeItem<T>
      level: number
      isSelected: boolean
    }
    breadcrumb: {
      item: TypedTreeItem<T>
      level: 0
      isSelected: undefined
    }
  }

  interface $$Events {
    choose: CustomEvent<T>
  }

  export let headers: TreeHeader<T>[]
  export let fetchChildren: FetchChildrenFn<T>|undefined = undefined
  export let dragEligible: DragEligibleFn<T>|undefined = undefined
  export let dropEligible: DropEligibleFn<T>|undefined = undefined
  export let dropHandler: DropHandlerFn<T>|undefined = undefined
  export let dropEffect: DropEffectFn<T>|undefined = undefined
  export let store = new TreeStore<T>(fetchChildren!, { dropHandler, dragEligible, dropEligible, dropEffect })
  setContext(TREE_STORE_CONTEXT, store)

  function gatherBreadcrumbs (..._: any) {
    const ret: TypedTreeItem<T>[] = []
    let p = $store.viewUnder?.parent
    while (p) {
      ret.push(p)
      p = p.parent
    }
    return ret.reverse()
  }

  $: breadcrumbs = gatherBreadcrumbs($store.viewUnder)

  function breadcrumbClick (item?: TypedTreeItem<T>) {
    return () => {
      store.viewUnder(item)
    }
  }

  function onDragEnd () {
    store.update(v => ({ ...v, dragging: false }))
  }

  onMount(async () => {
    document.addEventListener('dragend', onDragEnd)
    await store.refresh()
  })
  onDestroy(() => {
    document.removeEventListener('dragend', onDragEnd)
  })
  let hadFocus = false
  beforeUpdate(() => {
    hadFocus = !!store.treeElement?.contains(document.activeElement)
  })
  afterUpdate(() => {
    if ($store.focused?.id) {
      const el = document.getElementById(hashid($store.focused.id))
      if (el && hadFocus) {
        if (el !== document.activeElement) el.focus()
      } else if (hadFocus) store.focus($store.viewItems[0])
    } else store.focus($store.viewItems[0])
  })
</script>

{#if $store.viewUnder}
  <slot name="breadcrumbroot"><button class="reset" on:click={breadcrumbClick()}><Icon icon={homeIcon} inline /></button></slot>
  {#each breadcrumbs as crumb (crumb.id)}
    <span class="crumb-separator"> / </span>
    <button class="breadcrumb reset" on:click={breadcrumbClick(crumb)}><slot name="breadcrumb" item={crumb} level={0}>{crumb.id}</slot></button>
  {/each}
  <span class="crumb-separator"> / </span>
  <span class="breadcrumb selected"><slot name="breadcrumb" item={$store.viewUnder} level={0}>{$store.viewUnder.id}</slot></span>
{/if}
<div class="tree-header" aria-hidden="true">
  <div class="checkbox">&nbsp;</div>
  {#each headers as header, i (header.label)}
    <div id={header.id} style:width={header.defaultWidth}>{header.label}</div>
  {/each}
</div>
{#if $store.viewItems.length}
  <ul bind:this={store.treeElement} role="tree">
    {#each $store.viewItems as item, i (item.id)}
      <TreeNode
        {item}
        {headers}
        posinset={i + 1}
        setsize={$store.viewItems.length}
        level={item.level}
        prev={$store.viewItems[i - 1]}
        next={$store.viewItems[i + 1]}
        on:choose
        let:item
        let:isSelected>
        <slot {item} level={item.level - ($store.viewUnder ? $store.viewUnder.level : 0)} {isSelected} />
      </TreeNode>
    {/each}
  </ul>
{/if}
<Loading loading={!!$store.loading}></Loading>

<style>
  .tree-header {
    display: flex;
    align-items: center;
    background-color: var(--tree-head-bg, #555555);
    color: var(--tree-head-text, white);
    position: sticky;
    top: 0;
    left: 0;
    z-index: 1;
  }
  .tree-header > div {
    padding: 0.4em 0.3em;
    font-size: 0.9em;
  }
  .checkbox {
    width: 1.3em;
  }
  ul {
    padding: 0;
    margin: 0;
    list-style: none;
    font-size: 0.9em;
  }
</style>
