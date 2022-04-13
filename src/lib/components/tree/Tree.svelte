<script lang="ts">
  import { Icon } from '@dosgato/dialog'
  import homeIcon from '@iconify-icons/mdi/home'
  import { Loading } from '@txstate-mws/svelte-components'
  import { derivedStore } from '@txstate-mws/svelte-store'
  import { afterUpdate, beforeUpdate, onMount, setContext } from 'svelte'
  import { hashid } from 'txstate-utils'
  import TreeNode from './TreeNode.svelte'
  import { TreeStore, TREE_STORE_CONTEXT, type FetchChildrenFn, type TypedTreeItem, type TreeItemFromDB } from './treestore'

  type T = $$Generic<TreeItemFromDB>

  interface $$Slots {
    default: {
      item: TypedTreeItem<T>
      level: number
    }
    breadcrumb: {
      item: TypedTreeItem<T>
      level: 0
    }
  }

  export let fetchChildren: FetchChildrenFn<T>
  export let store = new TreeStore<T>(fetchChildren)
  setContext(TREE_STORE_CONTEXT, store)
  const breadcrumbs = derivedStore(store, (v) => {
    const ret: TypedTreeItem<T>[] = []
    let p = v.viewUnder?.parent
    while (p) {
      ret.push(p)
      p = p.parent
    }
    return ret.reverse()
  })

  function breadcrumbClick (item?: TypedTreeItem<T>) {
    return () => {
      store.viewUnder(item)
    }
  }

  onMount(async () => {
    await store.refresh()
  })
  let hadFocus = false
  let treeelement: HTMLElement
  beforeUpdate(() => {
    hadFocus = treeelement?.contains(document.activeElement)
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
  {#each $breadcrumbs as crumb (crumb.id)}
    <span class="crumb-separator"> / </span>
    <button class="breadcrumb reset" on:click={breadcrumbClick(crumb)}><slot name="breadcrumb" item={crumb} level={0}>{crumb.id}</slot></button>
  {/each}
  <span class="crumb-separator"> / </span>
  <span class="breadcrumb selected"><slot name="breadcrumb" item={$store.viewUnder} level={0}>{$store.viewUnder.id}</slot></span>
{/if}
<slot name="head" />
<Loading loading={!!$store.loading}>
  {#if $store.viewItems.length}
    <ul bind:this={treeelement} role="tree">
      {#each $store.viewItems as item, i (item.id)}
        <TreeNode
          {item}
          posinset={i + 1}
          setsize={$store.viewItems.length}
          level={item.level}
          prev={$store.viewItems[i - 1]}
          next={$store.viewItems[i + 1]}
          on:choose
          let:item>
          <slot {item} level={item.level - ($store.viewUnder ? $store.viewUnder.level : 0)} />
        </TreeNode>
      {/each}
    </ul>
  {/if}
</Loading>

<style>
  ul {
    padding: 0;
    margin: 0;
    list-style: none;
  }
</style>
