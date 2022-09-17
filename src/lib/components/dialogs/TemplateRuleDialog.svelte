<script lang='ts'>
  import { api, messageForDialog } from '$lib'
  import FormDialog from '$lib/components/FormDialog.svelte'
  import { FieldCheckbox, FieldSelect } from '@dosgato/dialog'
  import type { PopupMenuItem } from '@txstate-mws/svelte-components'
  import { SubForm } from '@txstate-mws/svelte-forms'
  import { onMount } from 'svelte'
  import { isNull } from 'txstate-utils'

  export let roleId: string
  export let preload: TemplateRuleDialogState|undefined = undefined

  let templateChoices: PopupMenuItem[] = []

  const name = 'addtemplaterule'
  const title = 'Add Template Rule'

  interface TemplateRuleDialogState {
    templateId?: string
    grants : {
      use: boolean
    }
  }

  async function onAddTemplateRule (state: TemplateRuleDialogState) {
    const resp = await api.addTemplateRule({ ...state, roleId })
    return {
      success: resp.success,
      messages: [...resp.messages.filter(m => isNull(m.arg)), ...messageForDialog(resp.messages, 'args')],
      data: resp.success
        ? {
            siteId: resp.templateRule.template?.id,
            grants: resp.templateRule.grants
          }
        : undefined
    }
  }

  async function validateAdd (state: TemplateRuleDialogState) {
    const resp = await api.addTemplateRule({ ...state, roleId }, true)
    const wholeDialogMessages = resp.messages.filter(m => isNull(m.arg))
    return [...messageForDialog(resp.messages, 'args'), ...wholeDialogMessages]
  }

  onMount(async () => {
    const templates = await api.getAllTemplates()
    templateChoices = templates.map(t => ({ label: t.name, value: t.key }))
  })
</script>

<FormDialog submit={onAddTemplateRule} validate={validateAdd} {name} {title} {preload} on:escape on:saved>
  <FieldSelect path='templateId' label='Template' choices={templateChoices}/>
  <SubForm path='grants'>
    <FieldCheckbox path='use' boxLabel='Use' defaultValue={false}/>
  </SubForm>
</FormDialog>
