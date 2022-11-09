<script lang='ts'>
  import { api, messageForDialog } from '$lib'
  import FormDialog from '$lib/components/FormDialog.svelte'
  import { FieldAutocomplete, FieldCheckbox, FieldSelect, FieldText } from '@dosgato/dialog'
  import type { PopupMenuItem } from '@txstate-mws/svelte-components'
  import { MessageType, SubForm } from '@txstate-mws/svelte-forms'

  export let roleId: string
  export let siteChoices: PopupMenuItem[]
  export let preload: PageRuleDialogState|undefined = undefined
  export let ruleId: string|undefined = undefined

  const modeChoices: PopupMenuItem[] = [
    { value: 'SELF', label: 'This path only' },
    { value: 'SELFANDSUB', label: 'This path and its subfolders' },
    { value: 'SUB', label: 'Only subfolders of this path' }
  ]

  const pageTreeTypes: PopupMenuItem[] = [
    { value: 'PRIMARY', label: 'Primary' },
    { value: 'ARCHIVE', label: 'Archive' },
    { value: 'SANDBOX', label: 'Sandbox' }
  ]

  const name = ruleId ? 'editpagerule' : 'addpagerule'
  const title = ruleId ? 'Edit Page Rule' : 'Add Page Rule'

  interface PageRuleDialogState {
    siteId?: string
    pagetreeType?: string
    path?: string
    mode?: string
    grants : {
      create: boolean
      update: boolean
      move: boolean
      publish: boolean
      unpublish: boolean
      delete: boolean
      undelete: boolean
    }
  }

  async function onAddPageRule (state: PageRuleDialogState) {
    const resp = await api.addPageRule({ ...state, roleId })
    return {
      success: resp.success,
      messages: messageForDialog(resp.messages, ''),
      data: resp.success
        ? {
            siteId: resp.pageRule.site?.id,
            pagetreeType: resp.pageRule.pagetreeType,
            path: resp.pageRule.path,
            mode: resp.pageRule.mode,
            grants: resp.pageRule.grants
          }
        : state
    }
  }

  async function validateAdd (state: PageRuleDialogState) {
    const resp = await api.addPageRule({ ...state, roleId }, true)
    return messageForDialog(resp.messages, '')
  }

  async function onEditPageRule (state: PageRuleDialogState) {
    if (!ruleId) return { success: false, messages: [{ type: MessageType.ERROR, message: 'Something went wrong' }], data: state }
    const args = {
      ruleId,
      siteId: state.siteId,
      pagetreeType: state.pagetreeType,
      path: state.path,
      mode: state.mode,
      grants: {
        create: state.grants.create,
        update: state.grants.update,
        move: state.grants.move,
        publish: state.grants.publish,
        unpublish: state.grants.unpublish,
        delete: state.grants.delete,
        undelete: state.grants.undelete
      }
    }
    const resp = await api.editPageRule(args)
    return {
      success: resp.success,
      messages: messageForDialog(resp.messages, 'args'),
      data: resp.success
        ? {
            siteId: resp.pageRule.site?.id,
            pagetreeType: resp.pageRule.pagetreeType,
            path: resp.pageRule.path,
            mode: resp.pageRule.mode,
            grants: resp.pageRule.grants
          }
        : undefined
    }
  }

  async function validateEdit (state: PageRuleDialogState) {
    if (!ruleId) return [{ type: MessageType.ERROR, message: 'Something went wrong' }]
    const args = {
      ruleId,
      pagetreeType: state.pagetreeType,
      path: state.path,
      mode: state.mode,
      grants: {
        create: state.grants.create,
        update: state.grants.update,
        move: state.grants.move,
        publish: state.grants.publish,
        unpublish: state.grants.unpublish,
        delete: state.grants.delete,
        undelete: state.grants.undelete
      }
    }
    const resp = await api.editPageRule(args, true)
    return messageForDialog(resp.messages, 'args')
  }
</script>

<FormDialog submit={ruleId ? onEditPageRule : onAddPageRule} validate={ruleId ? validateEdit : validateAdd} {name} {title} {preload} on:escape on:saved>
  <FieldAutocomplete path='siteId' label='Site' choices={siteChoices}/>
  <FieldSelect path='pagetreeType' label='Pagetree Type' choices={pageTreeTypes}/>
  <FieldText path='path' label='Path'/>
  <FieldSelect path='mode' label='Mode' choices={modeChoices}/>
  <SubForm path='grants'>
    <FieldCheckbox path='create' boxLabel='Create' defaultValue={false}/>
    <FieldCheckbox path='update' boxLabel='Update' defaultValue={false}/>
    <FieldCheckbox path='move' boxLabel='Move'  defaultValue={false}/>
    <FieldCheckbox path='publish' boxLabel='Publish'  defaultValue={false}/>
    <FieldCheckbox path='unpublish' boxLabel='Unpublish'  defaultValue={false}/>
    <FieldCheckbox path='delete' boxLabel='Delete'  defaultValue={false}/>
    <FieldCheckbox path='undelete' boxLabel='Undelete' defaultValue={false}/>
  </SubForm>
</FormDialog>
