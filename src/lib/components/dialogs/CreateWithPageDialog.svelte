<script lang="ts">
  import { ChooserClient, environmentConfig, templateRegistry } from '$lib'
  import { FieldSelect, FieldText, FormDialog } from '@dosgato/dialog'
  import type { PopupMenuItem } from '@txstate-mws/svelte-components'
  import { type SubmitResponse, type Feedback, FormStore, SubForm } from '@txstate-mws/svelte-forms'
  import type { CreateWithPageState } from './createwithpage'
  import { createEventDispatcher } from 'svelte'
  import { isNotNull } from 'txstate-utils'

  const dispatch = createEventDispatcher()

  export let title: string
  export let submit: (state: CreateWithPageState) => Promise<SubmitResponse<CreateWithPageState>>
  export let validate: undefined|((state: CreateWithPageState) => Promise<Feedback[]>) = undefined
  export let templateChoices: PopupMenuItem[]
  export let pagetreeId: string | undefined = undefined
  export let addName: boolean = true
  export let creatingSite: boolean = false
  const chooserClient = new ChooserClient(pagetreeId)
  const store = new FormStore<CreateWithPageState>(submitWrapper, validateWrapper)
  async function submitWrapper (state: CreateWithPageState) {
    if (!state.templateKey) return await submit(state)
    return await submit({ ...state, data: { ...state.data, areas: templateRegistry.getTemplate(state.templateKey!)?.defaultContent } })
  }
  async function validateWrapper (state: CreateWithPageState) {
    if (!state.templateKey) return await validate?.(state) ?? []
    return await validate?.({ ...state, data: { ...state.data, areas: templateRegistry.getTemplate(state.templateKey)?.defaultContent } }) ?? []
  }
  function escape () {
    store.reset()
    dispatch('escape')
  }
</script>

<FormDialog {chooserClient} {title} submit={submitWrapper} validate={validateWrapper} {store} on:escape={escape} on:saved let:data>
  {#if addName}
    <FieldText path='name' label={creatingSite ? 'Name' : 'URL Slug'} required/>
  {/if}
  <FieldSelect path='templateKey' label={`${creatingSite ? 'Root' : ''} Page Template`} placeholder='Select' choices={templateChoices} required/>
  <SubForm path='data' conditional={isNotNull($store.data?.templateKey)} let:value>
    {@const template = templateRegistry.getTemplate($store.data.templateKey ?? '')}
    {#if template && template.dialog}
      <svelte:component this={template.dialog} creating={true} data={value ?? {}} templateProperties={template.templateProperties} {environmentConfig} />
    {:else}
      <span>This content uses an unrecognized template. Please contact support for assistance.</span>
    {/if}
  </SubForm>
</FormDialog>
