<script lang="ts">
  import cubeOutline from '@iconify-icons/mdi/cube-outline'
  import { FormDialog, Icon } from '@dosgato/dialog'
  import { ScreenReaderOnly } from '@txstate-mws/svelte-components'
  import { templateRegistry } from '$lib/registry'
  import { api } from '$lib'
  import { onMount } from 'svelte'
  export let availableTemplateKeys: string[] // template keys for components available in the area

  async function onsubmit (state) {
  // TODO: on submit, want to bring up the dialog for the template that was just selected
  // or just add the content to the page if it has no dialog
    return { success: true, messages: [], data: {} }
  }

  const keysToNames: Record<string, string> = {}
  onMount(async () => {
    const availableTemplates = await api.getAvailableTemplateInfo(availableTemplateKeys)
    for (const template of availableTemplates) {
      keysToNames[template.key] = template.name
    }
  })

  let value: string|undefined = undefined

</script>

<FormDialog submit={onsubmit} title='Add Content' on:escape>
  <fieldset class="component-selector">
    <legend><ScreenReaderOnly>Select a content type</ScreenReaderOnly></legend>
    <div class="available-components">
      {#each availableTemplateKeys as key, i (key)}
        <input type="radio" id={`component-${i}`} bind:group={value} value={key} name="component">
        <label for={`component-${i}`}>
          <div class="component-card">
            <div class="icon-wrapper">
              <Icon icon={templateRegistry.getTemplate(key)?.icon ?? cubeOutline} width="6em"/>
            </div>
            <div class="template-name">{keysToNames[key] ?? key}</div>
          </div>
        </label>
      {/each}
    </div>
  </fieldset>
  <!-- TODO: Do we want the position option to add the content at either the top or bottom? -->
</FormDialog>

<style>
  fieldset {
    border: 0;
  }
  .component-selector {
    padding: 1em;
    max-width: 1000px;
    margin: 0 auto;
  }
  .available-components {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    grid-gap: 3em 3em;
    place-content: center center;
    grid-auto-rows: 1fr;
  }
  :global([data-eq~="800px"]) .available-components {
    grid-template-columns: 1fr 1fr;
  }
  :global([data-eq~="600px"]) .available-components {
    grid-template-columns: 1fr;
  }

  input[type=radio] {
    opacity: 0;
    position: absolute;
  }
  .component-card {
    background-color: transparent;
    border: 3px solid #6a5638;
    border-radius: 5px;
    color: #363534;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2em 0;
  }
  .component-card:hover {
    background-color: #f4f1ed;
  }
  input[type="radio"]:checked + label .component-card {
    border-color: #3dbbdb;
  }
  .icon-wrapper {
    margin-bottom: 1em;
  }
</style>
