<script lang="ts">
  import { Dialog, FieldAutocomplete, FieldText, FormDialog, Icon, Tabs, Tab, FieldSelect } from '@dosgato/dialog'
  import pencilIcon from '@iconify-icons/mdi/pencil'
  import plusIcon from '@iconify-icons/ph/plus'
  import checkIcon from '@iconify-icons/ph/check-bold'
  import minusIcon from '@iconify-icons/ph/minus-bold'
  import deleteIcon from '@iconify-icons/ph/trash'
  import fileCodeLight from '@iconify-icons/ph/file-code-light'
  import copySimpleLight from '@iconify-icons/ph/copy-simple-light'
  import databaseLight from '@iconify-icons/ph/database-light'
  import appWindowLight from '@iconify-icons/ph/app-window-light'
  import globeLight from '@iconify-icons/ph/globe-light'
  import boundingBoxLight from '@iconify-icons/ph/bounding-box-light'
  import accountIcon from '@iconify-icons/ph/user-light'
  import accountGroup from '@iconify-icons/ph/users-three-light'
  import { unique } from 'txstate-utils'
  import { base } from '$app/paths'
  import { api, DetailPanel, AssetRuleDialog, DataRuleDialog, GlobalRuleDialog, PageRuleDialog, SiteRuleDialog, TemplateRuleDialog, BackButton, DetailPanelSection, Accordion, DetailPageContent, DetailList, type DetailPanelButton } from '$lib'
  import { _store as store } from './+page'
  import { MessageType } from '@txstate-mws/svelte-forms'
  import SortableTable from '$lib/components/table/SortableTable.svelte'

  export let data: { siteOptions: { value: string, label: string }[], userOptions: { value: string, label: string }[] }
  $: ({ siteOptions, userOptions } = data)

  let modal: 'editbasic' | 'addassetrule' | 'editassetrule' | 'adddatarule' | 'editdatarule' | 'assignrole' |
    'addglobalrule' | 'editglobalrule' | 'deleterule' | 'addpagerule' | 'editpagerule' | 'assigntogroup' |
    'addsiterule' | 'editsiterule' | 'addtemplaterule' | 'assigntouser' | 'unassignfromuser' | 'addeditorrule' | 'addadminrule' | undefined

  const panelHeaderColor = '#F5917F'

  const editorTabs = [
    { name: 'Page Rules' },
    { name: 'Asset Rules' },
    { name: 'Data Rules' }
  ]

  const adminTabs = [
    { name: 'Global Rules' },
    { name: 'Template Rules' },
    { name: 'Site Rules' }
  ]

  $: groupIds = unique([...$store.role.directGroups.map(g => g.id), ...$store.role.indirectGroups.map(g => g.id)])

  function getUserGroups (userGroups) {
    const relevantGroups = userGroups.filter(g => groupIds.includes(g.id))
    return relevantGroups.map(g => g.name).join(', ')
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

  const basicInfoButtons: DetailPanelButton[] = []
  if ($store.role.permissions.rename) basicInfoButtons.push({ icon: pencilIcon, onClick: () => { modal = 'editbasic' }, hiddenLabel: 'Edit Basic Information' })
  if ($store.role.permissions.assign) basicInfoButtons.push({ icon: plusIcon, onClick: () => { modal = 'assignrole' }, hiddenLabel: 'Add role to user or group' })
</script>

<DetailPageContent>
  <BackButton destination="role list" url={`${base}/auth/roles/`}/>

  <div class="vertical-list">
    <DetailPanel header='Basic Information' headerColor={panelHeaderColor} button={basicInfoButtons}>
      <DetailPanelSection>
        <DetailList records={{ Name: $store.role.name }}/>
      </DetailPanelSection>
      <DetailPanelSection addTopBorder hasBackground>
        <Accordion title="List of Users with this Role">
          {#if $store.role.directUsers.length}
            <SortableTable items={$store.role.directUsers}
              headers={[
                { id: 'name', label: 'User names', render: (item) => `<a href="${base}/auth/users/${item.id}">${item.firstname} ${item.lastname} (${item.id})</a>`, sortable: true, sortFunction: (item) => item.lastname },
                { id: 'remove', label: 'Remove', actions: [{ icon: deleteIcon, label: 'Remove', onClick: (item) => onClickUnassign(item.id, `${item.firstname} ${item.lastname}`) }] }
              ]} />
          {:else}
            <span>This role is not directly assigned to any users.</span>
          {/if}
          {#if $store.role.usersThroughGroups.length}
            <SortableTable items={$store.role.usersThroughGroups}
              headers={[
                { id: 'name', label: 'User from group', render: (item) => `<a href="${base}/auth/users/${item.id}">${item.firstname} ${item.lastname} (${item.id})</a>`, sortable: true, sortFunction: (item) => item.lastname },
                { id: 'groups', label: 'Group(s)', render: (item) => getUserGroups(item.groups) }
              ]} />
          {/if}
        </Accordion>
      </DetailPanelSection>
      <DetailPanelSection addTopBorder>
        <Accordion title="List of Groups with this Role">
          {#if $store.role.directGroups.length}
            <SortableTable items={$store.role.directGroups}
              headers={[
                { id: 'name', label: 'Assigned Group', render: (item) => `<a href="${base}/auth/groups/${item.id}">${item.name}</a>`, sortable: true, sortFunction: (item) => item.name },
                { id: 'remove', label: 'Remove', actions: [{ icon: deleteIcon, label: 'Remove', onClick: (item) => {} }] }
              ]}/>
          {:else}
            <span>This role is not directly assigned to any groups.</span>
          {/if}
          {#if $store.role.indirectGroups.length}
            <SortableTable items={$store.role.indirectGroups}
              headers={[
                { id: 'name', label: 'Subgroup', render: (item) => `<a href="${base}/auth/groups/${item.id}">${item.name}</a>`, sortable: true, sortFunction: (item) => item.name },
                { id: 'source', label: 'Subgroup parent', render: (item) => item.parents.map(g => g.name).join(', ') }
              ]} />
          {/if}
        </Accordion>
      </DetailPanelSection>
    </DetailPanel>

    <DetailPanel header="Editor Permissions" headerColor={panelHeaderColor} button={{ hiddenLabel: 'Add Editor Permissions', icon: plusIcon, onClick: () => { modal = 'addeditorrule' } }}>
      <DetailPanelSection>
        <Tabs tabs={editorTabs} accordionOnMobile={false}>
          <Tab name="Page Rules">
            {#if $store.role.pageRules.length}
              <SortableTable cardedOnMobile mobileHeader={(item) => item.site?.name ?? 'All Sites'} items={$store.role.pageRules}
                headers={[
                  { id: 'site', label: 'Site', render: (item) => { return item.site ? item.site.name : 'All Sites' } },
                  { id: 'pagetreetype', label: 'Pagetree Type', render: (item) => { return item.pagetreeType ? item.pagetreeType : 'All types' } },
                  { id: 'path', label: 'Path', get: 'path' },
                  { id: 'mode', label: 'Mode', get: 'mode' },
                  { id: 'create', label: 'Create', icon: (item) => { return item.grants.create ? { icon: checkIcon, hiddenLabel: 'Create Permitted' } : { icon: minusIcon, hiddenLable: 'Create not permitted' } } },
                  { id: 'update', label: 'Update', icon: (item) => { return item.grants.update ? { icon: checkIcon, hiddenLabel: 'Update Permitted' } : { icon: minusIcon, hiddenLable: 'Update not permitted' } } },
                  { id: 'move', label: 'Move', icon: (item) => { return item.grants.move ? { icon: checkIcon, hiddenLabel: 'Move Permitted' } : { icon: minusIcon, hiddenLable: 'Move not permitted' } } },
                  { id: 'publish', label: 'Publish & Unpublish', icon: (item) => { return item.grants.publish ? { icon: checkIcon, hiddenLabel: 'Publish Permitted' } : { icon: minusIcon, hiddenLable: 'Publish not permitted' } } },
                  { id: 'delete', label: 'Delete & Restore', icon: (item) => { return item.grants.delete ? { icon: checkIcon, hiddenLabel: 'Delete Permitted' } : { icon: minusIcon, hiddenLable: 'Delete not permitted' } } },
                  { id: 'editaction', label: 'Edit', actions: [{ icon: pencilIcon, label: 'Edit', onClick: (item) => onClickEdit(item.id, 'page', item) }] },
                  { id: 'deleteaction', label: 'Delete', actions: [{ icon: deleteIcon, label: 'Delete', onClick: (item) => onClickDelete(item.id, 'page') }] }
                ]} />
            {:else}
              <span>This role has no page rules.</span>
            {/if}
          </Tab>
          <Tab name="Asset Rules">
            {#if $store.role.assetRules.length}
              <SortableTable cardedOnMobile mobileHeader={(item) => { return item.site ? item.site.name : 'All Sites' }} items={$store.role.assetRules}
                headers={[
                  { id: 'site', label: 'Site', render: (item) => { return item.site ? item.site.name : 'All Sites' } },
                  { id: 'path', label: 'Path', get: 'path' },
                  { id: 'mode', label: 'Mode', get: 'mode' },
                  { id: 'create', label: 'Create', icon: (item) => { return item.grants.create ? { icon: checkIcon, hiddenLabel: 'Create Permitted' } : { icon: minusIcon, hiddenLable: 'Create not permitted' } } },
                  { id: 'update', label: 'Update', icon: (item) => { return item.grants.update ? { icon: checkIcon, hiddenLabel: 'Update Permitted' } : { icon: minusIcon, hiddenLable: 'Update not permitted' } } },
                  { id: 'move', label: 'Move', icon: (item) => { return item.grants.move ? { icon: checkIcon, hiddenLabel: 'Move Permitted' } : { icon: minusIcon, hiddenLable: 'Move not permitted' } } },
                  { id: 'delete', label: 'Delete & Restore', icon: (item) => { return item.grants.delete ? { icon: checkIcon, hiddenLabel: 'Delete Permitted' } : { icon: minusIcon, hiddenLable: 'Delete not permitted' } } },
                  { id: 'editaction', label: 'Edit', actions: [{ icon: pencilIcon, label: 'Edit', onClick: (item) => onClickEdit(item.id, 'asset', item) }] },
                  { id: 'deleteaction', label: 'Delete', actions: [{ icon: deleteIcon, label: 'Delete', onClick: (item) => onClickDelete(item.id, 'asset') }] }
                ]} />
            {:else}
              <span>This role has no asset rules.</span>
            {/if}
          </Tab>
          <Tab name="Data Rules">
            {#if $store.role.dataRules.length}
              <SortableTable cardedOnMobile mobileHeader={(item) => { return item.site ? item.site.name : 'All Sites' }} items={$store.role.dataRules}
                headers={[
                  { id: 'site', label: 'Site', render: (item) => { return item.site ? item.site.name : 'All Sites' } },
                  { id: 'path', label: 'Path', get: 'path' },
                  { id: 'template', label: 'Template', render: (item) => { return item.template ? item.template.name : 'All Templates' } },
                  { id: 'create', label: 'Create', icon: (item) => { return item.grants.create ? { icon: checkIcon, hiddenLabel: 'Create Permitted' } : { icon: minusIcon, hiddenLable: 'Create not permitted' } } },
                  { id: 'update', label: 'Update', icon: (item) => { return item.grants.update ? { icon: checkIcon, hiddenLabel: 'Update Permitted' } : { icon: minusIcon, hiddenLable: 'Update not permitted' } } },
                  { id: 'move', label: 'Move', icon: (item) => { return item.grants.move ? { icon: checkIcon, hiddenLabel: 'Move Permitted' } : { icon: minusIcon, hiddenLable: 'Move not permitted' } } },
                  { id: 'publish', label: 'Publish & Unpublish', icon: (item) => { return item.grants.publish ? { icon: checkIcon, hiddenLabel: 'Publish Permitted' } : { icon: minusIcon, hiddenLable: 'Publish not permitted' } } },
                  { id: 'delete', label: 'Delete & Restore', icon: (item) => { return item.grants.delete ? { icon: checkIcon, hiddenLabel: 'Delete Permitted' } : { icon: minusIcon, hiddenLable: 'Delete not permitted' } } },
                  { id: 'editaction', label: 'Edit', actions: [{ icon: pencilIcon, label: 'Edit', onClick: (item) => onClickEdit(item.id, 'data', item) }] },
                  { id: 'deleteaction', label: 'Delete', actions: [{ icon: deleteIcon, label: 'Delete', onClick: (item) => onClickDelete(item.id, 'data') }] }
                ]} />
            {:else}
              <span>This role has no data rules.</span>
            {/if}
          </Tab>
        </Tabs>
      </DetailPanelSection>
    </DetailPanel>

    <DetailPanel header="Administrator Permissions" headerColor={panelHeaderColor} button={{ icon: plusIcon, onClick: () => { modal = 'addadminrule' }, hiddenLabel: 'Add Administrator Permissions' }}>
      <Tabs tabs={adminTabs} accordionOnMobile={false}>
        <Tab name="Global Rules">
          {#if $store.role.globalRules.length}
            <SortableTable cardedOnMobile mobileHeader={(item) => 'Global Rule'} items={$store.role.globalRules}
              headers={[
                { id: 'manageaccess', label: 'Manage Access', icon: (item) => { return item.grants.manageAccess ? { icon: checkIcon, hiddenLabel: 'May manage access' } : { icon: minusIcon, hiddenLable: 'May not manage access' } } },
                { id: 'manageparentroles', label: 'Manage Parent Roles', icon: (item) => { return item.grants.manageParentRoles ? { icon: checkIcon, hiddenLabel: 'May manage parent roles' } : { icon: minusIcon, hiddenLable: 'May not manage parent roles' } } },
                { id: 'createsites', label: 'Create Sites', icon: (item) => { return item.grants.createSites ? { icon: checkIcon, hiddenLabel: 'May create sites' } : { icon: minusIcon, hiddenLable: 'May not create sites' } } },
                { id: 'manageglobaldata', label: 'Manage Global Data', icon: (item) => { return item.grants.manageGlobalData ? { icon: checkIcon, hiddenLabel: 'May manage global data' } : { icon: minusIcon, hiddenLable: 'May not manage global data' } } },
                { id: 'managetemplates', label: 'Manage Templates', icon: (item) => { return item.grants.manageTemplates ? { icon: checkIcon, hiddenLabel: 'May manage templates' } : { icon: minusIcon, hiddenLable: 'May not manage templates' } } },
                { id: 'editaction', label: 'Edit', actions: [{ icon: pencilIcon, label: 'Edit', onClick: (item) => onClickEdit(item.id, 'global', item) }] },
                { id: 'deleteaction', label: 'Delete', actions: [{ icon: deleteIcon, label: 'Delete', onClick: (item) => onClickDelete(item.id, 'global') }] }
              ]} />
          {:else}
            <span>This role has no global rules.</span>
          {/if}
        </Tab>
        <Tab name="Template Rules">
          {#if $store.role.templateRules.length}
            <SortableTable cardedOnMobile mobileHeader={(item) => item.template ? item.template.name : 'All Templates'} items={$store.role.templateRules}
              headers={[
                { id: 'template', label: 'Template', render: (item) => { return item.template ? item.template.name : 'All Templates' } },
                { id: 'use', label: 'Use', icon: (item) => { return item.grants.use ? { icon: checkIcon, hiddenLabel: 'May use template' } : { icon: minusIcon, hiddenLabel: 'May not use template' } } },
                { id: 'editaction', label: 'Edit', actions: [{ icon: pencilIcon, label: 'Edit', onClick: (item) => onClickEdit(item.id, 'template', item) }] },
                { id: 'deleteaction', label: 'Delete', actions: [{ icon: deleteIcon, label: 'Delete', onClick: (item) => onClickDelete(item.id, 'template') }] }
              ]} />
          {:else}
            <div>This role has no template rules.</div>
          {/if}
        </Tab>
        <Tab name="Site Rules">
          {#if $store.role.siteRules.length}
            <SortableTable cardedOnMobile mobileHeader={(item) => { return item.site ? item.site.name : 'All Sites' }} items={$store.role.siteRules}
              headers={[
                { id: 'site', label: 'Site', render: (item) => { return item.site ? item.site.name : 'All Sites' } },
                { id: 'launch', label: 'Launch', icon: (item) => { return item.grants.launch ? { icon: checkIcon, hiddenLabel: 'May launch site' } : { icon: minusIcon, hiddenLable: 'May not launch site' } } },
                { id: 'rename', label: 'Rename', icon: (item) => { return item.grants.rename ? { icon: checkIcon, hiddenLabel: 'May rename site' } : { icon: minusIcon, hiddenLable: 'May not rename site' } } },
                { id: 'governance', label: 'Governance', icon: (item) => { return item.grants.governance ? { icon: checkIcon, hiddenLabel: 'May update site management' } : { icon: minusIcon, hiddenLable: 'May not update site management' } } },
                { id: 'managestate', label: 'Manage State', icon: (item) => { return item.grants.manageState ? { icon: checkIcon, hiddenLabel: 'May manage pagetree state' } : { icon: minusIcon, hiddenLable: 'May not manage pagetree state' } } },
                { id: 'delete', label: 'Delete & Restore', icon: (item) => { return item.grants.delete ? { icon: checkIcon, hiddenLabel: 'May delete or restore site' } : { icon: minusIcon, hiddenLable: 'May not delete or restore site' } } },
                { id: 'editaction', label: 'Edit', actions: [{ icon: pencilIcon, label: 'Edit', onClick: (item) => onClickEdit(item.id, 'site', item) }] },
                { id: 'deleteaction', label: 'Delete', actions: [{ icon: deleteIcon, label: 'Delete', onClick: (item) => onClickDelete(item.id, 'site') }] }
              ]} />
          {:else}
            <div>This role has no site rules.</div>
          {/if}
        </Tab>
      </Tabs>
    </DetailPanel>
  </div>
</DetailPageContent>
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
{:else if modal === 'assignrole'}
  <Dialog title="Assign Role" on:escape={() => { modal = undefined }} continueText="Cancel" on:continue={() => { modal = undefined }}>
    <div class="button-container">
      <button type="button" on:click={() => { modal = 'assigntouser' }}>
        <Icon icon={accountIcon} width="60%"/><br>Assign to User
      </button>
      <button type="button" on:click={() => { modal = 'assigntogroup' }}>
        <Icon icon={accountGroup} width="60%"/><br>Assign to Group
      </button>
    </div>
  </Dialog>
{:else if modal === 'assigntouser'}
  <FormDialog
    submit={onAssignRole}
    name='assigntouser'
    title='Assign Role to User'
    on:escape={() => { modal = undefined }}
    on:saved={onSaved}>
    <FieldAutocomplete path='userId' label='User' choices={filterUsers()}/>
  </FormDialog>
{:else if modal === 'assigntogroup'}
  <!-- <FormDialog
    title="Assign Role to Group"
    on:escape={() => { modal = undefined }}
    on:saved={onSaved}
    submit={onAssignRoleToGroup}>
    <FieldAutocomplete path='groupId' label='Group' choices={filterUsers()}/>
  </FormDialog> -->
{:else if modal === 'unassignfromuser'}
  <Dialog
  title={'Remove Role from User'}
  continueText='Unassign'
  cancelText='Cancel'
  on:continue={onUnassign}
  on:escape={() => { modal = undefined }}>
  {`Are you sure you want to remove the ${$store.role.name} role from user ${$store.userRemoving?.id}?`}
  </Dialog>
{:else if modal === 'addeditorrule'}
  <Dialog title="Add Editor Permissions" on:escape={() => { modal = undefined }} continueText="Cancel" on:continue={() => { modal = undefined }}>
    <div class="button-container">
      <button type="button" on:click={() => { modal = 'addpagerule' }}>
        <Icon icon={fileCodeLight} width="60%"/><br>Add Page Rule
      </button>
      <button type="button" on:click={() => { modal = 'addassetrule' }}>
        <Icon icon={copySimpleLight} width="60%"/><br>Add Asset Rule
      </button>
      <button type="button" on:click={() => { modal = 'adddatarule' }}>
        <Icon icon={databaseLight} width="60%"/><br>Add Data Rule
      </button>
    </div>
  </Dialog>
{:else if modal === 'addadminrule'}
<Dialog title="Add Administrator Permissions" on:escape={() => { modal = undefined }} continueText="Cancel" on:continue={() => { modal = undefined }}>
  <div class="button-container">
    <button type="button" on:click={() => { modal = 'addsiterule' }}>
      <Icon icon={appWindowLight} width="60%"/><br>Add Site Rule
    </button>
    <button type="button" on:click={() => { modal = 'addtemplaterule' }}>
      <Icon icon={boundingBoxLight} width="60%"/><br>Add Template Rule
    </button>
    <button type="button" on:click={() => { modal = 'addglobalrule' }}>
      <Icon icon={globeLight} width="60%"/><br>Add Global Rule
    </button>
  </div>
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
    preload={$store.editing ? { ...$store.editing.data, siteId: $store.editing.data.site?.id } : {} }/>
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
  .vertical-list {
    display: grid;
    grid-template-columns: 1fr;
    grid-row-gap: 3em;
  }
  :global(.mobile-list div.background) {
    margin-left: calc(-1 * var(--tabs-padding-hori, 0.7em));
    padding-left: var(--tabs-padding-hori, 0.7em);
    margin-right: calc(-1 * var(--tabs-padding-hori, 0.7em));
    padding-right: var(--tabs-padding-hori, 0.7em);
  }
  .button-container {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 1em;
  }
</style>
