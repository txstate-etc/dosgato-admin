<script lang="ts">
  import { FieldSelect, FieldText, FormDialog, FieldChoices } from '@dosgato/dialog'
  import { MessageType } from '@txstate-mws/svelte-forms'
  import type { PopupMenuItem } from '@txstate-mws/svelte-components'
  import { api } from '$lib'
  import { messageForDialog } from '$lib/helpers'
  import { pick } from 'txstate-utils'
  export let roleId: string
  export let siteChoices: PopupMenuItem[]
  export let preload: AssetRulePreload | undefined = undefined
  export let ruleId: string | undefined = undefined

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

  const name = ruleId ? 'editassetrule' : 'addassetrule'
  const title = ruleId ? 'Edit Asset Rule' : 'Add Asset Rule'

  interface AssetRuleDialogState {
    siteId?: string
    path?: string
    pagetreeType?: string
    mode?: string
    grants: string[]
  }

  interface AssetRulePreload {
    siteId?: string
    pagetreeType?: string
    path?: string
    mode?: string
    grants: {
      create: boolean
      update: boolean
      move: boolean
      delete: boolean
      undelete: boolean
    }
  }

  function convertState (state: AssetRuleDialogState) {
    const { siteId, pagetreeType, mode, path } = pick(state, 'siteId', 'pagetreeType', 'path', 'mode')
    return {
      siteId: siteId === 'allsites' ? undefined : siteId,
      pagetreeType,
      mode,
      path,
      grants: {
        create: state.grants.includes('create'),
        update: state.grants.includes('update'),
        move: state.grants.includes('move'),
        delete: state.grants.includes('delete'),
        undelete: state.grants.includes('undelete')
      }
    } as AssetRulePreload
  }

  function convertPreload (preload: AssetRulePreload | undefined) {
    if (!preload) return { grants: [] }
    const grants: string[] = []
    if (preload.grants.create) grants.push('create')
    if (preload.grants.update) grants.push('update')
    if (preload.grants.move) grants.push('move')
    if (preload.grants.delete) grants.push('delete')
    if (preload.grants.undelete) grants.push('undelete')
    return {
      ...preload,
      siteId: preload.siteId === undefined ? 'allsites' : preload.siteId,
      path: preload.path === '/' ? undefined : preload.path,
      grants
    } as AssetRuleDialogState
  }

  async function onAddAssetRule (state: AssetRuleDialogState) {
    const resp = await api.addAssetRule({ ...convertState(state), roleId })
    return {
      success: resp.success,
      messages: messageForDialog(resp.messages, ''),
      data: resp.success
        ? convertPreload({
          siteId: resp.assetRule.site?.id,
          pagetreeType: resp.assetRule.pagetreeType,
          path: resp.assetRule.path,
          mode: resp.assetRule.mode,
          grants: resp.assetRule.grants
        })
        : state
    }
  }

  async function validateAdd (state: AssetRuleDialogState) {
    const resp = await api.addAssetRule({ ...convertState(state), roleId }, true)
    return messageForDialog(resp.messages, '')
  }

  async function onEditAssetRule (state: AssetRuleDialogState) {
    if (!ruleId) return { success: false, messages: [{ type: MessageType.ERROR, message: 'Something went wrong' }], data: state }
    const args = {
      ruleId,
      ...convertState(state)
    }
    const resp = await api.editAssetRule(args)
    return {
      success: resp.success,
      messages: messageForDialog(resp.messages, 'args'),
      data: resp.success
        ? convertPreload({
          siteId: resp.assetRule.site?.id,
          pagetreeType: resp.assetRule.pagetreeType,
          path: resp.assetRule.path,
          mode: resp.assetRule.mode,
          grants: resp.assetRule.grants
        })
        : undefined
    }
  }

  async function validateEdit (state: AssetRuleDialogState) {
    if (!ruleId) return [{ type: MessageType.ERROR, message: 'Something went wrong' }]
    const args = {
      ruleId,
      ...convertState(state)
    }
    const resp = await api.editAssetRule(args, true)
    return messageForDialog(resp.messages, 'args')
  }

  const choices = [
    { value: 'create', label: 'Create' },
    { value: 'update', label: 'Update' },
    { value: 'move', label: 'Move' },
    { value: 'delete', label: 'Delete' },
    { value: 'undelete', label: 'Recover' }
  ]
</script>
<FormDialog submit={ruleId ? onEditAssetRule : onAddAssetRule} validate={ruleId ? validateEdit : validateAdd} {name} {title} preload={convertPreload(preload)} on:escape on:saved let:data>
  <FieldSelect path='siteId' label='Site' choices={[{ label: 'All Sites', value: 'allsites' }, ...siteChoices]} defaultValue="allsites" notNull/>
  <FieldText path='path' label='Path' conditional={!!data?.siteId} related helptext="If the editor should be limited to a sub-section of the site, enter that path here. Otherwise leave blank."/>
  <FieldSelect path='mode' label='Path Mode' conditional={!!data?.siteId && !!data.path && data.path?.startsWith('/') && data.path !== '/'} related choices={modeChoices} helptext="If you enter a path, choose whether rule should affect child pages."/>
  <FieldSelect path='pagetreeType' label='Pagetree Type' placeholder='Any pagetree' choices={pageTreeTypes} />
  <FieldChoices path='grants' {choices} leftToRight label="Permissions"/>
</FormDialog>
