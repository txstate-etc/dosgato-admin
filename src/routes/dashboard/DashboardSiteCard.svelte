<script lang="ts">
  import { base } from '$app/paths'
  import { getSiteIcon, type DashboardSiteWithRoleSummary, uiLog } from '$lib'
  import { Icon } from '@dosgato/dialog'
  export let site: DashboardSiteWithRoleSummary

  const icon = getSiteIcon(site.launchState, 'PRIMARY')
</script>

<a class="site-card" href={`${base}/dashboard/${site.id}`} on:click={() => uiLog.log({ eventType: 'DashboardSiteCard', action: 'ClickSiteCard' }, site.id)}>
  <div class="site-card-header" class:launched={site.launchState === 'LAUNCHED'} class:prelaunch={site.launchState === 'PRELAUNCH'} class:decommissioned={site.launchState === 'DECOMMISSIONED'}>
    <div class="top">
      <Icon {icon} />
    </div>
    <div class="bottom">
      <div class="site-name">{site.name}</div>
      <div>
        <div class="launch-state">{site.launchState === 'LAUNCHED' ? 'LIVE' : site.launchState === 'PRELAUNCH' ? 'SANDBOX' : 'INACTIVE'}</div>
      </div>
    </div>
  </div>
  <div class="site-card-details">
    <dl>
      <div class="url">
        <dt>Assigned URL:</dt>
        <dd>{site.url?.prefix ?? 'None'}</dd>
      </div>
      <div>
        <dt>Roles:</dt>
        <dd>{site.roleSummary.join(', ')}</dd>
      </div>
    </dl>
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
    flex: 6;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 0.5em 1em;
  }
  .site-card-header.launched {
    background-color: #BFF3FD;
  }
  .site-card-header.launched .launch-state {
    color: #006699;
  }
  .site-card-header.prelaunch {
    background-color: #F9DCDE;
  }
  .site-card-header.prelaunch .launch-state {
    color: #E3284A;
  }
  .site-card-header.decommissioned {
    background-color: #EBEBEB;
  }
  .site-card-header.decommissioned .launch-state {
    color: #767676;
  }
  .site-card-header .site-name {
    font-size: 1em;
    width: 75%;
  }
  .site-card-header .bottom {
    position: relative;
    display: flex;
    gap: 0.5em;
    justify-content: space-between;
  }
  .site-card-header .bottom .launch-state {
    position: absolute;
    right: 0;
    bottom: calc(-8 / 12 * 1em); 
    background-color: #fff;
    padding: calc(8 / 12 * 1em) 1em;
    font-size: 0.75em;
  }
  .site-card-details {
    flex: 5;
    padding: 1em;
  }
  .site-card-details dl {
    margin: 0;
    font-size: 0.9em;
    display: flex;
    flex-direction: column;
    gap: 1.11111em;
  }
  .site-card-details dl div {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5em;
  }
  .site-card-details dl div.url dt {
    width: 100%;
  }
  .site-card-details dl dt {
    font-weight: 600;
  }
  .site-card-details dl dd {
    margin: 0;
  }
</style>