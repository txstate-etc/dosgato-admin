<script lang="ts">
  import { Tab, Tabs } from '@dosgato/dialog'
  import { DetailPanel, DetailPanelSection } from '$lib'
  export let panelHeaderColor: string
  export let hasGroups: boolean
  const tabs = [
    { name: 'Roles' },
    { name: 'Groups' },
    { name: 'Users' }
  ]
</script>


<DetailPanel header="User Access" headerColor={panelHeaderColor}>
  <div class="desktop-layout">
    <DetailPanelSection>
      <slot name="roles" />
    </DetailPanelSection>
    {#if hasGroups}
      <DetailPanelSection>
        <slot name="groups" />
      </DetailPanelSection>
    {/if}
    <DetailPanelSection>
      <slot name="users" />
    </DetailPanelSection>
  </div>
  <div class="mobile-layout">
    <Tabs {tabs} accordionOnMobile={false}>
      <Tab name="Roles">
        <slot name="roles" />
      </Tab>
      <Tab name="Groups">
        {#if hasGroups}
          <slot name="groups"/>
        {:else}
          <span>No groups have been granted access to this site.</span>
        {/if}
      </Tab>
      <Tab name="Users">
        <slot name="users" />
      </Tab>
    </Tabs>
  </div>
</DetailPanel>

<style>
  .mobile-layout {
    display: none;
  }
  :global([data-eq~="500px"]) .desktop-layout {
    display: none;
  }
  :global([data-eq~="500px"]) .mobile-layout {
    display: block;
  }
</style>