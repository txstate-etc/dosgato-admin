<script lang="ts">
  import { Accordion, type SiteTemplate, type TemplateListTemplate } from '$lib'
  import SortableTable from '$lib/components/table/SortableTable.svelte'
  import pencilIcon from '@iconify-icons/mdi/pencil'
  import deleteIcon from '@iconify-icons/mdi/trash-can-outline'
  import { createEventDispatcher } from 'svelte'
  export let type: string
  export let authorizedTemplates: SiteTemplate[]
  export let universalTemplates: string[]
  export let unAuthorizedTemplates: TemplateListTemplate[]

  const dispatch = createEventDispatcher()

  function hasBackground (total: number, index: number) {
    const inFirstColumn = index < total / 2
    if (inFirstColumn) return index % 2 === 0
    else {
      const secondColStartIndex = Math.ceil(total / 2)
      return (index - secondColStartIndex) % 2 === 0
    }
  }
</script>

<div class="templates">
  {#if authorizedTemplates.length}
    <SortableTable items={authorizedTemplates} headers={[
      { id: 'name', label: 'Template name', get: 'name' },
      { id: 'pagetrees', label: 'Authorized Pagetree(s)', render: (template) => (template.pagetrees.length ? template.pagetrees.join(', ') : 'All pagetrees') },
      { id: 'actions', label: 'Actions', hideHeader: true, actions: [{ icon: pencilIcon, label: 'Edit Authorized Pagetrees', hiddenLabel: (template) => `Edit authorized pagetrees for template ${template.name}`, onClick: (template) => { dispatch('editauth', { template }) }, allowed: (template) => template.permissions.assign }, { icon: deleteIcon, label: 'Remove Template Authorization', hiddenLabel: (template) => `Remove authorization for template ${template.name}.`, onClick: (template) => { dispatch('removeauth', { template }) }, allowed: (template) => template.permissions.assign }] }
    ]}/>
  {:else}
    <span>No {type} templates have been authorized for this site.</span>
  {/if}

  <Accordion title={`Universal ${type} templates`}>
    {#if universalTemplates.length}
      <div class="wrapper">
        <ul class="universal-templates" style={`grid-template-rows: repeat(${Math.ceil(universalTemplates.length / 2)}, 1fr)`}>
          {#each universalTemplates as template, index}
            <li class={hasBackground(universalTemplates.length, index) ? 'bg' : ''}>
              {template}
            </li>
          {/each}
        </ul>
      </div>
    {:else}
      <span>No universal {type} templates found.</span>
    {/if}
  </Accordion>

  <Accordion title={`Non-authorized ${type} templates`}>
    {#if unAuthorizedTemplates.length}
      <SortableTable items={unAuthorizedTemplates} headers={[
        { id: 'name', label: 'Template name', get: 'name' },
        { id: 'actions', label: 'Actions', hideHeader: true, actions: [{ icon: pencilIcon, label: 'Authorize for pagetrees', hiddenLabel: (template) => `Authorize template ${template.name} for pagetrees`, onClick: (template) => { dispatch('addtemplate', { template }) }, allowed: (template) => template.permissions.assign }] }
      ]}/>
    {:else}
      <span>No other {type} templates found.</span>
    {/if}
  </Accordion>
</div>
<style>
  .templates {
    display: flex;
    flex-direction: column;
    row-gap: 1em;
  }
  ul {
    list-style: none;
    padding-left: 0;
  }
  li {
    border-bottom: 1px dashed #aaa;
    padding: 0.6em 0em;
  }
  .universal-templates {
    display: grid;
    grid-auto-flow: column;
    grid-template-columns: 1fr 1fr;
    column-gap: 20%;
  }

  [data-eq~="600px"] .wrapper .universal-templates {
    display: flex;
    flex-direction: column;
  }
</style>
