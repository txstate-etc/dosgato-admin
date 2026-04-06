<script lang="ts">

  import { ActionPanel, LoadIcon, api, titleCaseAccess, type DashboardSiteWithRoleSummary } from '$lib'
  import { onDestroy, setContext } from 'svelte'
  import { dashboardSitesStore, filtered } from '$lib/stores/dashboardSitesStore'
  import DashboardSiteCard from './DashboardSiteCard.svelte'
  import { unique } from 'txstate-utils'
  import browserIcon from '@iconify-icons/ph/browser-fill'
  import usersIcon from '@iconify-icons/ph/users-three-fill'
  import newsIcon from '@iconify-icons/ph/newspaper-fill'
  import bulbIcon from '@iconify-icons/ph/lightbulb-fill'
  import buoyIcon from '@iconify-icons/ph/lifebuoy-bold'
  import bookIcon from '@iconify-icons/ph/book-fill'
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

  const actions = [
    {
      id: 'dashboard-things',
      actions: [
        { label: 'Manage Websites', icon: browserIcon, onClick: () => { window.location.href = 'https://gato.its.txst.edu/manage-website.html' } },
        { label: 'Manage Users', icon: usersIcon, onClick: () => { window.location.href = 'https://gato.its.txst.edu/manage-user-access.html' } }
      ]
    },
    {
      id: 'gato-cms-resources',
      actions: [
        { label: 'What\'s New in Gato CMS', icon: newsIcon, onClick: () => { window.location.href = 'https://gato.its.txst.edu/whats-new.html' } },
        { label: 'Submit a Feature Request', icon: bulbIcon, onClick: () => { window.location.href = 'https://gato.its.txst.edu/feature-request-form.html' } },
        { label: 'Report a Problem', icon: buoyIcon, onClick: () => { window.location.href = 'https://gato.its.txst.edu/get-help.html' } },
        { label: 'Self-Paced Training', icon: bookIcon, onClick: () => { window.location.href = 'https://canvas.txstate.edu/courses/2057568' } }
      ]
    }
  ]


</script>

<ActionPanel actions={actions} actionsTitle="Dashboard">
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
            <select value={$dashboardSitesStore.sort} on:change={e => dashboardSitesStore.set({ ...$dashboardSitesStore, sort: e.currentTarget.value })}>
              <optgroup label="Alphabetical">
                <option value="alpha-asc">Ascending (A-Z)</option>
                <option value="alpha-desc">Descending (Z-A)</option>
              </optgroup>
              <optgroup label="Date site created">
                <option value="creation-desc">Descending (newest - oldest)</option>
                <option value="creation-asc">Ascending (oldest - newest)</option>
              </optgroup>
              <optgroup label="Pages last edited">
                <option value="last-edited-desc">Descending (newest - oldest)</option>
                <option value="last-edited-asc">Ascending (oldest - newest)</option>
              </optgroup>
            </select>
          </label>
          <label>
            Filter by
            <select value={$dashboardSitesStore.filter} on:change={e => dashboardSitesStore.set({ ...$dashboardSitesStore, filter: e.currentTarget.value })}>
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
    display: flex;
    flex-direction: column;
    position: relative;
    container-type: inline-size;
  }
  .controls {
    display: flex;
    justify-content: flex-end;
  }
  .control-group {
    display: flex;
    gap: 0.5em;
  }
  @container (max-width: 500px) {
    .controls {
      justify-content: flex-start;
    }
    .control-group {
      flex-direction: column;
    }
  }
  .header {
    background-color: #757575;
    padding: 1em;
    color: #fff;
    position: sticky;
    top: 0;
    width: 100%;
  }
  .header .info {
    margin-bottom: 1em;
  }
  .header .title {
    font-size: 1.3em;
  }
  .header .count {
    font-size: 0.75em;
  }
  .loading-container {
    display: flex;
    justify-content: center;
    padding: 3em 0;
  }
  .sites {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 1em;
    list-style: none;
    padding: 1em;
    margin: 0;
  }
  @media screen and (max-width: 64em) {
    .sites {
      grid-template-columns: 1fr 1fr;
    }
  }
  @media screen and (max-width: 50em) {
    .sites {
      grid-template-columns: 1fr;
    }
  }
</style>
