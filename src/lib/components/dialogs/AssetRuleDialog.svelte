<script lang="ts">
  import { FieldSelect, FieldText, FieldAutocomplete, FieldCheckbox } from '@dosgato/dialog'
  import FormDialog from '$lib/components/FormDialog.svelte'
  import { SubForm, type Feedback, type SubmitResponse } from '@txstate-mws/svelte-forms'
  import type { PopupMenuItem } from '@txstate-mws/svelte-components'
  export let submit: (state: T) => Promise<SubmitResponse<T>>
  export let validate: undefined|((state: T) => Promise<Feedback[]>) = undefined
  export let name: string
  export let title: string
  export let siteChoices: PopupMenuItem[]
  export let preload: T|undefined = undefined

  console.log(preload)
  const modeChoices: PopupMenuItem[] = [
    { value: 'SELF', label: 'This path only' },
    { value: 'SELFANDSUB', label: 'This path and its subfolders' },
    { value: 'SUB', label: 'Only subfolders of this path' }
  ]

  type T = $$Generic
</script>
<FormDialog {submit} {validate} {name} {title} {preload} on:dismiss>
  <FieldAutocomplete path='siteId' label='Site' choices={siteChoices}/>
  <FieldText path='path' label='Path'/>
  <FieldSelect path='mode' label='Mode' choices={modeChoices}/>
  <SubForm path='grants'>
    <FieldCheckbox path='create' boxLabel='Create' defaultValue={false}/>
    <FieldCheckbox path='update' boxLabel='Update' defaultValue={false}/>
    <FieldCheckbox path='move' boxLabel='Move'  defaultValue={false}/>
    <FieldCheckbox path='delete' boxLabel='Delete'  defaultValue={false}/>
    <FieldCheckbox path='undelete' boxLabel='Undelete' defaultValue={false}/>
  </SubForm>
</FormDialog>