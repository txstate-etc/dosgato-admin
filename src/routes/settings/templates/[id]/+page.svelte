<script lang="ts">
  import { DetailPageContent, DetailList, DetailPanel, DetailPanelSection, SortableTable, Accordion } from '$lib'
  import { base } from '$app/paths'
  import { _store as store } from './+page'
  import { sortby } from 'txstate-utils'
  const panelHeaderColor = '#BFF3FD'

  const templateInfo: Record<string, string> = {
    Name: $store.template.name,
    Key: $store.template.key,
    Type: $store.template.type
  }
  if ($store.template.type !== 'DATA') {
    templateInfo.Availability = $store.template.universal ? 'Universal' : 'Restricted'
  }
</script>

<DetailPageContent>
  <div class="layout">
    <DetailPanel header='Basic Information' headerColor={panelHeaderColor}>
      <DetailPanelSection>
        <DetailList columns={1} records={templateInfo} />
      </DetailPanelSection>
    </DetailPanel>
    {#if $store.template.type !== 'DATA'}
      <DetailPanel header='Components Available Within This Template' headerColor={panelHeaderColor}>
        <DetailPanelSection>
          {#each $store.template.areas as area}
            <h3>Components available in {area.name} area</h3>
              <SortableTable items={sortby(area.availableComponents, 'name')} headers = {[{ id: 'name', label: 'Template name', render: (item) => `<a href="${base}/settings/templates/${item.id}">${item.name}</a>` }, { id: 'key', label: 'Template key', get: 'key' }]} />
          {:else}
            <div>This template has no nested components.</div>
          {/each}
        </DetailPanelSection>
      </DetailPanel>
    {/if}
    {#if $store.template.type === 'COMPONENT'}
    <DetailPanel header="Page Templates That Allow This Component" headerColor={panelHeaderColor}>
      <DetailPanelSection>
        <SortableTable items={$store.pageTemplates} headers={[{ id: 'name', label: 'Name', render: (item) => `<a href="${base}/settings/templates/${item.id}">${item.name}</a>` }, { id: 'key', label: 'Template Key', get: 'key' }]} />
      </DetailPanelSection>
    </DetailPanel>
    {/if}
    {#if $store.template.type !== 'DATA' && !$store.template.universal}
      <DetailPanel header="Sites Allowed to Use This Template" headerColor={panelHeaderColor}>
        <DetailPanelSection>
          {#if $store.pagetrees.length > 0}
            <SortableTable items={$store.pagetrees} headers={[{ id: 'name', label: 'Name', get: 'name' }]} />
          {:else}
            <div>This restricted template is not permissioned for any sites.</div>
          {/if}
        </DetailPanelSection>
      </DetailPanel>
    {/if}
  </div>
</DetailPageContent>

<style>
  .layout {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
</style>
