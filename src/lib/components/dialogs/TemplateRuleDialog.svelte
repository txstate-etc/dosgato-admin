<script lang='ts'>
  import { api, messageForDialog } from '$lib'
  import { FieldCheckbox, FieldSelect, FormDialog } from '@dosgato/dialog'
  import type { PopupMenuItem } from '@txstate-mws/svelte-components'
  import { SubForm } from '@txstate-mws/svelte-forms'

  export let roleId: string
  export let preload: TemplateRuleDialogState|undefined = undefined
  export let templateChoices: PopupMenuItem[]

  const name = 'addtemplaterule'
  const title = 'Add Template Rule'

  interface TemplateRuleDialogState {
    templateId?: string
    grants : {
      use: boolean
    }
  }

  async function onAddTemplateRule (state: TemplateRuleDialogState) {
    if (state.templateId === 'alltemplates') state.templateId = undefined
    const resp = await api.addTemplateRule({ ...state, roleId })
    return {
      success: resp.success,
      messages: messageForDialog(resp.messages, ''),
      data: resp.success
        ? {
            templateId: resp.templateRule.template?.key,
            grants: resp.templateRule.grants
          }
        : state
    }
  }

  async function validateAdd (state: TemplateRuleDialogState) {
    if (state.templateId === 'alltemplates') state.templateId = undefined
    const resp = await api.addTemplateRule({ ...state, roleId }, true)
    return messageForDialog(resp.messages, '')
  }
</script>

<FormDialog submit={onAddTemplateRule} validate={validateAdd} {name} {title} {preload} on:escape on:saved>
  <FieldSelect path='templateId' label='Template' choices={[{ label: 'All Templates', value: 'alltemplates' }, ...templateChoices]} defaultValue='alltemplates' notNull/>
  <SubForm path='grants'>
    <FieldCheckbox path='use' boxLabel='Use' defaultValue={false}/>
  </SubForm>
</FormDialog>
