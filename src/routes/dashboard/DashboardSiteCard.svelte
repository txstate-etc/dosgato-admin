<script lang="ts">
  import { base } from '$app/paths'
  import { getSiteIcon, type DashboardSiteWithRoleSummary, uiLog } from '$lib'
  import { Icon } from '@dosgato/dialog'
  export let site: DashboardSiteWithRoleSummary

  const icon = getSiteIcon(site.launchState, 'PRIMARY')
</script>

<a class="site-card" href={`${base}/dashboard/${site.id}`} on:click={() => uiLog.log({ eventType: 'DashboardSiteCard', action: 'ClickSiteCard' }, site.id)}>
  <div class="site-card-header" class:launched={site.launchState === 'LAUNCHED'} class:prelaunch={site.launchState === 'PRELAUNCH'} class:decommissioned={site.launchState === 'DECOMMISSIONED'}>
    <div class="left">
      <div class="top">
        <Icon {icon} width="1.5em" class={site.launchState.toLowerCase()}/>
        <!--TODO: Admin Lock-->
      </div>
      <div class="bottom">
        <div class="site-name">{site.name}</div>
        <div class="pagetree-count">{site.pagetrees?.length ?? 0} pagetree{site.pagetrees?.length === 1 ? '' : 's'}</div>
      </div>
    </div>
    <div class="status">
      <div class="launch-state">{site.launchState === 'LAUNCHED' ? 'LIVE' : site.launchState === 'PRELAUNCH' ? 'SANDBOX' : 'INACTIVE'}</div>
    </div>
  </div>
  <div class="site-card-details">
    {#if site.roleSummary.length}
      <div class="access-level">
        <div class="label">Access Level:</div>
        <div class="value">{site.roleSummary.join(', ')}</div>
      </div>
    {/if}
      <div class="url">
        <div class="label">Assigned URL:</div>
        <div class="value">{site.url ? `${site.url.host}${site.url.path}` : 'None'}</div>
      </div>
  </div>
</a>

<style>
  .site-card {
    display: flex;
    flex-direction: column;
    border: 1px solid #808080;
    border-radius: 4px;
    min-height: 230px;
    text-decoration: none;
    color: inherit;
    box-shadow: 4px 4px 0 0 #ddd;
  }
  .site-card-header {
    padding: 0.5em 1em 0;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
  }
  .site-card-header.launched {
    background-color: var(--dashboard-live-bg);
  }
  .site-card-header.launched .launch-state, .site-card-header.launched .pagetree-count {
    color: var(--dashboard-live-accent);
  }
  .site-card-header.prelaunch {
    background-color: var(--dashboard-sandbox-bg);
  }
  .site-card-header.prelaunch .launch-state, .site-card-header.prelaunch .pagetree-count {
    color: var(--dashboard-sandbox-accent);
  }
  .site-card-header.decommissioned .launch-state, .site-card-header.decommissioned .pagetree-count {
    color: var(--dashboard-archive-accent);
  }
  .site-card-header.decommissioned {
    background-color: var(--dashboard-archive-bg);
  }
  .site-card-header .left {
    min-height: 112px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding-bottom: 0.75em;
  }
  .site-card-header .status .launch-state {
    background-color: #fff;
    padding: calc(8 / 12 * 1em) 1em;
    font-size: 0.75em;
    font-weight: 600;
  }
  .site-card-header .site-name {
    font-size: 1em;
  }
  .site-card-header .top :global(.launched) {
    color: var(--dashboard-live-accent);
  }
  .site-card-header .top :global(.prelaunch svg path) {
    fill: var(--dashboard-sandbox-accent);
  }
  .site-card-header .top :global(.decommissioned) {
    color: var(--dashboard-archive-accent);
  }
  .site-card-header .pagetree-count {
    font-size: 0.75em;
    text-transform: uppercase;
    font-weight: 700;
  }
  .site-card-header .bottom {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .site-card-details {
    padding: 1em;
    font-size: 0.9em;
    display: flex;
    flex-direction: column;
    gap: 1em;
  }
  .site-card-details .access-level {
    display: flex;
    gap: 2px;
  }
  .site-card-details .label {
    font-weight: 600;
  }
</style>
