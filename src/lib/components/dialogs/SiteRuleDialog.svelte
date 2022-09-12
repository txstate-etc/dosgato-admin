<script lang='ts'>
  import { api, messageForDialog } from '$lib'
  import FormDialog from '$lib/components/FormDialog.svelte'
  import { FieldAutocomplete, FieldCheckbox } from '@dosgato/dialog'
  import type { PopupMenuItem } from '@txstate-mws/svelte-components'
  import { MessageType, SubForm } from '@txstate-mws/svelte-forms'
  import { isNull } from 'txstate-utils'

  export let roleId: string
  export let siteChoices: PopupMenuItem[]
  export let preload: SiteRuleDialogState|undefined = undefined
  export let ruleId: string|undefined = undefined

  const name = ruleId ? 'editsiterule' : 'addsiterule'
  const title = ruleId ? 'Edit Site Rule' : 'Add Site Rule'

  interface SiteRuleDialogState {
    siteId?: string
    grants : {
      launch: boolean
      rename: boolean
      governance: boolean
      manageState: boolean
      delete: boolean
    }
  }

  async function onAddSiteRule (state: SiteRuleDialogState) {
    const resp = await api.addSiteRule({ ...state, roleId })
    return {
      success: resp.success,
      messages: [...resp.messages.filter(m => isNull(m.arg)), ...messageForDialog(resp.messages, 'args')],
      data: resp.success
        ? {
            siteId: resp.siteRule.site?.id,
            grants: resp.siteRule.grants
          }
        : undefined
    }
  }

  async function validateAdd (state: SiteRuleDialogState) {
    const resp = await api.addSiteRule({ ...state, roleId }, true)
    const wholeDialogMessages = resp.messages.filter(m => isNull(m.arg))
    return [...messageForDialog(resp.messages, 'args'), ...wholeDialogMessages]
  }

  async function onEditSiteRule (state: SiteRuleDialogState) {
    if (!ruleId) return { success: false, messages: [{ type: MessageType.ERROR, message: 'Something went wrong' }], data: state }
    const args = {
      ruleId,
      siteId: state.siteId,
      grants: {
        launch: state.grants.launch,
        rename: state.grants.rename,
        governance: state.grants.governance,
        manageState: state.grants.manageState,
        delete: state.grants.delete
      }
    }
    const resp = await api.editSiteRule(args)
    return {
      success: resp.success,
      messages: messageForDialog(resp.messages, 'args'),
      data: resp.success
        ? {
            siteId: resp.siteRule.site?.id,
            grants: resp.siteRule.grants
          }
        : undefined
    }
  }

  async function validateEdit (state: SiteRuleDialogState) {
    if (!ruleId) return [{ type: MessageType.ERROR, message: 'Something went wrong' }]
    const args = {
      ruleId,
      grants: {
        launch: state.grants.launch,
        rename: state.grants.rename,
        governance: state.grants.governance,
        manageState: state.grants.manageState,
        delete: state.grants.delete
      }
    }
    const resp = await api.editSiteRule(args, true)
    return messageForDialog(resp.messages, 'args')
  }
</script>

<FormDialog submit={ruleId ? onEditSiteRule : onAddSiteRule} validate={ruleId ? validateEdit : validateAdd} {name} {title} {preload} on:dismiss on:saved>
  <FieldAutocomplete path='siteId' label='Site' choices={siteChoices}/>
  <SubForm path='grants'>
    <FieldCheckbox path='launch' boxLabel='Launch' defaultValue={false}/>
    <FieldCheckbox path='rename' boxLabel='Rename' defaultValue={false}/>
    <FieldCheckbox path='governance' boxLabel='Governance' defaultValue={false}/>
    <FieldCheckbox path='manageState' boxLabel='Manage State' defaultValue={false}/>
    <FieldCheckbox path='delete' boxLabel='Delete' defaultValue={false}/>
  </SubForm>
</FormDialog>