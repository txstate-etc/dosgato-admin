<script lang="ts">
  import { FieldCheckbox } from '@dosgato/dialog'
  import FormDialog from '$lib/components/FormDialog.svelte'
  import { MessageType, SubForm } from '@txstate-mws/svelte-forms'
  import { api, messageForDialog } from '$lib'
  export let roleId: string
  export let preload: GlobalRuleDialogState|undefined = undefined
  export let ruleId: string|undefined = undefined

  const name = ruleId ? 'editglobalrule' : 'addglobalrule'
  const title = ruleId ? 'Edit Global Rule' : 'Add Global Rule'

  interface GlobalRuleDialogState {
    grants : {
      manageAccess: boolean
      manageParentRoles: boolean
      createSites: boolean
      manageGlobalData: boolean
      viewSiteList: boolean
      manageTemplates: boolean
    }
  }

  async function onAddGlobalRule (state: GlobalRuleDialogState) {
    const resp = await api.addGlobalRule({ ...state, roleId })
    return {
      success: resp.success,
      messages: messageForDialog(resp.messages, 'args'),
      data: resp.success
        ? {
            grants: resp.globalRule.grants
          }
        : undefined
    }
  }

  async function validateAdd (state: GlobalRuleDialogState) {
    const resp = await api.addGlobalRule({ ...state, roleId }, true)
    return messageForDialog(resp.messages, 'args')
  }

  async function onEditGlobalRule (state: GlobalRuleDialogState) {
    if (!ruleId) return { success: false, messages: [{ type: MessageType.ERROR, message: 'Something went wrong' }], data: state }
    const args = {
      ruleId,
      grants: {
        manageAccess: state.grants.manageAccess,
        manageParentRoles: state.grants.manageParentRoles,
        createSites: state.grants.createSites,
        manageGlobalData: state.grants.manageGlobalData,
        viewSiteList: state.grants.viewSiteList,
        manageTemplates: state.grants.manageTemplates
      }
    }
    const resp = await api.editGlobalRule(args)
    return {
      success: resp.success,
      messages: messageForDialog(resp.messages, 'args'),
      data: resp.success
        ? {
            grants: resp.globalRule.grants
          }
        : undefined
    }
  }

  async function validateEdit (state: GlobalRuleDialogState) {
    if (!ruleId) return [{ type: MessageType.ERROR, message: 'Something went wrong' }]
    const args = {
      ruleId,
      grants: {
        manageAccess: state.grants.manageAccess,
        manageParentRoles: state.grants.manageParentRoles,
        createSites: state.grants.createSites,
        manageGlobalData: state.grants.manageGlobalData,
        viewSiteList: state.grants.viewSiteList,
        manageTemplates: state.grants.manageTemplates
      }
    }
    const resp = await api.editGlobalRule(args, true)
    return messageForDialog(resp.messages, 'args')
  }
</script>

<FormDialog submit={ruleId ? onEditGlobalRule : onAddGlobalRule} validate={ruleId ? validateEdit : validateAdd} {name} {title} {preload} on:escape on:saved>
  <SubForm path='grants'>
    <FieldCheckbox path='manageAccess' boxLabel='Manage Access' defaultValue={false}/>
    <FieldCheckbox path='manageParentRoles' boxLabel='Manage Parent Roles' defaultValue={false}/>
    <FieldCheckbox path='createSites' boxLabel='Create Sites'  defaultValue={false}/>
    <FieldCheckbox path='manageGlobalData' boxLabel='Manage Global Data'  defaultValue={false}/>
    <FieldCheckbox path='viewSiteList' boxLabel='View Site List' defaultValue={false}/>
    <FieldCheckbox path='manageTemplates' boxLabel='Mange Templates' defaultValue={false}/>
  </SubForm>
</FormDialog>
