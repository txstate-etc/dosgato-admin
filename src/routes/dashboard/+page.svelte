<script lang="ts">
  import { ActionPanel, actionPanelStore, type DashboardSiteWithRoleSummary } from '$lib'
  import { setContext } from 'svelte';
  import DashboardSiteCard from './DashboardSiteCard.svelte'
  export let data: { sites: DashboardSiteWithRoleSummary[] }

  const actionPanelTarget: { target: string | undefined } = { target: undefined }
  setContext('ActionPanelTarget', { getTarget: () => actionPanelTarget.target })
</script>

<ActionPanel actions={[]} actionsTitle="Dashboard">
  <div class="dashboard-container">
    <div class="header">
      <div class="info">
        <div class="title">My Sites</div>
        <div class="count">{data.sites.length} total sites</div>
      </div>
      <div class="controls">
        <!-- Future controls can go here. Might want to use a store to manage the state of the controls and the sites showing -->
      </div>
    </div>
    <ul class="sites">
      {#each data.sites as site}
        <li><DashboardSiteCard {site} /></li>
      {/each}
    </ul>
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
  .sites {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 1em;
    list-style: none;
    padding: 0;
    margin: 0;
  }
</style>