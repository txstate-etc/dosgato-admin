<script lang="ts">
  import { DetailList, DetailPageContent, DetailPanel, DetailPanelSection, getSiteIcon } from '$lib'
  import type { DashboardSiteDetailDisplay } from '$lib'
  import { Button, Icon } from '@dosgato/dialog'
  import eye from '@iconify-icons/ph/eye-bold'
  import clipboard from '@iconify-icons/ph/clipboard-fill'
  import tree from '@iconify-icons/ph/tree-structure-bold'

  export let data: { site: DashboardSiteDetailDisplay }
  const site = data.site

  const icon = getSiteIcon(site.launchState, 'PRIMARY')
</script>

<DetailPageContent>
  <div class="site-stats">
    <div class="top" class:launched={site.launchState === 'LAUNCHED'} class:prelaunch={site.launchState === 'PRELAUNCH'} class:decommissioned={site.launchState === 'DECOMMISSIONED'}>
      <div class="basic-info">
        <Icon {icon} />
        <div class="title-block">
          <h1 class="site-title">{site.name}</h1>
          <div class="url">
            <div class="label">Assigned URL:</div>
            <div class="value">{site.url?.prefix ?? 'None'}</div>
          </div>
          <div class="site-actions">
            <Button type="button"><Icon icon={eye} /> Preview in New Window</Button>
            {#if site.launched}<Button type="button"><Icon icon={clipboard} /> Copy Live URL</Button>{/if}
            <Button type="button"><Icon icon={tree} /> Reveal in Page Tree</Button>
          </div>
        </div>
      </div>
      <div>
        <div class="launch-state">{site.launchState === 'LAUNCHED' ? 'LIVE' : site.launchState === 'PRELAUNCH' ? 'SANDBOX' : 'INACTIVE'}</div>
      </div>
    </div>
    <div class="bottom">
      <div class="stats">
        <dl>
          <div class="full-width">
            <dt>Site Owner:</dt>
            <dd>{site.owner?.name ?? 'None'}</dd>
          </div>
          <div>
            <dt>Created:</dt>
            <dd>{site.createdAt}</dd>
          </div>
          <div>
            <dt>Live Pages:</dt>
            <dd>{site.publishedPages}</dd>
          </div>
          <div>
            <dt>Total Pages:</dt>
            <dd>{site.totalPages}</dd>
          </div>
        </dl>
      </div>
      <div class="owner-change">
        <!-- Button to request owner change -->
      </div>
    </div>
  </div>
  <DetailPanel header="Team Members" headerColor="#E5D1BD">
    <DetailPanelSection></DetailPanelSection>
  </DetailPanel>
</DetailPageContent>

<style>
  .site-stats {
    display: flex;
    flex-direction: column;
    border: 2px solid #808080;
    border-radius: 4px;
    margin-bottom: 2em;
  }
  .site-stats .top {
    display: flex;
    gap: 1em;
    padding: 1em;
  }
  .site-stats .top .launch-state {
    background-color: #fff;
    padding: calc(8 / 12 * 1em) 1em;
    border-radius: 4px;
    font-size: 0.75em;
    font-weight: 600;
  }
  .site-stats .top.launched {
    background-color: #BFF3FD;
  }
  .site-stats .top.launched .launch-state {
    color: #006699;
  }
  .site-stats .top.prelaunch {
    background-color: #F9DCDE;
  }
  .site-stats .top.prelaunch .launch-state {
    color: #E3284A;
  }
  .site-stats .top.decommissioned {
    background-color: #EBEBEB;
  }
  .site-stats .top.decommissioned .launch-state {
    color: #808080;
  }
  .site-stats .top .basic-info {
    display: flex;
    flex: 1;
    gap: 1em;
  }
  .site-stats .top .basic-info .title-block {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .site-stats .top .basic-info .site-title {
    margin: 0;
    font-size: 1.3em;
    font-weight: 400;
  }
  .site-stats .top .basic-info .url {
    display: flex;
    gap: 0.5em;
    font-size: 0.9em;
    color: #595959;
  }
  .site-stats .top .basic-info .site-actions {
    padding-top: 0.5em;
    display: flex;
    gap: 1em;
  }
  .site-stats .bottom {
    padding: 1em;
    display: flex;
    gap: 1em;
  }
  .site-stats .bottom .stats {
    flex: 1;
  }
  .site-stats .bottom .stats dl {
    display: flex;
    flex-wrap: wrap;
    row-gap: 1em;
    column-gap: 2em;
  }
  .site-stats .bottom .stats dl div {
    display: flex;
    gap: 0.5em;
  }
  .site-stats .bottom .stats dl div.full-width {
    flex: 1 1 100%;
  }
  .site-stats .bottom .stats dl div dt {
    font-weight: 600;
  }
  .site-stats .bottom .stats dl div dd {
    margin: 0;
  }
</style>