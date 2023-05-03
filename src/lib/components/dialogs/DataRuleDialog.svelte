<script lang="ts">
  import { FieldSelect, FieldAutocomplete, FieldText, FormDialog, FieldChoices } from '@dosgato/dialog'
  import { MessageType } from '@txstate-mws/svelte-forms'
  import type { PopupMenuItem } from '@txstate-mws/svelte-components'
  import { onMount } from 'svelte'
  import { api, messageForDialog } from '$lib'
  import { pick } from 'txstate-utils'

  export let siteChoices: PopupMenuItem[]
  export let roleId: string
  export let preload: DataRulePreload | undefined = undefined
  export let ruleId: string|undefined = undefined

  let dataTemplateChoices: PopupMenuItem[] = []

  const name = ruleId ? 'editdatarule' : 'adddatruale'
  const title = ruleId ? 'Edit Data Rule' : 'Add Data Rule'

  interface DataRulePreload {
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

  interface DataRuleDialogState {
    siteId?: string
    path?: string
    templateId?: string
    grants: string[]
  }

  function preloadToState (preload: DataRulePreload | undefined) {
    if (!preload) return { grants: [] }
    const grants: string[] = []
    if (preload.grants.create) grants.push('create')
    if (preload.grants.update) grants.push('update')
    if (preload.grants.move) grants.push('move')
    if (preload.grants.publish || preload.grants.unpublish) grants.push('publish')
    if (preload.grants.delete) grants.push('delete')
    if (preload.grants.undelete) grants.push('undelete')
    return {
      ...preload,
      path: preload.path === '/' ? undefined : preload.path,
      grants
    } as DataRuleDialogState
  }

  function stateToPreload (state: DataRuleDialogState) {
    const { siteId, templateId, path } = pick(state, 'siteId', 'path', 'templateId')
    return {
      siteId,
      path,
      templateId,
      grants: {
        create: state.grants.includes('create'),
        update: state.grants.includes('update'),
        move: state.grants.includes('move'),
        publish: state.grants.includes('publish'),
        unpublish: state.grants.includes('publish'),
        delete: state.grants.includes('delete'),
        undelete: state.grants.includes('undelete')
      }
    } as DataRulePreload
  }

  onMount(async () => {
    const templates = await api.getTemplatesByType('DATA')
    dataTemplateChoices = templates.map(t => ({ label: t.name, value: t.key }))
  })

  async function onAddDataRule (state: DataRuleDialogState) {
    const resp = await api.addDataRule({ ...stateToPreload(state), roleId })
    return {
      success: resp.success,
      messages: messageForDialog(resp.messages, 'args'),
      data: resp.success
        ? preloadToState({
          siteId: resp.dataRule.site?.id,
          path: resp.dataRule.path,
          templateId: resp.dataRule.template?.key,
          grants: resp.dataRule.grants
        })
        : state
    }
  }

  async function validateAdd (state: DataRuleDialogState) {
    const resp = await api.addDataRule({ ...stateToPreload(state), roleId }, true)
    return messageForDialog(resp.messages, 'args')
  }

  async function onEditDataRule (state) {
    if (!ruleId) return { success: false, messages: [{ type: MessageType.ERROR, message: 'Something went wrong' }], data: state }
    const args = {
      ...stateToPreload(state),
      ruleId
    }
    const resp = await api.editDataRule(args)
    return {
      success: resp.success,
      messages: messageForDialog(resp.messages, ''),
      data: resp.success
        ? preloadToState({
          siteId: resp.dataRule.site?.id,
          path: resp.dataRule.path,
          templateId: resp.dataRule.template?.key,
          grants: resp.dataRule.grants
        })
        : undefined
    }
  }

  async function validateEdit (state: DataRuleDialogState) {
    console.log(state)
    if (!ruleId) return [{ type: MessageType.ERROR, message: 'Something went wrong' }]
    const args = {
      ruleId,
      siteId: state.siteId,
      path: state.path,
      templateId: state.templateId,
      grants: {
        create: state.grants.includes('create'),
        update: state.grants.includes('update'),
        move: state.grants.includes('move'),
        publish: state.grants.includes('publish'),
        unpublish: state.grants.includes('unpublish'),
        delete: state.grants.includes('delete'),
        undelete: state.grants.includes('undelete')
      }
    }
    const resp = await api.editDataRule(args, true)
    return messageForDialog(resp.messages, '')
  }

  const choices = [
    { value: 'create', label: 'Create' },
    { value: 'update', label: 'Update' },
    { value: 'move', label: 'Move' },
    { value: 'publish', label: 'Publish/Unpublish' },
    { value: 'delete', label: 'Delete' },
    { value: 'undelete', label: 'Restore' }
  ]
</script>

<FormDialog submit={ruleId ? onEditDataRule : onAddDataRule} validate={ruleId ? validateEdit : validateAdd} {name} {title} preload={preloadToState(preload)} on:escape on:saved>
  <FieldAutocomplete path='siteId' label='Site' choices={siteChoices}/>
  <FieldText path='path' label='Path'/>
  <FieldSelect path='templateId' label='Template' choices={dataTemplateChoices}/>
  <FieldChoices path='grants' {choices} leftToRight />
</FormDialog>
