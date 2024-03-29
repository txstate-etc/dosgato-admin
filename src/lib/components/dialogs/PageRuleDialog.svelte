<script lang='ts'>
  import { api, messageForDialog } from '$lib'
  import { FieldChoices, FieldSelect, FieldText, FormDialog } from '@dosgato/dialog'
  import type { PopupMenuItem } from '@txstate-mws/svelte-components'
  import { MessageType } from '@txstate-mws/svelte-forms'
  import { pick } from 'txstate-utils'

  export let roleId: string
  export let siteChoices: PopupMenuItem[]
  export let preload: PageRulePreload | undefined = undefined
  export let ruleId: string | undefined = undefined

  const modeChoices: PopupMenuItem[] = [
    { value: 'SELF', label: 'This path only' },
    { value: 'SELFANDSUB', label: 'This path and its subpages' },
    { value: 'SUB', label: 'Only subpages of this path' }
  ]

  const pageTreeTypes: PopupMenuItem[] = [
    { value: 'PRIMARY', label: 'Primary' },
    { value: 'ARCHIVE', label: 'Archive' },
    { value: 'SANDBOX', label: 'Sandbox' }
  ]

  const name = ruleId ? 'editpagerule' : 'addpagerule'
  const title = ruleId ? 'Edit Page Rule' : 'Add Page Rule'

  interface PageRulePreload {
    siteId?: string
    pagetreeType?: string
    path?: string
    mode?: string
    grants: {
      create: boolean
      update: boolean
      move: boolean
      publish: boolean
      unpublish: boolean
      delete: boolean
      undelete: boolean
    }
  }

  interface PageRuleDialogState {
    siteId?: string
    pagetreeType?: string
    path?: string
    mode?: string
    grants: string[]
  }

  function preloadToState (preload: PageRulePreload | undefined) {
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
      siteId: preload.siteId === undefined ? 'allsites' : preload.siteId,
      path: preload.path === '/' ? undefined : preload.path,
      grants
    } as PageRuleDialogState
  }

  function stateToPreload (state: PageRuleDialogState) {
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
        publish: state.grants.includes('publish'),
        unpublish: state.grants.includes('publish'),
        delete: state.grants.includes('delete'),
        undelete: state.grants.includes('undelete')
      }
    } as PageRulePreload
  }

  async function onAddPageRule (state: PageRuleDialogState) {
    const resp = await api.addPageRule({ ...stateToPreload(state), roleId })
    return {
      success: resp.success,
      messages: messageForDialog(resp.messages, ''),
      data: resp.success
        ? preloadToState({
          siteId: resp.pageRule.site?.id,
          pagetreeType: resp.pageRule.pagetreeType,
          path: resp.pageRule.path,
          mode: resp.pageRule.mode,
          grants: resp.pageRule.grants
        })
        : state
    }
  }

  async function validateAdd (state: PageRuleDialogState) {
    const resp = await api.addPageRule({ ...stateToPreload(state), roleId }, true)
    return messageForDialog(resp.messages, '')
  }

  async function onEditPageRule (state: PageRuleDialogState) {
    if (!ruleId) return { success: false, messages: [{ type: MessageType.ERROR, message: 'Something went wrong' }], data: state }
    const args = {
      ...stateToPreload(state),
      ruleId
    }
    const resp = await api.editPageRule(args)
    return {
      success: resp.success,
      messages: messageForDialog(resp.messages, 'args'),
      data: resp.success
        ? preloadToState({
          siteId: resp.pageRule.site?.id,
          pagetreeType: resp.pageRule.pagetreeType,
          path: resp.pageRule.path,
          mode: resp.pageRule.mode,
          grants: resp.pageRule.grants
        })
        : undefined
    }
  }

  async function validateEdit (state: PageRuleDialogState) {
    if (!ruleId) return [{ type: MessageType.ERROR, message: 'Something went wrong' }]
    const args = {
      ...stateToPreload(state),
      ruleId
    }
    const resp = await api.editPageRule(args, true)
    return messageForDialog(resp.messages, 'args')
  }

  const choices = [
    { value: 'create', label: 'Create' },
    { value: 'update', label: 'Update' },
    { value: 'move', label: 'Move' },
    { value: 'publish', label: 'Publish/Unpublish' },
    { value: 'delete', label: 'Delete' },
    { value: 'undelete', label: 'Recover' }
  ]
</script>

<FormDialog submit={ruleId ? onEditPageRule : onAddPageRule} validate={ruleId ? validateEdit : validateAdd} {name} {title} preload={preloadToState(preload)} on:escape on:saved let:data>
  <FieldSelect path='siteId' label='Site' choices={[{ label: 'All Sites', value: 'allsites' }, ...siteChoices]} defaultValue="allsites" notNull/>
  <FieldText path='path' label='Path' conditional={!!data?.siteId} related helptext="If the editor should be limited to a sub-section of the site, enter that path here. Otherwise leave blank."/>
  <FieldSelect path='mode' label='Path Mode' conditional={!!data?.siteId && !!data.path && data.path?.startsWith('/') && data.path !== '/'} related choices={modeChoices} helptext="If you enter a path, choose whether rule should affect child pages."/>
  <FieldSelect path='pagetreeType' label='Pagetree Type' placeholder='Any Pagetree' choices={pageTreeTypes} />
  <FieldChoices path='grants' {choices} leftToRight label="Permissions"/>
</FormDialog>
