<script lang="ts" context="module">
  import type { Load } from '@sveltejs/kit'
  import pencilIcon from '@iconify-icons/mdi/pencil'
  import plusIcon from '@iconify-icons/mdi/plus'
  import deleteOutline from '@iconify-icons/mdi/delete-outline'
  import { Icon } from '@dosgato/dialog'

  export const load: Load = async ({ params }) => {
    await store.refresh(params.id)
    if (!store.roleFetched()) return { status: 404 }
    return {}
  }

  async function getRole (id: string) {
    const role = await api.getRoleById(id)
    return role
  }

  const store = new RoleDetailStore(getRole)
</script>

<script lang="ts">
  import { base } from '$app/paths'
  import { api, RoleDetailStore, DetailPanel } from '$lib'
  import { unique } from 'txstate-utils';

  $: groupIds = unique([...$store.role.directGroups.map(g => g.id), ...$store.role.indirectGroups.map(g => g.id)])

  function getUserGroups (userGroups) {
    // get the groups through which users have this role. Need to look at the users groups and find the ones that match this role's groups
    // get only the user's direct groups? Maybe. ed02 is in groups 4 and 3 directly and both those inherit the site 3 editor role from group 1.
    // both those should be listed, but the intermediate group 2 doesn't need to be listed.
    const relevantGroups = userGroups.filter(g => groupIds.includes(g.id))
    return relevantGroups.map(g => g.id).join(', ')
  }
</script>


<div class="back-link">
  <a href={`${base}/auth/roles/`}>
    Back to Role List
  </a>
</div>

<DetailPanel header='Basic Information' button={{ icon: pencilIcon, onClick: () => {} }}>
  <div class="row">
    <div class="label">Name:</div>
    <div class="value">{$store.role.name}</div>
  </div>
</DetailPanel>

<DetailPanel header='Groups'>
  <ul>
    {#each $store.role.directGroups as group (group.id)}
      <li class="flex-row">
        <a href={`${base}/auth/groups/${group.id}`}>{group.name}</a>
        <button on:click={() => { }}><Icon icon={deleteOutline} width="1.5em"/></button>
      </li>
    {/each}
    {#each $store.role.indirectGroups as group (group.id)}
      <li class="flex-row">
        <a href={`${base}/auth/groups/${group.id}`}>{group.name}</a>
        <div>{`Via ${group.parents.map(g => g.name).join(', ')}`}</div>
      </li>
    {/each}
  </ul>
</DetailPanel>

<DetailPanel header='Users'>
  <ul>
    {#each $store.role.directUsers as user (user.id)}
      <li class="flex-row">
        <a href={`${base}/auth/user/${user.id}`}>{user.name} ({user.id})</a>
        <button on:click={() => { }}><Icon icon={deleteOutline} width="1.5em"/></button>
      </li>
    {/each}
    {#each $store.role.usersThroughGroups as user (user.id)}
      <li class="flex-row">
        <a href={`${base}/auth/user/${user.id}`}>{user.name} ({user.id})</a>
        {`Via group ${getUserGroups(user.groups)}`}
      </li>
    {/each}
  </ul>
</DetailPanel>

<DetailPanel header='Asset Rules' button={{ icon: plusIcon, onClick: () => {} }}></DetailPanel>
<DetailPanel header='Data Rules' button={{ icon: plusIcon, onClick: () => {} }}></DetailPanel>
<DetailPanel header='Global Rules' button={{ icon: plusIcon, onClick: () => {} }}></DetailPanel>
<DetailPanel header='Page Rules' button={{ icon: plusIcon, onClick: () => {} }}></DetailPanel>
<DetailPanel header='Site Rules' button={{ icon: plusIcon, onClick: () => {} }}></DetailPanel>
<DetailPanel header='Template Rules' button={{ icon: plusIcon, onClick: () => {} }}></DetailPanel>

<style>
  .back-link {
    display: flex;
    justify-content: flex-end;
    font-size: 1.2em;
  }
  .row {
    display: flex;
    padding: 0.5rem 0;
  }
  .label {
    font-weight: bold;
    width: 25%;
  }
  ul {
    list-style: none;
    padding-left: 0;
  }
  li {
    border-bottom: 1px dashed #aaa;
    padding: 0.6em 0.3em;
  }
  li:first-child {
    padding-top: 0;
  }
  li.flex-row {
    display: flex;
    justify-content: space-between;
  }
  li.flex-row button {
    border: 0;
    padding: 0;
    background-color: transparent;
  }
</style>