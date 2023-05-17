<script lang='ts'>
  import { api, messageForDialog } from '$lib'
  import { FieldAutocomplete, FieldChoices, FormDialog } from '@dosgato/dialog'
  import type { PopupMenuItem } from '@txstate-mws/svelte-components'
  import { MessageType } from '@txstate-mws/svelte-forms'

  export let roleId: string
  export let siteChoices: PopupMenuItem[]
  export let preload: SiteRulePreload | undefined = undefined
  export let ruleId: string|undefined = undefined

  const name = ruleId ? 'editsiterule' : 'addsiterule'
  const title = ruleId ? 'Edit Site Rule' : 'Add Site Rule'

  interface SiteRulePreload {
    siteId?: string
    grants : {
      launch: boolean
      rename: boolean
      governance: boolean
      manageState: boolean
      delete: boolean
    }
  }

  interface SiteRuleDialogState {
    siteId?: string
    grants: string[]
  }

  function preloadToState (preload: SiteRulePreload | undefined) {
    if (!preload) return { grants: [] }
    const grants: string[] = []
    if (preload.grants.launch) grants.push('launch')
    if (preload.grants.rename) grants.push('rename')
    if (preload.grants.governance) grants.push('governance')
    if (preload.grants.manageState) grants.push('manageState')
    if (preload.grants.delete) grants.push('delete')
    return {
      ...preload,
      grants
    } as SiteRuleDialogState
  }

  function stateToPreload (state: SiteRuleDialogState) {
    const siteId = state.siteId
    return {
      siteId,
      grants: {
        launch: state.grants.includes('launch'),
        rename: state.grants.includes('rename'),
        governance: state.grants.includes('governance'),
        manageState: state.grants.includes('manageState'),
        delete: state.grants.includes('delete')
      }
    } as SiteRulePreload
  }

  async function onAddSiteRule (state: SiteRuleDialogState) {
    const resp = await api.addSiteRule({ ...stateToPreload(state), roleId })
    return {
      success: resp.success,
      messages: messageForDialog(resp.messages, ''),
      data: resp.success
        ? preloadToState({
          siteId: resp.siteRule.site?.id,
          grants: resp.siteRule.grants
        })
        : state
    }
  }

  async function validateAdd (state: SiteRuleDialogState) {
    const resp = await api.addSiteRule({ ...stateToPreload(state), roleId }, true)
    return messageForDialog(resp.messages, '')
  }

  async function onEditSiteRule (state: SiteRuleDialogState) {
    if (!ruleId) return { success: false, messages: [{ type: MessageType.ERROR, message: 'Something went wrong' }], data: state }
    const args = {
      ...stateToPreload(state),
      ruleId
    }
    const resp = await api.editSiteRule(args)
    return {
      success: resp.success,
      messages: messageForDialog(resp.messages, 'args'),
      data: resp.success
        ? preloadToState({
          siteId: resp.siteRule.site?.id,
          grants: resp.siteRule.grants
        })
        : undefined
    }
  }

  async function validateEdit (state: SiteRuleDialogState) {
    if (!ruleId) return [{ type: MessageType.ERROR, message: 'Something went wrong' }]
    const args = {
      ...stateToPreload(state),
      ruleId
    }
    const resp = await api.editSiteRule(args, true)
    return messageForDialog(resp.messages, 'args')
  }

  const choices = [
    { value: 'launch', label: 'Launch' },
    { value: 'rename', label: 'Rename' },
    { value: 'governance', label: 'Governance' },
    { value: 'manageState', label: 'Manage State' },
    { value: 'delete', label: 'Delete' }
  ]
</script>

<FormDialog submit={ruleId ? onEditSiteRule : onAddSiteRule} validate={ruleId ? validateEdit : validateAdd} {name} {title} preload={preloadToState(preload)} on:escape on:saved>
  <FieldAutocomplete path='siteId' label='Site' choices={siteChoices}/>
  <FieldChoices path='grants' {choices} leftToRight label="Permissions"/>
</FormDialog>
