<script lang="ts">
  import { resize, type ElementSize } from '@txstate-mws/svelte-components'
  import { derivedStore, Store } from '@txstate-mws/svelte-store'
  import { afterUpdate, beforeUpdate, onDestroy, onMount, setContext } from 'svelte'
  import { hashid } from 'txstate-utils'
  import TreeNode from './TreeNode.svelte'
  import { TreeStore, TREE_STORE_CONTEXT } from './treestore'
  import type { DragEligibleFn, CopyHandlerFn, DropEffectFn, FetchChildrenFn, MoveHandlerFn, TreeHeader, TreeItemFromDB } from './treestore'

  type T = $$Generic<TreeItemFromDB>

  interface $$Events {
    choose: CustomEvent<T>
  }

  export let headers: TreeHeader<T>[]
  export let nodeClass: ((itm: T) => string) | undefined = undefined
  export let singleSelect: boolean|undefined = undefined
  export let enableResize = false
  export let fetchChildren: FetchChildrenFn<T>|undefined = undefined
  export let dragEligible: DragEligibleFn<T>|undefined = undefined
  export let moveHandler: MoveHandlerFn<T>|undefined = undefined
  export let copyHandler: CopyHandlerFn<T>|undefined = undefined
  export let dropEffect: DropEffectFn<T>|undefined = undefined
  export let store = new TreeStore<T>(fetchChildren!, { copyHandler, dragEligible, dropEffect, moveHandler })
  setContext(TREE_STORE_CONTEXT, store)
  const { rootItems, headerOverride } = store

  let checkboxelement: HTMLElement
  const headerelements: HTMLElement[] = []
  const treeWidth = new Store<ElementSize>({})
  function calcHeaderSizes () {
    const headerSizes: string[] = []
    let totalFixed = checkboxelement?.offsetWidth ?? 0
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i]
      if (header.fixed || $headerOverride[header.id]) {
        headerSizes[i] = $headerOverride[header.id] ?? header.fixed
        totalFixed += headerelements[i]?.offsetWidth ?? 0
      }
    }
    const remainingWidth = ($treeWidth.clientWidth ?? 1024) - totalFixed
    const growHeaders = headers.filter((h, i) => !h.fixed && !$headerOverride[h.id] && headerelements[i]?.offsetWidth)
    const totalGrowShares = growHeaders.reduce((sum, h) => sum + (h.grow ?? 1), 0)
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i]
      if (!header.fixed && !$headerOverride[header.id] && headerelements[i]?.offsetWidth) {
        headerSizes[i] = `${remainingWidth * (header.grow ?? 1) / totalGrowShares}px`
      }
    }
    return headerSizes
  }
  const headerSizes = derivedStore([headerOverride, treeWidth], calcHeaderSizes)

  $: store.singleSelect = singleSelect

  function onDragEnd () {
    store.update(v => ({ ...v, dragging: false }))
  }

  let dragheaderid: string | undefined
  let dragheaderidx: number | undefined
  let dragtarget: HTMLElement | undefined
  let widthStart: number
  let mouseStart: number
  function headerDragStart (header: TreeHeader<T>, idx: number) {
    return (e: MouseEvent | TouchEvent) => {
      if (!enableResize) return
      dragtarget = headerelements[idx]
      if (!dragtarget.isConnected) dragtarget = undefined
      else {
        e.preventDefault()
        dragheaderid = header.id
        dragheaderidx = idx
        widthStart = dragtarget.clientWidth
        mouseStart = e instanceof TouchEvent ? e.touches[0].screenX : e.screenX
      }
    }
  }

  function headerDrag (e: MouseEvent | TouchEvent) {
    if (e instanceof TouchEvent && e.touches.length > 1) return
    if (dragheaderid && dragheaderidx != null && dragtarget?.isConnected) {
      for (let i = 0; i < dragheaderidx; i++) {
        store.setHeaderOverride(headers[i].id, $headerSizes[i])
      }
      const screenX = e instanceof TouchEvent ? e.touches[0].screenX : e.screenX
      store.setHeaderOverride(dragheaderid, `${widthStart - (mouseStart - screenX)}px`)
    }
  }

  function headerDragEnd () {
    dragtarget = undefined
    dragheaderid = undefined
  }

  function headerDragReset () {
    store.resetHeaderOverride()
  }

  onMount(async () => {
    document.addEventListener('dragend', onDragEnd)
    await store.refresh()
    if ($store.focused?.id) {
      const el = document.getElementById(hashid($store.focused.id))
      el?.scrollIntoView({ block: 'center' })
    }
    headerSizes.set(calcHeaderSizes()) // seems to need a kick on first mount
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

<svelte:window on:mouseup={headerDragEnd} />

<div class="tree-header" class:resizing={!!dragheaderid} use:resize={{ store: treeWidth }} aria-hidden="true" on:mouseup={headerDragEnd} on:touchend={headerDragEnd} on:mousemove={dragheaderid ? headerDrag : undefined} on:touchmove={dragheaderid ? headerDrag : undefined}>
  <div class="checkbox" bind:this={checkboxelement}>&nbsp;</div>
  {#each headers as header, i (header.label)}
    <div bind:this={headerelements[i]} id={header.id} class="tree-header-cell {header.id}" style:width={$headerOverride[header.id] ?? $headerSizes?.[i]}>{header.label}</div>
    {#if enableResize && i !== headers.length - 1}<div class="tree-separator" on:mousedown={headerDragStart(header, i)} on:touchstart={headerDragStart(header, i)} on:dblclick={headerDragReset}>&nbsp;</div>{/if}
  {/each}
</div>
{#if $rootItems?.length}
  <ul bind:this={store.treeElement} role="tree" class:resizing={!!dragheaderid} on:mousemove={dragheaderid ? headerDrag : undefined} on:touchmove={dragheaderid ? headerDrag : undefined} on:mouseup={headerDragEnd} on:touchend={headerDragEnd}>
    {#each $rootItems as item, i (item.id)}
      <TreeNode
        {item}
        {headers}
        {headerSizes}
        {nodeClass}
        posinset={i + 1}
        setsize={$rootItems.length}
        level={item.level}
        prev={$rootItems[i - 1]}
        next={$rootItems[i + 1]}
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
  .tree-header.resizing {
    cursor: col-resize;
  }
  .tree-header > .tree-header-cell {
    padding: 0.4em 0.3em;
  }
  .tree-header > .tree-separator {
    position: relative;
    width: 4px;
    margin-left: -4px;
    padding: 0.4em 0;
    cursor: col-resize;
  }
  .tree-header > .tree-separator:before {
    content: ' ';
    position: absolute;
    left: 1px;
    top: 0;
    width: 2px;
    height: 100%;
    background-color: var(--tree-head-text, white);
  }
  :global([data-eq~="650px"]) .tree-header {
    font-size: 0.8em;
  }
  .checkbox {
    min-width: 1.5em;
    max-width: 1.5em;
  }
  ul {
    padding: 0;
    margin: 0;
    list-style: none;
    font-size: 0.9em;
    container-type: inline-size;
  }
  :global([data-eq~="650px"]) ul {
    font-size: 0.8em;
  }
</style>
