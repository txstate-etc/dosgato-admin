<script type="ts">
  import { Icon } from '@dosgato/dialog'
  import fileOutline from '@iconify-icons/mdi/file-outline'
  import fileRefreshOutline from '@iconify-icons/mdi/file-refresh-outline'
  import menuDown from '@iconify-icons/mdi/menu-down'
  import menuRight from '@iconify-icons/mdi/menu-right'
  import { DateTime } from 'luxon'
  import { api, ActionPanel, Tree, type TreeItemFromDB, GET_ROOT_PAGES, GET_TREE_PAGES, type TreePage } from '$lib'

  async function fetchChildren (item?: TreeItemFromDB) {
    const children = item ? await api.getSubPages(item.id) : await api.getRootPages()
    return children.map(p => ({ ...p, children: undefined, hasChildren: !!p.children.length, modifiedAt: DateTime.fromISO(p.modifiedAt) }))
  }
</script>

<ActionPanel actions={[]}>
  <Tree let:item let:level {fetchChildren} on:choose={() => alert('dbl click!')}>
    <svelte:fragment slot="breadcrumb" let:item>{item.name}</svelte:fragment>
    <div class="name" style:padding-left="{level - 0.15}em">
      {#if item.hasChildren}
        <span><Icon icon={item.open ? menuDown : menuRight} inline /></span>
      {/if}
      <Icon icon={item.loading ? fileRefreshOutline : fileOutline} inline/>
      {item.name}
    </div>
    <div class="modified">
      {item.modifiedAt.toFormat('LLL d yyyy h:mma')}
    </div>
    <div class="modifiedBy">
      {item.modifiedBy.id}
    </div>
  </Tree>
</ActionPanel>

<style>
  .name {
    width: 30%;
  }
  .modified {
    font-size: 0.9em;
    width: 25%;
  }
  .modifiedBy {
    font-size: 0.9em;
    width: 45%;
  }
  span {
    display: inline-block;
    margin-left: -0.85em;
    margin-right: -.4em;
  }
</style>
