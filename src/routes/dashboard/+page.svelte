<script lang="ts">

  import { ActionPanel, LoadIcon, api, titleCaseAccess, type DashboardSiteWithRoleSummary } from '$lib'
  import { onDestroy, setContext } from 'svelte'
  import { dashboardSitesStore, filtered } from '$lib/stores/dashboardSitesStore'
  import DashboardSiteCard from './DashboardSiteCard.svelte'
  import { unique } from 'txstate-utils'
  export let data: { sites: DashboardSiteWithRoleSummary[] }

  let availableRoles: Set<string> = new Set()
  let availableLaunchStates: Set<string> = new Set()

  const actionPanelTarget: { target: string | undefined } = { target: undefined }
  setContext('ActionPanelTarget', { getTarget: () => actionPanelTarget.target })

  async function fetchDashboardSites (): Promise<DashboardSiteWithRoleSummary[]> {
    const currentUser = await api.getSelf()
    if (!currentUser.me.id) return []
    const [sites, user] = await Promise.all([
      api.getDashboardSites(),
      api.getDashboardUser(currentUser.me.id)
    ])
    const allSites = unique([...sites, ...user.sitesOwned, ...user.sitesManaged], 'id')
    const userAccessBySite: Record<string, string[]> = allSites.reduce<Record<string, string[]>>((acc, site) => {
      acc[site.id] = []
      return acc
    }, {})
    for (const site of user.sitesOwned) {
      userAccessBySite[site.id] = ['Owner']
    }
    for (const site of user.sitesManaged) {
      if (!userAccessBySite[site.id]) {
        userAccessBySite[site.id] = []
      }
      userAccessBySite[site.id].push('Manager')
    }

    for (const role of user.roles) {
      // We are not interested in roles that are not associated with a particular site
      if (!role.site?.id || !role.access) continue // TODO: what do we do if the role has no access level set. is there a default?
      if (!userAccessBySite[role.site.id]) {
        userAccessBySite[role.site.id] = []
      }
      userAccessBySite[role.site.id].push(role.access ? titleCaseAccess[role.access] : '')
    }
    return allSites.map(site => ({ ...site, roleSummary: userAccessBySite[site.id] })) as DashboardSiteWithRoleSummary[]
  }

  const sitesPromise = fetchDashboardSites()
  sitesPromise.then(sites => {
    data.sites = sites
    dashboardSitesStore.setSites(sites)
    availableLaunchStates = new Set(sites.map(s => s.launchState))
    availableRoles = new Set(sites.flatMap(s => s.roleSummary))
  })

  onDestroy(() => {
    dashboardSitesStore.reset()
  })


</script>

<ActionPanel actions={[]} actionsTitle="Dashboard">
  <div class="dashboard-container">
    <div class="header">
      <div class="info">
        <div class="title">My Sites</div>
        <div class="count">{#await sitesPromise}&nbsp;{:then}{data.sites.length} total sites{/await}</div>
      </div>
      <div class="controls">
        <!-- Future controls can go here. Might want to use a store to manage the state of the controls and the sites showing -->
        <div class="control-group">
          <label>
            Sort by
            <select value={$dashboardSitesStore.sort} on:change={e => dashboardSitesStore.set({ ...$dashboardSitesStore, sort: e.target.value })}>
              <option value="alpha">Alphabetical</option>
              <optgroup label="Date">
                <option value="date-added">Date Added</option>
                <option value="last-edited">Last Edited</option>
              </optgroup>
              <option value="status">Status</option>
            </select>
          </label>
          <label>
            Filter by
            <select value={$dashboardSitesStore.filter} on:change={e => dashboardSitesStore.set({ ...$dashboardSitesStore, filter: e.target.value })}>
              <option value="all">All</option>
              {#if availableLaunchStates.has('LAUNCHED') || availableLaunchStates.has('PRELAUNCH') || availableLaunchStates.has('DECOMMISSIONED')}
                <optgroup label="Site Launch Status">
                  {#if availableLaunchStates.has('LAUNCHED')}<option value="active">Active (live)</option>{/if}
                  {#if availableLaunchStates.has('PRELAUNCH')}<option value="prelaunch">Prelaunch</option>{/if}
                  {#if availableLaunchStates.has('DECOMMISSIONED')}<option value="inactive">Inactive</option>{/if}
                </optgroup>
              {/if}
              {#if availableRoles.has('Owner') || availableRoles.has('Manager') || availableRoles.has('Editor') || availableRoles.has('Contributor') || availableRoles.has('Read-only')}
                <optgroup label="My Access Level">
                  {#if availableRoles.has('Owner')}<option value="owner">Owner</option>{/if}
                  {#if availableRoles.has('Manager')}<option value="manager">Manager</option>{/if}
                  {#if availableRoles.has('Editor')}<option value="editor">Editor</option>{/if}
                  {#if availableRoles.has('Contributor')}<option value="contributor">Contributor</option>{/if}
                  {#if availableRoles.has('Read-only')}<option value="readonly">Read Only</option>{/if}
                </optgroup>
              {/if}
            </select>
          </label>
        </div>
      </div>
    </div>
    {#await sitesPromise}
      <div class="loading-container">
        <LoadIcon size="3em" />
      </div>
    {:then}
      <ul class="sites">
        {#each $filtered as site}
          <li class="site-list-item"><DashboardSiteCard {site} /></li>
        {/each}
      </ul>
    {/await}
  </div>
</ActionPanel>

<style>
  .dashboard-container {
    padding: 1em;
    display: flex;
    flex-direction: column;
    gap: 1em;
  }
  .header .title {
    font-size: 1.3em;
  }
  .header .count {
    font-size: 0.75em;
    color: #767676;
  }
  .controls {
    display: flex;
    justify-content: flex-end;
  }
  .loading-container {
    display: flex;
    justify-content: center;
    padding: 3em 0;
  }
  .sites {
    display: flex;
    flex-wrap: wrap;
    gap: 1em;
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .sites .site-list-item {
    flex: 0 1 calc(33.3333% - 1em);
  }
  @media screen and (max-width: 64em) {
    .sites .site-list-item {
      flex: 1 1 calc(50% - 1em);
    }
  }
  @media screen and (max-width: 50em) {
    .sites .site-list-item {
      flex: 1 1 100%;
    }
  }
</style>
