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
    uiLog.log({ eventType: 'DataTemplatesMenu', action, target })
  }
</script>

<ActionPanel actionsTitle="Data Types" actions={[]}>
  <div class="grid-wrapper">
    <div class="template-grid">
      {#each data.templates as template (template.key)}
        {@const tmpl = templateRegistry.getTemplate(template.key)}
        {#if tmpl}
          <a href={`${base}/data/${template.key}`}
           on:click={() => logInteraction(template.name, template.key)} >
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
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    grid-gap: 1.5em;
    place-content: center center;
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
    aspect-ratio: 1 / 1;
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
