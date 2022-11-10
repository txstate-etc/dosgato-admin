<script lang="ts">
  import { environmentConfig, templateRegistry } from '$lib'
  import { FieldSelect, FieldText, FormDialog } from '@dosgato/dialog'
  import type { PopupMenuItem } from '@txstate-mws/svelte-components'
  import { derivedStore } from '@txstate-mws/svelte-store'
  import { type SubmitResponse, type Feedback, FormStore, SubForm } from '@txstate-mws/svelte-forms'
  import type { CreateWithPageState } from './createwithpage'
  import { createEventDispatcher } from 'svelte'
  import { isNotNull } from 'txstate-utils'

  const dispatch = createEventDispatcher()

  export let title: string
  export let submit: (state: CreateWithPageState) => Promise<SubmitResponse<CreateWithPageState>>
  export let validate: undefined|((state: CreateWithPageState) => Promise<Feedback[]>) = undefined
  export let templateChoices: PopupMenuItem[]

  const store: FormStore = new FormStore<CreateWithPageState>(submit, validate)
  const tkey = derivedStore<string>(store, 'data.templateKey')
  function reactToTemplateKey (..._) {
    store.update(v => ({ ...v, data: { ...v.data, data: { ...v.data.data, areas: templateRegistry.getTemplate(v.data.templateKey)?.defaultContent } } }))
  }
  $: reactToTemplateKey($tkey)
  function escape () {
    store.reset()
    dispatch('escape')
  }
</script>

<FormDialog {title} {submit} {validate} {store} on:escape={escape} on:saved let:data>
  <FieldText path='name' label='Name' required/>
  <FieldSelect path='templateKey' label='Page Template' placeholder='Select' choices={templateChoices}/>
  <SubForm path='data' conditional={isNotNull($store.data?.templateKey)} let:value>
    {@const template = templateRegistry.getTemplate($store.data.templateKey)}
    {#if template && template.dialog}
      <svelte:component this={template.dialog} creating={true} data={value} templateProperties={template.templateProperties} {environmentConfig} />
    {:else}
      <span>This content uses an unrecognized template. Please contact support for assistance.</span>
    {/if}
  </SubForm>
</FormDialog>
