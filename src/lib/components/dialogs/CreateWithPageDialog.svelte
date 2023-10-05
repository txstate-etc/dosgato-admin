<!--
@component
Two dialogs in sequence used to create a page.
This component is also used when creating a site or pagetree, both of which require creating a root page.
-->
<script lang="ts">
  import { ChooserClient, ModalContextStore, environmentConfig, templateRegistry } from '$lib'
  import { Dialog, FieldHidden, FieldSelect, FieldText, FormDialog } from '@dosgato/dialog'
  import type { PopupMenuItem } from '@txstate-mws/svelte-components'
  import { type SubmitResponse, type Feedback, FormStore, SubForm, MessageType } from '@txstate-mws/svelte-forms'
  import type { CreateWithPageState } from './createwithpage'
  import { createEventDispatcher } from 'svelte'
  import { isNotNull } from 'txstate-utils'

  const dispatch = createEventDispatcher()

  /** dialog title: will be used for both dialogs if propertyDialogTitle is not provided */
  export let title: string
  /** title for second dialog, defaults to title */
  export let propertyDialogTitle: string = title
  /** The submit function needs the extra validateOnly parameter because we need to call the submit function in
  both dialogs, but only want to save the data after the second dialog. */
  export let submit: (state: CreateWithPageState, validateOnly: boolean) => Promise<SubmitResponse<CreateWithPageState>>
  export let validate: ((state: CreateWithPageState) => Promise<Feedback[]>)
  export let templateChoices: PopupMenuItem[]
  export let pagetreeId: string | undefined = undefined
  /** whether or not to add a name field to the first dialog. true when adding sites and pages, false when adding pagetrees because their root page name defaults to the site name */
  export let addName: boolean = true
  export let creatingSite: boolean = false

  const targetName = 'addpage-modal'
  type Modals = 'addpage-name' | 'addpage-properties'
  const modalContext = new ModalContextStore<Modals>('addpage-name', () => targetName)

  let nameDialogData: { name?: string, templateKey: string } | undefined = undefined

  const chooserClient = new ChooserClient(pagetreeId)
  const store = new FormStore<CreateWithPageState>(submitWrapper, validateWrapper)

  async function submitWrapper (state: CreateWithPageState) {
    if (!state.templateKey) {
      const resp = await submit(state, false)
      modalContext.logModalResponse(resp, targetName, { name: resp.data.name, templateKey: resp.data.templateKey })
      return resp
    }
    const resp = await submit({ ...state, data: { ...state.data, areas: templateRegistry.getTemplate(state.templateKey)?.genDefaultContent({ ...state.data, templateKey: state.templateKey }) } }, false)
    modalContext.logModalResponse(resp, targetName, { name: resp.data.name, templateKey: resp.data.templateKey })
    return resp
  }
  async function validateWrapper (state: CreateWithPageState) {
    if (!state.templateKey) return await validate?.(state) ?? []
    return await validate?.({ ...state, data: { ...state.data, areas: templateRegistry.getTemplate(state.templateKey)?.genDefaultContent({ ...state.data, templateKey: state.templateKey }) } }) ?? []
  }
  function onEscape () {
    store.reset()
    modalContext.onModalEscape()
    nameDialogData = undefined
    dispatch('escape')
  }

  async function onSaveNameAndTemplate (state: CreateWithPageState) {
    const resp = await validate(state)
    const messages = resp.filter(m => m.path === 'name' || m.path === 'templateKey')
    const ret: SubmitResponse<CreateWithPageState> = { success: true, data: state, messages }
    if (messages.some(m => m.type === MessageType.ERROR)) {
      ret.success = false
    } else {
      nameDialogData = state
    }
    modalContext.logModalResponse(ret, targetName, { name: ret.data.name, templateKey: ret.data.templateKey })
    return ret
  }

  function onNameAndTemplateComplete () {
    modalContext.setModal('addpage-properties')
  }

  async function validateNameAndTemplate (state: CreateWithPageState) {
    const messages = await validate(state)
    return messages.filter(m => m.path === 'name' || m.path === 'templateKey') ?? []
  }
</script>

{#if $modalContext.modal === 'addpage-name'}
  <FormDialog {chooserClient} {title} submit={onSaveNameAndTemplate} validate={validateNameAndTemplate} on:escape={onEscape} on:saved={onNameAndTemplateComplete}>
    {#if addName}
      <FieldText path='name' label={creatingSite ? 'Name' : 'URL Slug'} required/>
    {/if}
  <FieldSelect path='templateKey' label={`${creatingSite ? 'Root' : ''} Page Template`} placeholder='Select' choices={templateChoices} required/>
  </FormDialog>
{:else if $modalContext.modal === 'addpage-properties' && nameDialogData}
  {@const template = templateRegistry.getTemplate(nameDialogData.templateKey)}
  {#if template?.dialog}
    <FormDialog {chooserClient} title={propertyDialogTitle} submit={submitWrapper} validate={validateWrapper} {store} on:escape={onEscape} on:saved let:data>
      {#if addName}
        <FieldHidden path='name' value={nameDialogData.name} />
      {/if}
      <FieldHidden path='templateKey' value={nameDialogData.templateKey} />
      <SubForm path='data' conditional={isNotNull(nameDialogData.templateKey)} let:value>
        <svelte:component this={template.dialog} creating={true} data={value ?? {}} templateProperties={template.templateProperties} {environmentConfig} />
      </SubForm>
    </FormDialog>
  {:else}
    <Dialog title="Unrecognized Template" on:continue={onEscape} escapable on:escape={onEscape}>
      <span>This content uses an unrecognized template. Please contact support for assistance.</span>
    </Dialog>
  {/if}
{/if}
