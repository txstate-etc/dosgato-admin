<script lang="ts">
  import cubeOutline from '@iconify-icons/mdi/cube-outline'
  import { Icon } from '@dosgato/dialog'
  import { base } from '$app/paths'
  import { ActionPanel, templateRegistry, type TemplateListTemplate, uiLog } from '$lib'
  import { setContext } from 'svelte'

  export let data: { templates: TemplateListTemplate[] }

  // TODO: Determine the target for  data templates page.
  const actionPanelTarget: { target: string | undefined } = { target: 'DataTemplates' }
  setContext('ActionPanelTarget', { getTarget: () => actionPanelTarget.target })

  function logInteraction (action: string, target: string) {
    uiLog.log({ eventType: 'DataTemplatesMenu', action }, target)
  }
</script>

<ActionPanel actionsTitle="Data Types" actions={[]}>
  <div class="grid-wrapper">
    <div class="template-grid">
      {#each data.templates as template (template.key)}
        {@const tmpl = templateRegistry.getTemplate(template.key)}
        {#if tmpl}
          <a href={`${base}/data/${template.key}`}
           on:click={() => logInteraction(template.name, `${base}/data/${template.key}`)} >
            <Icon icon={tmpl.icon ?? cubeOutline} height="50%"/>
            <div class="template-name">{template.name}</div>
          </a>
        {/if}
      {/each}
    </div>
  </div>
</ActionPanel>

<style>
  .grid-wrapper {
    padding: 1em;
    max-width: 1000px;
    margin: 0 auto;
  }
  .template-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    grid-gap: 3em 3em;
    place-content: center center;
    grid-auto-rows: 1fr;
  }
  :global([data-eq~="800px"]) .template-grid {
    grid-template-columns: 1fr 1fr;
    grid-gap: 2em 2em;
  }
  :global([data-eq~="250px"]) .template-grid {
    grid-template-columns: 1fr;
    grid-gap: 1em;
  }
  :global([data-eq~="800px"]) .template-grid a {
    padding: 1em 0;
  }
  .template-grid a {
    background-color: transparent;
    border: 3px solid #6a5638;
    border-radius: 5px;
    color: #363534;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2em 0;
    text-decoration: none;
  }
  .template-grid a:hover {
    background-color: #f4f1ed;
  }
  .template-grid a:focus {
    border-color: #3dbbdb;
  }
  .template-name {
    padding: 0.8em;
    text-align: center;
  }
</style>
