<script lang="ts">
  import { FieldAutocomplete, FieldText, Icon } from '@dosgato/dialog'
  import pencilIcon from '@iconify-icons/mdi/pencil'
  import plusIcon from '@iconify-icons/mdi/plus'
  import checkIcon from '@iconify-icons/mdi/check'
  import minusIcon from '@iconify-icons/mdi/minus'
  import deleteOutline from '@iconify-icons/mdi/delete-outline'
  import { unique } from 'txstate-utils'
  import { base } from '$app/paths'
  import { api, DetailPanel, StyledList, ResponsiveTable, AssetRuleDialog, DataRuleDialog, GlobalRuleDialog, PageRuleDialog, SiteRuleDialog, TemplateRuleDialog } from '$lib'
  import Dialog from '$lib/components/Dialog.svelte'
  import { store } from './+page'
  import FormDialog from '$lib/components/FormDialog.svelte'
  import { MessageType } from '@txstate-mws/svelte-forms'

  export let data: { siteOptions: { value: string, label: string }[], userOptions: { value: string, label: string }[] }
  $: ({ siteOptions, userOptions } = data)

  let modal: 'editbasic' | 'addassetrule' | 'editassetrule' | 'adddatarule' | 'editdatarule' |
    'addglobalrule' | 'editglobalrule' | 'deleterule' | 'addpagerule' | 'editpagerule' |
    'addsiterule' | 'editsiterule' | 'addtemplaterule' | 'assigntouser' | 'unassignfromuser' | undefined

  $: groupIds = unique([...$store.role.directGroups.map(g => g.id), ...$store.role.indirectGroups.map(g => g.id)])

  function getUserGroups (userGroups) {
    const relevantGroups = userGroups.filter(g => groupIds.includes(g.id))
    return relevantGroups.map(g => g.id).join(', ')
  }

  async function validateBasic (state) {
    const resp = await api.editRole($store.role.id, state.name, true)
    return resp.messages.map(m => ({ ...m, path: m.arg }))
  }

  async function onEditBasic (state) {
    const resp = await api.editRole($store.role.id, state.name)
    return {
      success: resp.success,
      messages: resp.messages.map(m => ({ ...m, path: m.arg })),
      data: resp.success
        ? {
            name: resp.role.name
          }
        : undefined
    }
  }

  function filterUsers () {
    const alreadyAssigned = $store.role.directUsers.map(u => u.id)
    return userOptions.filter(u => {
      return !alreadyAssigned.includes(u.value)
    })
  }

  async function onAssignRole (state) {
    const resp = await api.addRolesToUser([$store.role.id], state.userId)
    return { ...resp, data: state }
  }

  function onClickUnassign (id: string, name: string) {
    store.setUserRemoving(id, name)
    modal = 'unassignfromuser'
  }

  async function onUnassign (state) {
    if (!$store.userRemoving) return { success: false, messages: [{ type: MessageType.ERROR, message: 'Please select a user to remove.' }], data: state }
    const resp = await api.removeRoleFromUser($store.role.id, $store.userRemoving.id)
    if (resp.success) {
      store.resetUserRemoving()
      onSaved()
    }
    return { ...resp, data: state }
  }

  function onSaved () {
    modal = undefined
    store.refresh($store.role.id)
  }

  async function onDeleteRule () {
    if (!$store.editing) return
    const resp = await api.removeRule($store.editing.id, $store.editing.type.toLocaleUpperCase() as 'GLOBAL'|'SITE'|'PAGE'|'TEMPLATE'|'ASSET'|'DATA')
    if (resp.success) {
      store.refresh($store.role.id)
    }
    store.resetRuleEditing()
    modal = undefined
  }

  function onClickDelete (ruleId, ruleType) {
    store.setRuleEditing(ruleId, ruleType)
    modal = 'deleterule'
  }

  function onClickEdit (ruleId, ruleType, rule) {
    store.setRuleEditing(ruleId, ruleType, rule)
    if (ruleType === 'asset') {
      modal = 'editassetrule'
    } else if (ruleType === 'data') {
      modal = 'editdatarule'
    } else if (ruleType === 'global') {
      modal = 'editglobalrule'
    } else if (ruleType === 'page') {
      modal = 'editpagerule'
    } else if (ruleType === 'site') {
      modal = 'editsiterule'
    }
  }

</script>

<div class="back-link">
  <a href={`${base}/auth/roles/`}>
    Back to Role List
  </a>
</div>

<DetailPanel header='Basic Information' button={ $store.role.permissions.rename ? { icon: pencilIcon, onClick: () => { modal = 'editbasic' }, hiddenLabel: 'Edit Basic Information' } : undefined }>
  <div class="row">
    <div class="label">Name:</div>
    <div class="value">{$store.role.name}</div>
  </div>
</DetailPanel>

{#if $store.role.directGroups.length || $store.role.indirectGroups.length}
  <DetailPanel header='Groups'>
    <StyledList>
      {#each $store.role.directGroups as group (group.id)}
        <li class="flex-row">
          <a href={`${base}/auth/groups/${group.id}`}>{group.name}</a>
          <button on:click={() => { }}><Icon icon={deleteOutline} width="1.5em"/></button>
        </li>
      {/each}
      {#each $store.role.indirectGroups as group (group.id)}
        <li class="flex-row">
          <a href={`${base}/auth/groups/${group.id}`}>{group.name}</a>
          <div>{`Via ${group.parents.map(g => g.name).join(', ')}`}</div>
        </li>
      {/each}
    </StyledList>
  </DetailPanel>
{/if}

<DetailPanel header='Users' button={{ icon: plusIcon, onClick: () => { modal = 'assigntouser' }, hiddenLabel: 'Assign this role to a user' }}>
  <StyledList>
    {#each $store.role.directUsers as user (user.id)}
      <li class="flex-row">
        <a href={`${base}/auth/users/${user.id}`}>{user.name} ({user.id})</a>
        <button on:click={() => { onClickUnassign(user.id, user.name) }}><Icon icon={deleteOutline} width="1.5em"/></button>
      </li>
    {/each}
    {#each $store.role.usersThroughGroups as user (user.id)}
      <li class="flex-row">
        <a href={`${base}/auth/users/${user.id}`}>{user.name} ({user.id})</a>
        {`Via group ${getUserGroups(user.groups)}`}
      </li>
    {/each}
  </StyledList>
</DetailPanel>

<DetailPanel header='Asset Rules' button={{ icon: plusIcon, onClick: () => { modal = 'addassetrule' }, hiddenLabel: 'Add Asset Rule' }}>
  {#if $store.role.assetRules.length}
  <ResponsiveTable items={$store.role.assetRules} headers={[
      { id: 'site', label: 'Site', render: (item) => { return item.site ? item.site.name : 'All Sites' } },
      { id: 'path', label: 'Path', get: 'path' },
      { id: 'mode', label: 'Mode', get: 'mode' },
      { id: 'create', label: 'Create', icon: (item) => { return item.grants.create ? { icon: checkIcon, hiddenLabel: 'Create permitted' } : { icon: minusIcon, hiddenLabel: 'Create not permitted' } } },
      { id: 'update', label: 'Update', icon: (item) => { return item.grants.update ? { icon: checkIcon, hiddenLabel: 'Update permitted' } : { icon: minusIcon, hiddenLabel: 'Update not permitted' } } },
      { id: 'move', label: 'Move', icon: (item) => { return item.grants.move ? { icon: checkIcon, hiddenLabel: 'Move permitted' } : { icon: minusIcon, hiddenLabel: 'Move not permitted' } } },
      { id: 'delete', label: 'Delete', icon: (item) => { return item.grants.delete ? { icon: checkIcon, hiddenLabel: 'Delete permitted' } : { icon: minusIcon, hiddenLabel: 'Delete not permitted' } } },
      { id: 'undelete', label: 'Undelete', icon: (item) => { return item.grants.undelete ? { icon: checkIcon, hiddenLabel: 'Undelete permitted' } : { icon: minusIcon, hiddenLabel: 'Undelete not permitted' } } }
    ]} rowActions={[
      { icon: pencilIcon, hiddenLabel: 'Edit Asset Rule', label: 'Edit', onClick: (item) => { onClickEdit(item.id, 'asset', item) } },
      { icon: deleteOutline, hiddenLabel: 'Delete Asset Rule', label: 'Delete', onClick: (item) => { onClickDelete(item.id, 'asset') } }
    ]}/>
  {:else}
    <div>This role has no asset rules.</div>
  {/if}
</DetailPanel>

<DetailPanel header='Data Rules' button={{ icon: plusIcon, onClick: () => { modal = 'adddatarule' }, hiddenLabel: 'Add Data Rule' }}>
  {#if $store.role.dataRules.length}
    <ResponsiveTable items={$store.role.dataRules} headers={[
      { id: 'site', label: 'Site', render: (item) => { return item.site ? item.site.name : 'All Sites' } },
      { id: 'path', label: 'Path', get: 'path' },
      { id: 'template', label: 'Template', render: (item) => { return item.template ? item.template.name : 'All Templates' } },
      { id: 'create', label: 'Create', icon: (item) => { return item.grants.create ? { icon: checkIcon, hiddenLabel: 'Create permitted' } : { icon: minusIcon, hiddenLabel: 'Create not permitted' } } },
      { id: 'update', label: 'Update', icon: (item) => { return item.grants.update ? { icon: checkIcon, hiddenLabel: 'Update permitted' } : { icon: minusIcon, hiddenLabel: 'Update not permitted' } } },
      { id: 'move', label: 'Move', icon: (item) => { return item.grants.move ? { icon: checkIcon, hiddenLabel: 'Move permitted' } : { icon: minusIcon, hiddenLabel: 'Move not permitted' } } },
      { id: 'publish', label: 'Publish', icon: (item) => { return item.grants.publish ? { icon: checkIcon, hiddenLabel: 'Publish permitted' } : { icon: minusIcon, hiddenLabel: 'Publish not permitted' } } },
      { id: 'unpublish', label: 'Unpublish', icon: (item) => { return item.grants.unpublish ? { icon: checkIcon, hiddenLabel: 'Unpublish permitted' } : { icon: minusIcon, hiddenLabel: 'Unpublish not permitted' } } },
      { id: 'delete', label: 'Delete', icon: (item) => { return item.grants.delete ? { icon: checkIcon, hiddenLabel: 'Delete permitted' } : { icon: minusIcon, hiddenLabel: 'Delete not permitted' } } },
      { id: 'undelete', label: 'Undelete', icon: (item) => { return item.grants.undelete ? { icon: checkIcon, hiddenLabel: 'Undelete permitted' } : { icon: minusIcon, hiddenLabel: 'Undelete not permitted' } } }
    ]} rowActions={[
      { icon: pencilIcon, hiddenLabel: 'Edit Data Rule', label: 'Edit', onClick: (item) => { onClickEdit(item.id, 'data', item) } },
      { icon: deleteOutline, hiddenLabel: 'Delete Data Rule', label: 'Delete', onClick: (item) => { onClickDelete(item.id, 'data') } }
    ]}/>
  {:else}
    <div>This role has no data rules.</div>
  {/if}
</DetailPanel>

<DetailPanel header='Global Rules' button={$store.role.globalRules.length < 1 ? { icon: plusIcon, onClick: () => { modal = 'addglobalrule' }, hiddenLabel: 'Add Global Rule' } : undefined}>
  {#if $store.role.globalRules.length}
    <ResponsiveTable items={$store.role.globalRules} headers={[
      { id: 'manageaccess', label: 'Manage Access', icon: (item) => { return item.grants.manageAccess ? { icon: checkIcon, hiddenLabel: 'May manage access' } : { icon: minusIcon, hiddenLabel: 'May not manage access' } } },
      { id: 'manageparentroles', label: 'Manage Parent Roles', icon: (item) => { return item.grants.manageParentRoles ? { icon: checkIcon, hiddenLabel: 'May manage parent roles' } : { icon: minusIcon, hiddenLabel: 'May not manage parent roles' } } },
      { id: 'createsites', label: 'Create Sites', icon: (item) => { return item.grants.createSites ? { icon: checkIcon, hiddenLabel: 'May create sites' } : { icon: minusIcon, hiddenLabel: 'May not create sites' } } },
      { id: 'manageglobaldata', label: 'Manage Global Data', icon: (item) => { return item.grants.manageGlobalData ? { icon: checkIcon, hiddenLabel: 'May manage global data' } : { icon: minusIcon, hiddenLabel: 'May not manage global data' } } },
      { id: 'viewsitelist', label: 'View Site List', icon: (item) => { return item.grants.viewSiteList ? { icon: checkIcon, hiddenLabel: 'May view the site list' } : { icon: minusIcon, hiddenLabel: 'May not view the site list' } } },
      { id: 'managetemplates', label: 'Manage Templates', icon: (item) => { return item.grants.manageTemplates ? { icon: checkIcon, hiddenLabel: 'May manage templates' } : { icon: minusIcon, hiddenLabel: 'May not manage templates' } } }
    ]} rowActions={[
      { icon: pencilIcon, hiddenLabel: 'Edit Global Rule', label: 'Edit', onClick: (item) => { onClickEdit(item.id, 'global', item) } },
      { icon: deleteOutline, hiddenLabel: 'Delete Global Rule', label: 'Delete', onClick: (item) => { onClickDelete(item.id, 'global') } }
    ]}/>
  {:else}
    <div>This role has no global rules.</div>
  {/if}
</DetailPanel>

<DetailPanel header='Page Rules' button={{ icon: plusIcon, onClick: () => { modal = 'addpagerule' }, hiddenLabel: 'Add Page Rule' }}>
  {#if $store.role.pageRules.length}
    <ResponsiveTable items={$store.role.pageRules} headers={[
      { id: 'site', label: 'Site', render: (item) => { return item.site ? item.site.name : 'All Sites' } },
      { id: 'pagetreetype', label: 'Pagetree Type', render: (item) => { return item.pagetreeType ? item.pagetreeType : 'All types' } },
      { id: 'path', label: 'Path', get: 'path' },
      { id: 'mode', label: 'Mode', get: 'mode' },
      { id: 'create', label: 'Create', icon: (item) => { return item.grants.create ? { icon: checkIcon, hiddenLabel: 'Create permitted' } : { icon: minusIcon, hiddenLabel: 'Create not permitted' } } },
      { id: 'update', label: 'Update', icon: (item) => { return item.grants.update ? { icon: checkIcon, hiddenLabel: 'Update permitted' } : { icon: minusIcon, hiddenLabel: 'Update not permitted' } } },
      { id: 'move', label: 'Move', icon: (item) => { return item.grants.move ? { icon: checkIcon, hiddenLabel: 'Move permitted' } : { icon: minusIcon, hiddenLabel: 'Move not permitted' } } },
      { id: 'publish', label: 'Publish', icon: (item) => { return item.grants.publish ? { icon: checkIcon, hiddenLabel: 'Publish permitted' } : { icon: minusIcon, hiddenLabel: 'Publish not permitted' } } },
      { id: 'unpublish', label: 'Unpublish', icon: (item) => { return item.grants.unpublish ? { icon: checkIcon, hiddenLabel: 'Unpublish permitted' } : { icon: minusIcon, hiddenLabel: 'Unpublish not permitted' } } },
      { id: 'delete', label: 'Delete', icon: (item) => { return item.grants.delete ? { icon: checkIcon, hiddenLabel: 'Delete permitted' } : { icon: minusIcon, hiddenLabel: 'Delete not permitted' } } },
      { id: 'undelete', label: 'Undelete', icon: (item) => { return item.grants.undelete ? { icon: checkIcon, hiddenLabel: 'Undelete permitted' } : { icon: minusIcon, hiddenLabel: 'Undelete not permitted' } } }
    ]} rowActions={[
      { icon: pencilIcon, hiddenLabel: 'Edit Page Rule', label: 'Edit', onClick: (item) => { onClickEdit(item.id, 'page', item) } },
      { icon: deleteOutline, hiddenLabel: 'Delete Page Rule', label: 'Delete', onClick: (item) => { onClickDelete(item.id, 'page') } }
    ]}/>
  {:else}
    <div>This role has no page rules</div>
  {/if}
</DetailPanel>

<DetailPanel header='Site Rules' button={{ icon: plusIcon, onClick: () => { modal = 'addsiterule' }, hiddenLabel: 'Add Site Rule' }}>
  {#if $store.role.siteRules.length}
    <ResponsiveTable items={$store.role.siteRules} headers={[
      { id: 'site', label: 'Site', render: (item) => { return item.site ? item.site.name : 'All Sites' } },
      { id: 'launch', label: 'Launch', icon: (item) => { return item.grants.launch ? { icon: checkIcon, hiddenLabel: 'May launch sites' } : { icon: minusIcon, hiddenLabel: 'May not launch sites' } } },
      { id: 'rename', label: 'Rename', icon: (item) => { return item.grants.rename ? { icon: checkIcon, hiddenLabel: 'May rename sites' } : { icon: minusIcon, hiddenLabel: 'May not rename sites' } } },
      { id: 'governance', label: 'Governance', icon: (item) => { return item.grants.governance ? { icon: checkIcon, hiddenLabel: 'May update site management' } : { icon: minusIcon, hiddenLabel: 'May not update site management' } } },
      { id: 'managestate', label: 'Manage State', icon: (item) => { return item.grants.manageState ? { icon: checkIcon, hiddenLabel: 'May manage pagetree state' } : { icon: minusIcon, hiddenLabel: 'May not manage pagetree state' } } },
      { id: 'delete', label: 'Delete/Undelete', icon: (item) => { return item.grants.delete ? { icon: checkIcon, hiddenLabel: 'May delete or undelete sites' } : { icon: minusIcon, hiddenLabel: 'May not delete or undelete sites' } } }
    ]} rowActions={[
      { icon: pencilIcon, hiddenLabel: 'Edit Site Rule', label: 'Edit', onClick: (item) => { onClickEdit(item.id, 'site', item) } },
      { icon: deleteOutline, hiddenLabel: 'Delete Site Rule', label: 'Delete', onClick: (item) => { onClickDelete(item.id, 'site') } }
    ]}/>
  {:else}
    <div>This role has no site rules.</div>
  {/if}
</DetailPanel>

<DetailPanel header='Template Rules' button={{ icon: plusIcon, onClick: () => { modal = 'addtemplaterule' }, hiddenLabel: 'Add Template Rule' }}>
  {#if $store.role.templateRules.length}
    <ResponsiveTable items={$store.role.templateRules} headers={[
      { id: 'template', label: 'Template', render: (item) => { return item.template ? item.template.name : 'All Templates' } },
      { id: 'use', label: 'Use', icon: (item) => { return item.grants.use ? { icon: checkIcon, hiddenLabel: 'May use template' } : { icon: minusIcon, hiddenLabel: 'May not use template' } } }
    ]} rowActions={[
      { icon: deleteOutline, hiddenLabel: 'Delete Template Rule', label: 'Delete', onClick: (item) => { onClickDelete(item.id, 'template') } }
    ]}/>
  {:else}
    <div>This role has no template rules.</div>
  {/if}
</DetailPanel>
{#if modal === 'editbasic'}
  <FormDialog
    submit={onEditBasic}
    validate={validateBasic}
    name='editbasicinfo'
    title='Rename Role'
    preload={{ name: $store.role.name }}
    on:escape={() => { modal = undefined }}
    on:saved={onSaved}>
    <FieldText path='name' label="Name" required/>
  </FormDialog>
{:else if modal === 'assigntouser'}
  <FormDialog
    submit={onAssignRole}
    name='assigntouser'
    title='Assign Role to User'
    on:escape={() => { modal = undefined }}
    on:saved={onSaved}>
    <FieldAutocomplete path='userId' label='User' choices={filterUsers()}/>
  </FormDialog>
{:else if modal === 'unassignfromuser'}
  <Dialog
  title={'Remove Role from User'}
  continueText='Unassign'
  cancelText='Cancel'
  on:continue={onUnassign}
  on:escape={() => { modal = undefined }}>
  {`Are you sure you want to remove the ${$store.role.name} role from user ${$store.userRemoving?.id}?`}

  </Dialog>
{:else if modal === 'addassetrule'}
  <AssetRuleDialog roleId={$store.role.id} siteChoices={siteOptions} on:escape={() => { modal = undefined }} on:saved={onSaved}/>
{:else if modal === 'editassetrule'}
  <AssetRuleDialog
    roleId={$store.role.id}
    ruleId={$store.editing?.id}
    siteChoices={siteOptions}
    on:saved={onSaved}
    on:escape={() => { modal = undefined }}
    preload={$store.editing ? { ...$store.editing.data, siteId: $store.editing.data.site?.id } : {} }/>
{:else if modal === 'adddatarule'}
  <DataRuleDialog roleId={$store.role.id} siteChoices={siteOptions} on:escape={() => { modal = undefined }} on:saved={onSaved}/>
{:else if modal === 'editdatarule'}
    <DataRuleDialog
      roleId={$store.role.id}
      ruleId={$store.editing?.id}
      siteChoices={siteOptions}
      on:escape={() => { modal = undefined }}
      on:saved={onSaved}
      preload={$store.editing ? { ...$store.editing.data, siteId: $store.editing.data.site?.id, templateId: $store.editing.data.template?.key } : {} }/>
{:else if modal === 'addglobalrule'}
    <GlobalRuleDialog roleId={$store.role.id} on:escape={() => { modal = undefined }} on:saved={onSaved}/>
{:else if modal === 'editglobalrule'}
    <GlobalRuleDialog
      roleId={$store.role.id}
      ruleId={$store.editing?.id}
      on:escape={() => { modal = undefined }}
      on:saved={onSaved}
      preload={$store.editing ? $store.editing.data : {} }/>
{:else if modal === 'addpagerule'}
  <PageRuleDialog roleId={$store.role.id} siteChoices={siteOptions} on:escape={() => { modal = undefined }} on:saved={onSaved}/>
{:else if modal === 'editpagerule'}
  <PageRuleDialog
    roleId={$store.role.id}
    ruleId={$store.editing?.id}
    siteChoices={siteOptions}
    on:escape={() => { modal = undefined }}
    on:saved={onSaved}
    preload={$store.editing ? $store.editing.data : {} }/>
{:else if modal === 'addsiterule'}
  <SiteRuleDialog roleId={$store.role.id} siteChoices={siteOptions} on:escape={() => { modal = undefined }} on:saved={onSaved}/>
{:else if modal === 'editsiterule'}
  <SiteRuleDialog
    roleId={$store.role.id}
    ruleId={$store.editing?.id}
    siteChoices={siteOptions}
    on:escape={() => { modal = undefined }}
    on:saved={onSaved}
    preload={$store.editing ? { ...$store.editing.data, siteId: $store.editing.data.site?.id } : undefined }/>
{:else if modal === 'addtemplaterule'}
  <TemplateRuleDialog roleId={$store.role.id} on:escape={() => { modal = undefined }} on:saved={onSaved}/>
{:else if modal === 'deleterule'}
  <Dialog
  title={'Delete Rule'}
  continueText='Delete'
  cancelText='Cancel'
  on:continue={onDeleteRule}
  on:escape={() => { modal = undefined }}>
  {`Are you sure you want to delete this ${$store.editing?.type} rule?`}
  </Dialog>
{/if}
<style>
  .back-link {
    display: flex;
    justify-content: flex-end;
    font-size: 1.2em;
  }
  .row {
    display: flex;
    padding: 0.5rem 0;
  }
  .label {
    font-weight: bold;
    width: 25%;
  }
</style>
