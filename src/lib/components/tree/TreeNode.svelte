<script lang="ts">
  import { Icon } from '@dosgato/dialog'
  import checkboxOutline from '@iconify-icons/mdi/checkbox-outline'
  import checkboxBlankOutline from '@iconify-icons/mdi/checkbox-blank-outline'
  import menuDown from '@iconify-icons/mdi/menu-down'
  import menuRight from '@iconify-icons/mdi/menu-right'
  import { modifierKey } from '@txstate-mws/svelte-components'
  import { createEventDispatcher, getContext } from 'svelte'
  import { hashid, toArray } from 'txstate-utils'
  import { type TreeStore, TREE_STORE_CONTEXT, type TypedTreeItem, type TreeItemFromDB, type TreeHeader } from './treestore'
  import LoadIcon from '../LoadIcon.svelte'
  import TreeCell from './TreeCell.svelte'

  type T = $$Generic<TreeItemFromDB>

  export let headers: TreeHeader<T>[]
  export let item: TypedTreeItem<T>
  export let posinset: number
  export let setsize: number
  export let level: number
  export let next: TypedTreeItem<T>|undefined
  export let prev: TypedTreeItem<T>|undefined
  export let parent: TypedTreeItem<T>|undefined = undefined

  const store = getContext<TreeStore<T>>(TREE_STORE_CONTEXT)
  const { dragging, draggable, selectedUndraggable, viewUnderStore, selected, focused, viewDepth } = store

  const dispatch = createEventDispatcher()
  let nodeelement: HTMLElement

  $: isSelected = $selected.has(item.id)
  $: leftLevel = ($viewUnderStore?.level ?? 0) + 1
  $: showChildren = !!item.open && !!item.children?.length && item.level - leftLevel < $viewDepth - 1
  $: hashedId = hashid(item.id)
  $: isDraggable = $draggable && store.dragEligible(item) && (!isSelected || !$selectedUndraggable)
  $: dropZone = $dragging && store.dropEligible(item, false)
  $: dropDisabled = $dragging && !dropZone
  $: dropAbove = $dragging && store.dropEligible(item, true)

  function onKeyDown (e: KeyboardEvent) {
    if (modifierKey(e) && !['Enter', ' '].includes(e.key)) return
    if (['Enter', ' '].includes(e.key)) {
      e.preventDefault()
      e.stopPropagation()
      if ($store.selected && $store.selected.size === 1 && $store.selected.has(item.id)) dispatch('choose', item)
      else {
        if (e.metaKey || e.altKey) {
          store.select(item, { clear: false, toggle: true })
        } else if (e.shiftKey) {
          shiftClick()
        } else {
          store.select(item, { clear: true })
        }
      }
    } else if (e.key === 'Escape') {
      store.deselect()
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      e.stopPropagation()
      if (item.open && item.children?.length) {
        const child = item.children[0]
        store.focus(child)
      } else {
        store.open(item)
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      e.stopPropagation()
      if (item.open) {
        store.close(item)
      } else if (parent) {
        store.focus(parent)
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      e.stopPropagation()
      const mynext = item.open && item.children?.length ? item.children[0] : next
      if (mynext) {
        store.focus(mynext)
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      e.stopPropagation()
      const anyprev = prev as any
      const myprev = anyprev?.open && anyprev.children?.length && (!parent || parent.children?.some(c => c.id === anyprev.id)) ? anyprev.children[anyprev.children.length - 1] : prev
      if (myprev) {
        store.focus(myprev)
      }
    } else if (e.key === '*') {
      e.preventDefault()
      e.stopPropagation()
      const toOpen = parent ? parent.children! : $store.viewItems
      for (const child of toOpen) {
        store.open(child).catch(console.error)
      }
    }
  }

  function shiftClick () {
    const treenodes: HTMLElement[] = Array.from(store.treeElement?.querySelectorAll('div[role="treeitem"]') ?? [])
    const selectedNodes = treenodes.filter(n => n.matches('.selected'))
    const firstSelected = selectedNodes[0]
    if (!firstSelected || (selectedNodes.length === 1 && firstSelected === nodeelement)) {
      return store.select(item, { toggle: true })
    }
    const lastSelected = selectedNodes[selectedNodes.length - 1]
    const selectingdownward = firstSelected.compareDocumentPosition(nodeelement) === Node.DOCUMENT_POSITION_FOLLOWING
    let selecting = false
    store.deselect(false)
    for (const node of treenodes) {
      if (selectingdownward && node === firstSelected) selecting = true
      if (!selectingdownward && node === nodeelement) selecting = true
      if (selecting) store.selectById(node.getAttribute('data-id')!, { notify: false, toggle: false })
      if (selectingdownward && node === nodeelement) selecting = false
      if (!selectingdownward && node === lastSelected) selecting = false
    }
    store.trigger()
  }

  function onClick (e: MouseEvent) {
    if (e.button > 0) return
    e.preventDefault()
    e.stopPropagation()
    if (e.metaKey || e.altKey || e.ctrlKey) {
      store.select(item, { clear: false, toggle: true })
    } else if (e.shiftKey) {
      shiftClick()
    } else {
      const wasFocused = $store.focused?.id === item.id
      store.select(item, { clear: true, toggle: false })
      if (item.open && wasFocused && !item.loading) store.close(item)
      else if (!item.open) store.open(item)
    }
  }
  function onCheckClick (e: MouseEvent) {
    if (e.button > 0) return
    e.preventDefault()
    e.stopPropagation()
    if (e.shiftKey) {
      shiftClick()
    } else {
      store.select(item, { clear: false, toggle: true })
    }
  }
  function onDblClick (e: MouseEvent) {
    if (modifierKey(e) || e.button > 0) return
    e.preventDefault()
    e.stopPropagation()
    if ($store.selected.size <= 1) dispatch('choose', item)
  }
  function onDragStart (e: DragEvent) {
    e.dataTransfer!.effectAllowed = 'copyMove'
    store.dragStart(item)
  }
  function onDragOver (e: DragEvent) {
    if (dropZone) {
      e.preventDefault()
      e.dataTransfer!.dropEffect = store.dropEffect(item, false)
    }
    return !dropZone
  }
  function onDragOverAbove (e: DragEvent) {
    if (dropAbove) {
      e.preventDefault()
      e.dataTransfer!.dropEffect = store.dropEffect(item, true)
    }
    return !dropAbove
  }
  let dragOver = 0
  let dragOverAbove = 0
  function onDrop (e: DragEvent) {
    e.preventDefault()
    dragOver = 0
    return store.drop(item, false)
  }
  function onDropAbove (e: DragEvent) {
    dragOverAbove = 0
    return store.drop(item, true)
  }
  function onDragEnter (e: DragEvent) {
    if (!dropZone) dragOver = 0
    else dragOver++
  }
  function onDragEnterAbove (e: DragEvent) {
    if (!dropAbove) dragOverAbove = 0
    else dragOverAbove++
  }
  function onDragLeave (e: DragEvent) {
    if (!dropZone) dragOver = 0
    else dragOver--
  }
  function onDragLeaveAbove (e: DragEvent) {
    if (!dropAbove) dragOverAbove = 0
    else dragOverAbove--
  }
  $: if ($dragging) {
    dragOver = 0
    dragOverAbove = 0
  }
</script>
<li>
  {#if dropAbove}
    <div class="drop-above"
      class:dragOverAbove
      on:dragenter={onDragEnterAbove}
      on:dragleave={onDragLeaveAbove}
      on:dragover={onDragOverAbove}
      on:drop={onDropAbove}
      style:left="{level + 1.3}em"
    ></div>
  {/if}
  <div
    id={hashedId}
    bind:this={nodeelement}
    class="tree-node"
    class:selected={isSelected}
    class:dragOver
    class:dropDisabled
    role="treeitem"
    data-id={item.id}
    draggable={isDraggable}
    tabindex={$focused && $focused.id === item.id ? 0 : -1}
    aria-level={level}
    aria-posinset={posinset}
    aria-setsize={setsize}
    aria-expanded={item.hasChildren ? item.open && !!item.children && !!item.children.length : undefined}
    aria-busy={item.loading}
    on:keydown={onKeyDown}
    on:click={onClick}
    on:dragstart={onDragStart}
    on:dragover={onDragOver}
    on:dragenter={onDragEnter}
    on:dragleave={onDragLeave}
    on:drop={onDrop}
    on:mousedown={e => { if (e.shiftKey) e.preventDefault() }}
    on:dblclick={onDblClick}
  >
    <div class="checkbox" on:click={onCheckClick}>
      <Icon icon={isSelected ? checkboxOutline : checkboxBlankOutline } width="1.15em" inline />
    </div>
    {#each headers as header, i (header.id)}
      <div
        class={(header.class ? toArray(header.class(item)) : []).concat(header.id).join(' ')}
        style:width={header.defaultWidth}
        style:padding-left={i === 0 ? `${level + 0.3}em` : undefined}
        class:left={i === 0}
      >
        {#if i === 0 && item.hasChildren}
          <span class="arrow"><Icon icon={item.open ? menuDown : menuRight} inline /></span>
        {/if}
        <TreeCell {header} {item} />
        {#if i === 0 && item.loading}
          <LoadIcon />
        {/if}
      </div>
    {/each}
  </div>
  {#if showChildren && item.children}
    <ul role="group">
      {#each item.children as child, i (child.id)}
        <svelte:self
          item={child}
          {headers}
          posinset={i + 1}
          setsize={item.children.length}
          level={child.level}
          prev={i === 0 ? item : item.children[i - 1]}
          next={i === item.children.length - 1 ? next : item.children[i + 1]}
          parent={item}
          on:choose
        />
      {/each}
    </ul>
  {/if}
</li>

<style>
  .tree-node {
    cursor: pointer;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    border-bottom: var(--tree-border, 1px dashed #aaaaaa);
    width: 100%;
    overflow: hidden;
  }
  .tree-node .checkbox {
    width: 1.3em;
  }
  .tree-node > div {
    padding: 0.6em 0.3em;
  }
  .tree-node > div.left {
    display: flex;
    align-items: center;
  }
  .tree-node > div.left .arrow {
    margin-left: -1.1em;
    margin-right: 0.1em;
  }
  .tree-node > div.left :global(.icon) {
    margin-right: 0.4em;
  }
  .tree-node.selected {
    background-color: var(--tree-selected, #f1f1f1);
    color: var(--tree-selected-text, inherit);
  }
  .tree-node.dragOver {
    background-color: var(--tree-droppable, #555555);
    color: var(--tree-droppable-text, white);
  }
  .tree-node.dropDisabled {
    opacity: 0.6;
  }
  .drop-above {
    position: absolute;
    top: -3px;
    left: 0;
    width: 100%;
    height: 6px;
  }
  .drop-above.dragOverAbove {
    background-color: var(--tree-droppable, #555555);
  }
  li {
    position: relative;
  }
  ul {
    padding: 0;
    margin: 0;
    list-style: none;
  }
</style>
