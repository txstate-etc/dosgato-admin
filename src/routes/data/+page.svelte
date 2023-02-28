<script lang="ts">
  import cubeOutline from '@iconify-icons/mdi/cube-outline'
  import { Icon } from '@dosgato/dialog'
  import { base } from '$app/paths'
  import { ActionPanel, templateRegistry, type TemplateListTemplate } from '$lib'

  export let data: { templates: TemplateListTemplate[] }
</script>

<ActionPanel actionsTitle="Data Types" actions={[]}>
  <div class="grid-wrapper">
    <div class="template-grid">
      {#each data.templates as template (template.key)}
        {@const tmpl = templateRegistry.getTemplate(template.key)}
        {#if tmpl}
          <a href={`${base}/data/${template.key}`}>
            <Icon icon={tmpl.icon ?? cubeOutline} width="6em"/>
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
  }
  :global([data-eq~="600px"]) .template-grid {
    grid-template-columns: 1fr;
  }
  .template-grid a {
    background-color: transparent;
    border: 3px solid #6a5638;
    border-radius: 5px;
    color: #363534;
    display: flex;
    flex-direction: column;
    align-items: center;
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
  }
</style>
