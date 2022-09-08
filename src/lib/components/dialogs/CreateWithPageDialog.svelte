<script lang="ts">
  import FormDialog from '$lib/components/FormDialog.svelte'
  import { templateRegistry } from '$lib'
  import { FieldSelect, FieldText } from '@dosgato/dialog'
  import type { PopupMenuItem } from '@txstate-mws/svelte-components'
  import { type SubmitResponse, type Feedback, FormStore, SubForm } from '@txstate-mws/svelte-forms'
  import type { CreateWithPageState } from './createwithpage'
  import { createEventDispatcher } from 'svelte'

  const dispatch = createEventDispatcher()

  export let title: string
  export let submit: (state: CreateWithPageState) => Promise<SubmitResponse<CreateWithPageState>>
  export let validate: undefined|((state: CreateWithPageState) => Promise<Feedback[]>) = undefined
  export let templateChoices: PopupMenuItem[]

  const store: FormStore = new FormStore<CreateWithPageState>(submit, validate)

  function dismiss () {
    store.reset()
    dispatch('dismiss')
  }
</script>

<FormDialog {title} {submit} {validate} {store} on:dismiss={dismiss}>
  <FieldText path='name' label='Name' required/>
  <FieldSelect path='templateKey' label='Page Template' placeholder='Select' choices={templateChoices}/>
  {#if $store.data?.templateKey?.length > 0}
    <SubForm path='data'>
      {@const template = templateRegistry.getTemplate($store.data.templateKey)}
      {#if template && template.dialog}
        <svelte:component this={template.dialog} {store}/>
      {:else}
        <span>This content uses an unrecognized template. Please contact support for assistance.</span>
      {/if}
    </SubForm>
    {/if}
</FormDialog>