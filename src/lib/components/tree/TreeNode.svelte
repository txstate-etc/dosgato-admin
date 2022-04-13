<script lang="ts">
  import { modifierKey } from '@txstate-mws/svelte-components'
  import { createEventDispatcher, getContext } from 'svelte'
  import { hashid } from 'txstate-utils'
  import { type TreeStore, TREE_STORE_CONTEXT, type TypedTreeItem, type TreeItemFromDB } from './treestore'

  type T = $$Generic<TreeItemFromDB>

  interface $$Slots {
    default: {
      item: TypedTreeItem<T>
    }
  }

  export let item: TypedTreeItem<T>
  export let posinset: number
  export let setsize: number
  export let level: number
  export let next: TypedTreeItem<T>|undefined
  export let prev: TypedTreeItem<T>|undefined
  export let parent: TypedTreeItem<T>|undefined = undefined

  const store = getContext<TreeStore<T>>(TREE_STORE_CONTEXT)
  const dispatch = createEventDispatcher()

  $: leftLevel = ($store.viewUnder?.level ?? 0) + 1
  $: showChildren = !!item.open && !!item.children?.length && item.level - leftLevel < $store.viewDepth - 1

  function onKeyDown (e: KeyboardEvent) {
    if (modifierKey(e)) return
    if (['Enter', ' '].includes(e.key)) {
      e.preventDefault()
      e.stopPropagation()
      if (item.id === $store.selected?.id) dispatch('choose', item)
      else store.select(item)
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

  let clickTimer
  function onClick (e) {
    if (modifierKey(e)) return
    e.preventDefault()
    e.stopPropagation()
    const wasFocused = $store.focused?.id === item.id
    store.select(item)
    clearTimeout(clickTimer)
    clickTimer = setTimeout(() => {
      if (item.open && wasFocused) store.close(item)
      else if (!item.open) store.open(item)
    }, 150)
  }
  function onDblClick (e) {
    if (modifierKey(e)) return
    e.preventDefault()
    e.stopPropagation()
    clearTimeout(clickTimer)
    dispatch('choose', item)
  }
</script>
<li>
  <div
    id={hashid(item.id)}
    class:selected={$store.selected && $store.selected.id === item.id}
    role="treeitem"
    tabindex={$store.focused && $store.focused.id === item.id ? 0 : -1}
    aria-level={level}
    aria-posinset={posinset}
    aria-setsize={setsize}
    aria-expanded={item.open && !!item.children && !!item.children.length}
    aria-busy={item.loading}
    on:keydown={onKeyDown}
    on:click={onClick}
    on:dblclick={onDblClick}
  >
    <slot {item} />
  </div>
  {#if showChildren && item.children}
    <ul role="group">
      {#each item.children as child, i (child.id)}
        <svelte:self
          item={child}
          posinset={i + 1}
          setsize={item.children.length}
          level={child.level}
          prev={i === 0 ? item : item.children[i - 1]}
          next={i === item.children.length - 1 ? next : item.children[i + 1]}
          parent={item} on:choose let:item><slot {item} /></svelte:self>
      {/each}
    </ul>
  {/if}
</li>

<style>
  div {
    cursor: pointer;
    display: flex;
    flex-wrap: wrap;
  }
  div.selected {
    background-color: #f1f1f1;
  }
  ul {
    padding: 0;
    margin: 0;
    list-style: none;
  }
</style>
