<script lang="ts">
  import { FieldSelect, FieldAutocomplete, FieldCheckbox, FieldText, FormDialog } from '@dosgato/dialog'
  import { MessageType, SubForm } from '@txstate-mws/svelte-forms'
  import type { PopupMenuItem } from '@txstate-mws/svelte-components'
  import { onMount } from 'svelte'
  import { api, messageForDialog } from '$lib'

  export let siteChoices: PopupMenuItem[]
  export let roleId: string
  export let preload: DataRuleDialogState|undefined = undefined
  export let ruleId: string|undefined = undefined

  let dataTemplateChoices: PopupMenuItem[] = []

  const name = ruleId ? 'editdatarule' : 'adddatruale'
  const title = ruleId ? 'Edit Data Rule' : 'Add Data Rule'

  interface DataRuleDialogState {
    siteId?: string
    path?: string
    templateId?: string
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

  onMount(async () => {
    const templates = await api.getTemplatesByType('DATA')
    dataTemplateChoices = templates.map(t => ({ label: t.name, value: t.key }))
  })

  async function onAddDataRule (state: DataRuleDialogState) {
    const resp = await api.addDataRule({ ...state, roleId })
    return {
      success: resp.success,
      messages: messageForDialog(resp.messages, 'args'),
      data: resp.success
        ? {
            siteId: resp.dataRule.site?.id,
            path: resp.dataRule.path,
            templateId: resp.dataRule.template?.key,
            grants: resp.dataRule.grants
          }
        : undefined
    }
  }

  async function validateAdd (state: DataRuleDialogState) {
    const resp = await api.addDataRule({ ...state, roleId }, true)
    return messageForDialog(resp.messages, 'args')
  }

  async function onEditDataRule (state) {
    if (!ruleId) return { success: false, messages: [{ type: MessageType.ERROR, message: 'Something went wrong' }], data: state }
    const args = {
      ruleId,
      siteId: state.siteId,
      path: state.path,
      templateId: state.templateId,
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
    const resp = await api.editDataRule(args)
    return {
      success: resp.success,
      messages: messageForDialog(resp.messages, ''),
      data: resp.success
        ? {
            siteId: resp.dataRule.site?.id,
            path: resp.dataRule.path,
            template: resp.dataRule.template?.key,
            grants: resp.dataRule.grants
          }
        : state
    }
  }

  async function validateEdit (state: DataRuleDialogState) {
    if (!ruleId) return [{ type: MessageType.ERROR, message: 'Something went wrong' }]
    const args = {
      ruleId,
      siteId: state.siteId,
      path: state.path,
      templateId: state.templateId,
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
    const resp = await api.editDataRule(args, true)
    return messageForDialog(resp.messages, '')
  }
</script>

<FormDialog submit={ruleId ? onEditDataRule : onAddDataRule} validate={ruleId ? validateEdit : validateAdd} {name} {title} {preload} on:escape on:saved>
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
