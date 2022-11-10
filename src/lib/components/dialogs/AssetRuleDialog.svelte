<script lang="ts">
  import { FieldSelect, FieldText, FieldAutocomplete, FieldCheckbox, FormDialog } from '@dosgato/dialog'
  import { MessageType, SubForm } from '@txstate-mws/svelte-forms'
  import type { PopupMenuItem } from '@txstate-mws/svelte-components'
  import { api } from '$lib'
  import { messageForDialog } from '$lib/helpers'
  export let roleId: string
  export let siteChoices: PopupMenuItem[]
  export let preload: AssetRuleDialogState|undefined = undefined
  export let ruleId: string|undefined = undefined

  const modeChoices: PopupMenuItem[] = [
    { value: 'SELF', label: 'This path only' },
    { value: 'SELFANDSUB', label: 'This path and its subfolders' },
    { value: 'SUB', label: 'Only subfolders of this path' }
  ]

  const name = ruleId ? 'editassetrule' : 'addassetrule'
  const title = ruleId ? 'Edit Asset Rule' : 'Add Asset Rule'

  interface AssetRuleDialogState {
    siteId?: string
    path?: string
    mode?: string
    grants : {
      create: boolean
      update: boolean
      move: boolean
      delete: boolean
      undelete: boolean
    }
  }

  async function onAddAssetRule (state: AssetRuleDialogState) {
    const resp = await api.addAssetRule({ ...state, roleId })
    return {
      success: resp.success,
      messages: messageForDialog(resp.messages, ''),
      data: resp.success
        ? {
            siteId: resp.assetRule.site?.id,
            path: resp.assetRule.path,
            mode: resp.assetRule.mode,
            grants: resp.assetRule.grants
          }
        : state
    }
  }

  async function validateAdd (state: AssetRuleDialogState) {
    const resp = await api.addAssetRule({ ...state, roleId }, true)
    return messageForDialog(resp.messages, '')
  }

  async function onEditAssetRule (state: AssetRuleDialogState) {
    if (!ruleId) return { success: false, messages: [{ type: MessageType.ERROR, message: 'Something went wrong' }], data: state }
    const args = {
      ruleId,
      siteId: state.siteId,
      path: state.path,
      mode: state.mode,
      grants: {
        create: state.grants.create,
        update: state.grants.update,
        move: state.grants.move,
        delete: state.grants.delete,
        undelete: state.grants.undelete
      }
    }
    const resp = await api.editAssetRule(args)
    return {
      success: resp.success,
      messages: messageForDialog(resp.messages, 'args'),
      data: resp.success
        ? {
            siteId: resp.assetRule.site?.id,
            path: resp.assetRule.path,
            mode: resp.assetRule.mode,
            grants: resp.assetRule.grants
          }
        : undefined
    }
  }

  async function validateEdit (state: AssetRuleDialogState) {
    if (!ruleId) return [{ type: MessageType.ERROR, message: 'Something went wrong' }]
    const args = {
      ruleId,
      siteId: state.siteId,
      path: state.path,
      mode: state.mode,
      grants: {
        create: state.grants.create,
        update: state.grants.update,
        move: state.grants.move,
        delete: state.grants.delete,
        undelete: state.grants.undelete
      }
    }
    const resp = await api.editAssetRule(args, true)
    return messageForDialog(resp.messages, 'args')
  }

</script>
<FormDialog submit={ruleId ? onEditAssetRule : onAddAssetRule} validate={ruleId ? validateEdit : validateAdd} {name} {title} {preload} on:escape on:saved>
  <FieldAutocomplete path='siteId' label='Site' choices={siteChoices}/>
  <FieldText path='path' label='Path'/>
  <FieldSelect path='mode' label='Mode' choices={modeChoices}/>
  <SubForm path='grants'>
    <FieldCheckbox path='create' boxLabel='Create' defaultValue={false}/>
    <FieldCheckbox path='update' boxLabel='Update' defaultValue={false}/>
    <FieldCheckbox path='move' boxLabel='Move'  defaultValue={false}/>
    <FieldCheckbox path='delete' boxLabel='Delete'  defaultValue={false}/>
    <FieldCheckbox path='undelete' boxLabel='Undelete' defaultValue={false}/>
  </SubForm>
</FormDialog>
