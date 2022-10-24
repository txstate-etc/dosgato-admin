<script lang="ts">
  import { Icon } from '@dosgato/dialog'
  import homeIcon from '@iconify-icons/mdi/home'
  import { Loading } from '@txstate-mws/svelte-components'
  import { afterUpdate, beforeUpdate, onDestroy, onMount, setContext } from 'svelte'
  import { hashid } from 'txstate-utils'
  import TreeNode from './TreeNode.svelte'
  import { TreeStore, TREE_STORE_CONTEXT } from './treestore'
  import type { DragEligibleFn, DropEligibleFn, DropHandlerFn, DropEffectFn, FetchChildrenFn, TreeHeader, TreeItemFromDB, TypedTreeItem } from './treestore'
  import TreeCell from './TreeCell.svelte'

  type T = $$Generic<TreeItemFromDB>

  interface $$Events {
    choose: CustomEvent<T>
  }

  export let headers: TreeHeader<T>[]
  export let singleSelect: boolean|undefined = undefined
  export let fetchChildren: FetchChildrenFn<T>|undefined = undefined
  export let dragEligible: DragEligibleFn<T>|undefined = undefined
  export let dropEligible: DropEligibleFn<T>|undefined = undefined
  export let dropHandler: DropHandlerFn<T>|undefined = undefined
  export let dropEffect: DropEffectFn<T>|undefined = undefined
  export let store = new TreeStore<T>(fetchChildren!, { dropHandler, dragEligible, dropEligible, dropEffect })
  setContext(TREE_STORE_CONTEXT, store)
  const { viewUnderStore, viewItems } = store

  $: store.singleSelect = singleSelect

  function gatherBreadcrumbs (..._: any) {
    const ret: TypedTreeItem<T>[] = []
    let p = $store.viewUnder?.parent
    while (p) {
      ret.push(p)
      p = p.parent
    }
    return ret.reverse()
  }

  $: breadcrumbs = gatherBreadcrumbs($viewUnderStore)

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
    if ($store.focused?.id) {
      const el = document.getElementById(hashid($store.focused.id))
      el?.scrollIntoView({ block: 'center' })
    }
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
      }
    }
  })
</script>

<Loading loading={!!$store.loading}></Loading>
{#if $viewUnderStore}
  <button class="reset" on:click={breadcrumbClick()}><Icon icon={homeIcon} inline /></button>
  {#each breadcrumbs as crumb (crumb.id)}
    <span class="crumb-separator"> / </span>
    <button class="breadcrumb reset" on:click={breadcrumbClick(crumb)}><TreeCell item={crumb} header={headers[0]} /></button>
  {/each}
  <span class="crumb-separator"> / </span>
  <span class="breadcrumb selected"><TreeCell item={$viewUnderStore} header={headers[0]} /></span>
{/if}
<div class="tree-header" aria-hidden="true">
  <div class="checkbox">&nbsp;</div>
  {#each headers as header, i (header.label)}
    <div id={header.id} class={header.id} style:width={header.defaultWidth}>{header.label}</div>
  {/each}
</div>
{#if $viewItems.length}
  <ul bind:this={store.treeElement} role="tree">
    {#each $viewItems as item, i (item.id)}
      <TreeNode
        {item}
        {headers}
        posinset={i + 1}
        setsize={$viewItems.length}
        level={item.level}
        prev={$viewItems[i - 1]}
        next={$viewItems[i + 1]}
        on:choose
      />
    {/each}
  </ul>
{/if}

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
    font-size: 0.9em;
  }
  .tree-header > div {
    padding: 0.4em 0.3em;
  }
  :global([data-eq~="650px"]) .tree-header {
    font-size: 0.8em;
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
  :global([data-eq~="650px"]) ul {
    font-size: 0.8em;
  }
</style>
