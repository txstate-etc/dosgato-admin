<script lang="ts">
  import { FieldSelect, FieldAutocomplete, FieldCheckbox, FieldText } from '@dosgato/dialog'
  import FormDialog from '$lib/components/FormDialog.svelte'
  import { SubForm, type Feedback, type SubmitResponse } from '@txstate-mws/svelte-forms'
  import type { PopupMenuItem } from '@txstate-mws/svelte-components'
  export let submit: (state: T) => Promise<SubmitResponse<T>>
  export let validate: undefined|((state: T) => Promise<Feedback[]>) = undefined
  export let name: string
  export let title: string
  export let siteChoices: PopupMenuItem[]
  export let preload: T|undefined = undefined
  import { onMount } from 'svelte'
  import { api } from '$lib'

  let dataTemplateChoices: PopupMenuItem[] = []

  onMount(async () => {
    const templates = await api.getTemplatesByType('DATA')
    dataTemplateChoices = templates.map(t => ({ label: t.name, value: t.id }))
  })

  type T = $$Generic
</script>

<FormDialog {submit} {validate} {name} {title} {preload} on:dismiss>
  <FieldAutocomplete path='siteId' label='Site' choices={siteChoices}/>
  <FieldText path='path' label='Path'/>
  <FieldSelect path='templateId' label='Template' choices={dataTemplateChoices}/>
  <SubForm path='grants'>
    <FieldCheckbox path='create' boxLabel='Create' defaultValue={false}/>
    <FieldCheckbox path='update' boxLabel='Update' defaultValue={false}/>
    <FieldCheckbox path='move' boxLabel='Move' defaultValue={false}/>
    <FieldCheckbox path='publish' boxLabel='Publish'  defaultValue={false}/>
    <FieldCheckbox path='unpublish' boxLabel='Unpublish'  defaultValue={false}/>
    <FieldCheckbox path='delete' boxLabel='Delete'  defaultValue={false}/>
    <FieldCheckbox path='undelete' boxLabel='Undelete' defaultValue={false}/>
  </SubForm>
</FormDialog>