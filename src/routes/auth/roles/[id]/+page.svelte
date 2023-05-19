<script lang="ts">
  import { Dialog, FieldText, FormDialog, Icon, Tabs, Tab, FieldMultiselect } from '@dosgato/dialog'
  import pencilIcon from '@iconify-icons/mdi/pencil'
  import plusIcon from '@iconify-icons/ph/plus'
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
  import { api, DetailPanel, AssetRuleDialog, DataRuleDialog, GlobalRuleDialog, PageRuleDialog, SiteRuleDialog, TemplateRuleDialog, BackButton, DetailPanelSection, Accordion, DetailPageContent, DetailList, type DetailPanelButton, type UserListUser, type GroupListGroup } from '$lib'
  import { _store as store } from './+page'
  import { MessageType } from '@txstate-mws/svelte-forms'
  import SortableTable from '$lib/components/table/SortableTable.svelte'
  import PageRuleTable from './PageRuleTable.svelte'
  import AssetRuleTable from './AssetRuleTable.svelte'
  import DataRuleTable from './DataRuleTable.svelte'
  import GlobalRuleTable from './GlobalRuleTable.svelte'
  import TemplateRuleTable from './TemplateRuleTable.svelte'
  import SiteRuleTable from './SiteRuleTable.svelte'

  export let data: { siteOptions: { value: string, label: string }[], users: UserListUser[], groups: GroupListGroup[] }
  $: ({ siteOptions, users, groups } = data)

  let modal: 'editbasic' | 'addassetrule' | 'editassetrule' | 'adddatarule' | 'editdatarule' | 'assignrole' |
    'addglobalrule' | 'editglobalrule' | 'deleterule' | 'addpagerule' | 'editpagerule' | 'assigntogroup' |
    'addsiterule' | 'editsiterule' | 'addtemplaterule' | 'assigntouser' | 'unassignfromuser' | 'addeditorrule' | 'addadminrule' | undefined

  const panelHeaderColor = '#C2BCD2'

  const editorTabs = [
    { name: 'Page Rules' },
    { name: 'Asset Rules' },
    { name: 'Data Rules' }
  ]

  const adminTabs = [
    { name: 'Site Rules' },
    { name: 'Global Rules' },
    { name: 'Template Rules' }
  ]

  $: groupIds = unique([...$store.role.directGroups.map(g => g.id), ...$store.role.indirectGroups.map(g => g.id)])

  function getUserGroups (userGroups) {
    const relevantGroups = userGroups.filter(g => groupIds.includes(g.id))
    return relevantGroups.map(g => g.name).join(', ')
  }

  async function searchUsers (term: string) {
    term = term.toLowerCase()
    return users.filter(u => {
      return u.name.toLowerCase().includes(term) || u.id.includes(term)
    }).map(u => ({ label: u.name, value: u.id }))
  }

  async function lookupUserByValue (val: string) {
    const user = users.find(u => u.id === val)
    if (user) return { label: `${user.name} (${user.id})`, value: user.id }
  }

  async function searchGroups (term: string) {
    term = term.toLowerCase()
    return groups.filter(g => {
      return g.name.toLowerCase().includes(term)
    }).map(g => ({ label: g.name, value: g.id }))
  }

  async function lookupGroupByValue (val: string) {
    const group = groups.find(g => g.id === val)
    if (group) return { label: group.name, value: group.id }
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

  async function onAssignRoleToUser (state) {
    const resp = await api.assignRoleToUsers($store.role.id, state.userId)
    return { ...resp, data: state }
  }

  async function onAssignRoleToGroup (state) {
    const resp = await api.addRoleToGroups($store.role.id, state.groupId)
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
                { id: 'name', label: 'User names', render: (item) => `<a href="${base}/auth/users/${item.id}">${item.firstname} ${item.lastname} (${item.id})</a>`, sortable: true, sortFunction: (item) => item.lastname, widthPercent: 50 },
                { id: 'remove', label: 'Remove', actions: [{ icon: deleteIcon, label: 'Remove', onClick: (item) => onClickUnassign(item.id, `${item.firstname} ${item.lastname}`) }], widthPercent: 50 }
              ]} />
          {:else}
            <span>This role is not directly assigned to any users.</span>
          {/if}
          {#if $store.role.usersThroughGroups.length}
            <SortableTable items={$store.role.usersThroughGroups}
              headers={[
                { id: 'name', label: 'User from group', render: (item) => `<a href="${base}/auth/users/${item.id}">${item.firstname} ${item.lastname} (${item.id})</a>`, sortable: true, sortFunction: (item) => item.lastname, widthPercent: 50 },
                { id: 'groups', label: 'Group(s)', render: (item) => getUserGroups(item.groups), widthPercent: 50 }
              ]} />
          {/if}
        </Accordion>
      </DetailPanelSection>
      <DetailPanelSection addTopBorder>
        <Accordion title="List of Groups with this Role">
          {#if $store.role.directGroups.length}
            <SortableTable items={$store.role.directGroups}
              headers={[
                { id: 'name', label: 'Assigned Group', render: (item) => `<a href="${base}/auth/groups/${item.id}">${item.name}</a>`, sortable: true, sortFunction: (item) => item.name, widthPercent: 50 },
                { id: 'remove', label: 'Remove', actions: [{ icon: deleteIcon, label: 'Remove', onClick: (item) => {} }], widthPercent: 50 }
              ]}/>
          {:else}
            <span>This role is not directly assigned to any groups.</span>
          {/if}
          {#if $store.role.indirectGroups.length}
            <SortableTable items={$store.role.indirectGroups}
              headers={[
                { id: 'name', label: 'Subgroup', render: (item) => `<a href="${base}/auth/groups/${item.id}">${item.name}</a>`, sortable: true, sortFunction: (item) => item.name, widthPercent: 50 },
                { id: 'source', label: 'Subgroup parent', render: (item) => item.parents.map(g => g.name).join(', '), widthPercent: 50 }
              ]} />
          {/if}
        </Accordion>
      </DetailPanelSection>
    </DetailPanel>

    <DetailPanel header="Editor Permissions" headerColor={panelHeaderColor} button={{ hiddenLabel: 'Add Editor Permissions', icon: plusIcon, onClick: () => { modal = 'addeditorrule' } }}>
      <div class="desktop-layout">
        <DetailPanelSection>
          <h3>Page Rules</h3>
          <PageRuleTable rules={$store.role.pageRules} on:editrule={(e) => onClickEdit(e.detail.id, e.detail.type, e.detail.rule)} on:deleterule={(e) => onClickDelete(e.detail.id, e.detail.type)}/>
        </DetailPanelSection>
        <DetailPanelSection>
          <h3>Asset Rules</h3>
          <AssetRuleTable rules={$store.role.assetRules} on:editrule={(e) => onClickEdit(e.detail.id, e.detail.type, e.detail.rule)} on:deleterule={(e) => onClickDelete(e.detail.id, e.detail.type)}/>
        </DetailPanelSection>
        <DetailPanelSection>
          <h3>Data Rules</h3>
          <DataRuleTable rules={$store.role.dataRules} on:editrule={(e) => onClickEdit(e.detail.id, e.detail.type, e.detail.rule)} on:deleterule={(e) => onClickDelete(e.detail.id, e.detail.type)}/>
        </DetailPanelSection>
      </div>
      <div class="mobile-layout">
        <DetailPanelSection>
          <Tabs tabs={editorTabs} accordionOnMobile={false}>
            <Tab name="Page Rules">
              {#if $store.role.pageRules.length}
                <PageRuleTable rules={$store.role.pageRules} on:editrule={(e) => onClickEdit(e.detail.id, e.detail.type, e.detail.rule)} on:deleterule={(e) => onClickDelete(e.detail.id, e.detail.type)}/>
              {:else}
                <span>This role has no page rules.</span>
              {/if}
            </Tab>
            <Tab name="Asset Rules">
              {#if $store.role.assetRules.length}
                <AssetRuleTable rules={$store.role.assetRules} on:editrule={(e) => onClickEdit(e.detail.id, e.detail.type, e.detail.rule)} on:deleterule={(e) => onClickDelete(e.detail.id, e.detail.type)}/>
              {:else}
                <span>This role has no asset rules.</span>
              {/if}
            </Tab>
            <Tab name="Data Rules">
              {#if $store.role.dataRules.length}
                <DataRuleTable rules={$store.role.dataRules} on:editrule={(e) => onClickEdit(e.detail.id, e.detail.type, e.detail.rule)} on:deleterule={(e) => onClickDelete(e.detail.id, e.detail.type)}/>
              {:else}
                <span>This role has no data rules.</span>
              {/if}
            </Tab>
          </Tabs>
        </DetailPanelSection>
      </div>
    </DetailPanel>

    <DetailPanel header="Administrator Permissions" headerColor={panelHeaderColor} button={{ icon: plusIcon, onClick: () => { modal = 'addadminrule' }, hiddenLabel: 'Add Administrator Permissions' }}>
      <div class="desktop-layout">
        <DetailPanelSection>
          <h3>Site Rules</h3>
          <SiteRuleTable rules={$store.role.siteRules} on:editrule={(e) => onClickEdit(e.detail.id, e.detail.type, e.detail.rule)} on:deleterule={(e) => onClickDelete(e.detail.id, e.detail.type)}/>
        </DetailPanelSection>
        <DetailPanelSection>
          <h3>Global Rules</h3>
          <GlobalRuleTable rules={$store.role.globalRules} on:editrule={(e) => onClickEdit(e.detail.id, e.detail.type, e.detail.rule)} on:deleterule={(e) => onClickDelete(e.detail.id, e.detail.type)}/>
        </DetailPanelSection>
        <DetailPanelSection>
          <h3>Template Rules</h3>
          <TemplateRuleTable rules={$store.role.templateRules} on:editrule={(e) => onClickEdit(e.detail.id, e.detail.type, e.detail.rule)} on:deleterule={(e) => onClickDelete(e.detail.id, e.detail.type)}/>
        </DetailPanelSection>
      </div>
      <div class="mobile-layout">
        <DetailPanelSection>
          <Tabs tabs={adminTabs} accordionOnMobile={false}>
            <Tab name="Site Rules">
              <SiteRuleTable rules={$store.role.siteRules} on:editrule={(e) => onClickEdit(e.detail.id, e.detail.type, e.detail.rule)} on:deleterule={(e) => onClickDelete(e.detail.id, e.detail.type)}/>
            </Tab>
            <Tab name="Global Rules">
              <GlobalRuleTable rules={$store.role.globalRules} on:editrule={(e) => onClickEdit(e.detail.id, e.detail.type, e.detail.rule)} on:deleterule={(e) => onClickDelete(e.detail.id, e.detail.type)}/>
            </Tab>
            <Tab name="Template Rules">
              <TemplateRuleTable rules={$store.role.templateRules} on:editrule={(e) => onClickEdit(e.detail.id, e.detail.type, e.detail.rule)} on:deleterule={(e) => onClickDelete(e.detail.id, e.detail.type)}/>
            </Tab>
          </Tabs>
        </DetailPanelSection>
      </div>

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
    submit={onAssignRoleToUser}
    name='assigntouser'
    title='Assign Role to Users'
    on:escape={() => { modal = undefined }}
    on:saved={onSaved}
    preload={{ userId: $store.role.directUsers.map(u => u.id) }}>
    <FieldMultiselect path="userId" label=Users getOptions={searchUsers} lookupByValue={lookupUserByValue}/>
  </FormDialog>
{:else if modal === 'assigntogroup'}
  <FormDialog
    title="Assign Role to Group"
    on:escape={() => { modal = undefined }}
    on:saved={onSaved}
    submit={onAssignRoleToGroup}
    preload={{ groupId: $store.role.directGroups.map(g => g.id) }}>
    <FieldMultiselect path='groupId' label='Groups' getOptions={searchGroups} lookupByValue={lookupGroupByValue}/>
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
    <button type="button" on:click={() => { modal = 'addglobalrule' }}>
      <Icon icon={globeLight} width="60%"/><br>Add Global Rule
    </button>
    <button type="button" on:click={() => { modal = 'addtemplaterule' }}>
      <Icon icon={boundingBoxLight} width="60%"/><br>Add Template Rule
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
    gap: 1em;
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
  .mobile-layout {
    display: none;
  }
  :global([data-eq~="800px"]) .desktop-layout {
    display: none;
  }
  :global([data-eq~="800px"]) .mobile-layout {
    display: block;
  }
</style>
