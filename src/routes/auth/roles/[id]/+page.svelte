<script lang="ts">
  import { Dialog, FieldText, FormDialog, Icon, Tabs, Tab, FieldMultiselect, FieldSelect } from '@dosgato/dialog'
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
  import { api, DetailPanel, AssetRuleDialog, DataRuleDialog, GlobalRuleDialog, PageRuleDialog, SiteRuleDialog, TemplateRuleDialog, BackButton, DetailPanelSection, Accordion, DetailPageContent, DetailList, type DetailPanelButton, type UserListUser, type GroupListGroup, ModalContextStore, type TemplateListTemplate } from '$lib'
  import { _store as store } from './+page'
  import { MessageType } from '@txstate-mws/svelte-forms'
  import SortableTable from '$lib/components/table/SortableTable.svelte'
  import PageRuleTable from './PageRuleTable.svelte'
  import AssetRuleTable from './AssetRuleTable.svelte'
  import DataRuleTable from './DataRuleTable.svelte'
  import GlobalRuleTable from './GlobalRuleTable.svelte'
  import TemplateRuleTable from './TemplateRuleTable.svelte'
  import SiteRuleTable from './SiteRuleTable.svelte'

  export let data: { siteOptions: { value: string, label: string }[], users: UserListUser[], groups: GroupListGroup[], templates: TemplateListTemplate[] }
  $: ({ siteOptions, users, groups, templates } = data)
  $: siteNamesById = siteOptions.reduce((acc, site) => {
    acc[site.value] = site.label
    return acc
  }, {} as Record<string, string>)
  $: dataTemplateOptions = templates.filter(t => t.type === 'DATA').map(t => ({ label: t.name, value: t.key }))

  type Modals = 'editbasic' | 'addassetrule' | 'editassetrule' | 'adddatarule' | 'editdatarule' | 'assignrole' |
  'addglobalrule' | 'editglobalrule' | 'deleterule' | 'addpagerule' | 'editpagerule' | 'assigntogroup' | 'unassignfromgroup' |
  'addsiterule' | 'editsiterule' | 'addtemplaterule' | 'assigntouser' | 'unassignfromuser' | 'addeditorrule' | 'addadminrule'
  const modalContext = new ModalContextStore<Modals>()

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
    const directUserIds = $store.role.directUsers.map(u => u.id)
    return users.filter(u => {
      return !directUserIds.includes(u.id) && (u.name.toLowerCase().includes(term) || u.id.includes(term))
    }).map(u => ({ label: u.name, value: u.id }))
  }

  async function lookupUserByValue (val: string) {
    const user = users.find(u => u.id === val)
    if (user) return { label: `${user.name} (${user.id})`, value: user.id }
  }

  async function searchGroups (term: string) {
    term = term.toLowerCase()
    const directGroupIds = $store.role.directGroups.map(g => g.id)
    return groups.filter(g => {
      return !directGroupIds.includes(g.id) && g.name.toLowerCase().includes(term)
    }).map(g => ({ label: g.name, value: g.id }))
  }

  async function lookupGroupByValue (val: string) {
    const group = groups.find(g => g.id === val)
    if (group) return { label: group.name, value: group.id }
  }


  async function validateBasic (state) {
    const resp = await api.editRole($store.role.id, state, true)
    return resp.messages.map(m => ({ ...m, path: m.arg }))
  }

  async function onEditBasic (state) {
    const resp = await api.editRole($store.role.id, state)
    modalContext.logModalResponse(resp, $store.role.id, { name: state.name, description: state.description, siteId: state.siteId })
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
    if (!state.userIds?.length) {
      return {
        success: false,
        data: { userIds: [] },
        messages: [{ type: 'error' as const, path: 'userIds', message: 'Please select at least one user' }]
      }
    }
    const resp = await api.assignRoleToUsers($store.role.id, state.userIds)
    modalContext.logModalResponse(resp, $store.role.id, { userIds: state.userIds })
    return { ...resp, data: state }
  }

  async function onAssignRoleToGroup (state) {
    if (!state.groupIds.length) {
      return {
        success: false,
        data: { groupIds: [] },
        messages: [{ type: 'error' as const, path: 'groupIds', message: 'Please select at least one group' }]
      }
    }
    const resp = await api.addRoleToGroups($store.role.id, state.groupIds)
    modalContext.logModalResponse(resp, $store.role.id, { groupIds: state.groupIds })
    return { ...resp, data: state, messages: resp.messages.map(m => ({ ...m, path: m.arg })) }
  }

  function onClickUnassign (id: string, name: string) {
    store.setUserRemoving(id, name)
    modalContext.setModal('unassignfromuser', name)
  }

  function onClickUnassignGroup (id: string, name: string) {
    store.setGroupRemoving(id, name)
    modalContext.setModal('unassignfromgroup', name)
  }

  async function onUnassign (state) {
    if (!$store.userRemoving) return { success: false, messages: [{ type: MessageType.ERROR, message: 'Please select a user to remove.' }], data: state }
    const resp = await api.removeRoleFromUser($store.role.id, $store.userRemoving.id)
    modalContext.logModalResponse(resp, $store.role.id, { userId: $store.userRemoving.id })
    if (resp.success) {
      store.resetUserRemoving()
      onSaved()
    }
    return { ...resp, data: state }
  }

  async function onUnassignGroup (state) {
    if (!$store.groupRemoving) return { success: false, messages: [{ type: MessageType.ERROR, message: 'Please select a group to remove.' }], data: state }
    const resp = await api.removeRoleFromGroup($store.role.id, $store.groupRemoving.id)
    modalContext.logModalResponse(resp, $store.role.id, { groupId: $store.groupRemoving.id })
    if (resp.success) {
      store.resetGroupRemoving()
      onSaved()
    }
    return { ...resp, data: state }
  }

  function onSaved () {
    modalContext.reset()
    void store.refresh($store.role.id)
  }

  async function onDeleteRule () {
    if (!$store.editing) return
    const editingType = $store.editing.type.toLocaleUpperCase() as 'GLOBAL' | 'SITE' | 'PAGE' | 'TEMPLATE' | 'ASSET' | 'DATA'
    const resp = await api.removeRule($store.editing.id, editingType)
    modalContext.logModalResponse(resp, $store.editing.id, { type: editingType })
    if (resp.success) {
      void store.refresh($store.role.id)
    }
    store.resetRuleEditing()
    modalContext.reset()
  }

  function onClickDelete (ruleId, ruleType) {
    store.setRuleEditing(ruleId, ruleType)
    modalContext.setModal('deleterule', `${ruleType}-${ruleId}`)
  }

  function onClickEdit (ruleId, ruleType, rule) {
    store.setRuleEditing(ruleId, ruleType, rule)
    const targetDesc = `${ruleType}-${ruleId}`
    if (ruleType === 'asset') {
      modalContext.setModal('editassetrule', targetDesc)
    } else if (ruleType === 'data') {
      modalContext.setModal('editdatarule', targetDesc)
    } else if (ruleType === 'global') {
      modalContext.setModal('editglobalrule', targetDesc)
    } else if (ruleType === 'page') {
      modalContext.setModal('editpagerule', targetDesc)
    } else if (ruleType === 'site') {
      modalContext.setModal('editsiterule', targetDesc)
    }
  }

  const basicInfoButtons: DetailPanelButton[] = []
  if ($store.role.permissions.rename) basicInfoButtons.push({ icon: pencilIcon, onClick: () => modalContext.setModal('editbasic', $store.role.id), hiddenLabel: 'Edit Basic Information' })
  if ($store.role.permissions.assign) basicInfoButtons.push({ icon: plusIcon, onClick: () => modalContext.setModal('assignrole', $store.role.id), hiddenLabel: 'Add role to user or group' })
</script>

<DetailPageContent>
  <BackButton destination="role list" url={`${base}/auth/roles/`}/>

  <div class="vertical-list">
    <DetailPanel header='Basic Information' headerColor={panelHeaderColor} button={basicInfoButtons}>
      <DetailPanelSection>
        <DetailList records={{ Name: $store.role.name, Description: $store.role.description, Site: $store.role.site?.id ? siteNamesById[$store.role.site.id] : '' }} columns={1} />
      </DetailPanelSection>
      <DetailPanelSection addTopBorder hasBackground>
        <Accordion title="List of Users with this Role">
          {#if $store.role.directUsers.length}
            <SortableTable items={$store.role.directUsers}
              headers={[
                { id: 'name', label: 'User names', render: (item) => `<a href="${base}/auth/users/${item.id}"><span class="${item.disabled ? 'inactive' : ''}">${item.name} (${item.id})</span>${item.disabled ? ' (Inactive)' : ''}</a>`, sortable: true, sortFunction: (item) => item.lastname, widthPercent: 50 },
                { id: 'remove', label: 'Remove', actions: [{ icon: deleteIcon, label: 'Remove', onClick: (item) => onClickUnassign(item.id, `${item.firstname} ${item.lastname}`) }], widthPercent: 50 }
              ]} />
          {:else}
            <span>This role is not directly assigned to any users.</span>
          {/if}
          {#if $store.role.usersThroughGroups.length}
            <SortableTable items={$store.role.usersThroughGroups}
              headers={[
                { id: 'name', label: 'User from group', render: (item) => `<a href="${base}/auth/users/${item.id}"><span class="${item.disabled ? 'inactive' : ''}">${item.name} (${item.id})</span>${item.disabled ? ' (Inactive)' : ''}</a>`, sortable: true, sortFunction: (item) => item.lastname, widthPercent: 50 },
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
                { id: 'remove', label: 'Remove', actions: [{ icon: deleteIcon, label: 'Remove', onClick: (item) => onClickUnassignGroup(item.id, item.name) }], widthPercent: 50 }
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

    <DetailPanel header="Editor Permissions" headerColor={panelHeaderColor} button={{ hiddenLabel: 'Add Editor Permissions', icon: plusIcon, onClick: () => modalContext.setModal('addeditorrule', 'Dialog') }}>
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

    <DetailPanel header="Administrator Permissions" headerColor={panelHeaderColor} button={{ icon: plusIcon, onClick: () => modalContext.setModal('addadminrule', 'Dialog'), hiddenLabel: 'Add Administrator Permissions' }}>
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
{#if $modalContext.modal === 'editbasic'}
  <FormDialog
    submit={onEditBasic}
    validate={validateBasic}
    name='editbasicinfo'
    title='Edit Role'
    preload={{ name: $store.role.name, description: $store.role.description, siteId: $store.role.site?.id }}
    on:escape={modalContext.onModalEscape}
    on:saved={onSaved}>
    <FieldText path='name' label="Name" required/>
    <FieldText path='description' label="Description" />
    <FieldSelect path='siteId' label='Site' choices={data.siteOptions} />
  </FormDialog>
{:else if $modalContext.modal === 'assignrole'}
  <Dialog title="Assign Role" on:escape={modalContext.onModalEscape} continueText="Cancel" on:continue={modalContext.onModalEscape}>
    <div class="button-container">
      <button type="button" on:click={() => modalContext.setModal('assigntouser', $store.role.id)}>
        <Icon icon={accountIcon} width="60%"/><br>Assign to User
      </button>
      <button type="button" on:click={() => modalContext.setModal('assigntogroup', $store.role.id)}>
        <Icon icon={accountGroup} width="60%"/><br>Assign to Group
      </button>
    </div>
  </Dialog>
{:else if $modalContext.modal === 'assigntouser'}
  <FormDialog
    submit={onAssignRoleToUser}
    name='assigntouser'
    title='Assign Role to Users'
    on:escape={modalContext.onModalEscape}
    on:saved={onSaved}>
    <FieldMultiselect path="userIds" label=Users getOptions={searchUsers} lookupByValue={lookupUserByValue} helptext={`This role is already assigned to ${$store.role.directUsers.length} users.`}/>
  </FormDialog>
{:else if $modalContext.modal === 'assigntogroup'}
  <FormDialog
    title="Assign Role to Group"
    on:escape={modalContext.onModalEscape}
    on:saved={onSaved}
    submit={onAssignRoleToGroup}>
    <FieldMultiselect required path='groupIds' label='Groups' getOptions={searchGroups} lookupByValue={lookupGroupByValue} helptext={`This role is already assigned to ${$store.role.directGroups.length} groups.`}/>
  </FormDialog>
{:else if $modalContext.modal === 'unassignfromuser'}
  <Dialog
  title={'Remove Role from User'}
  continueText='Unassign'
  cancelText='Cancel'
  on:continue={onUnassign}
  on:escape={modalContext.onModalEscape}>
  {`Are you sure you want to remove the ${$store.role.name} role from user ${$store.userRemoving?.id}?`}
  </Dialog>
{:else if $modalContext.modal === 'unassignfromgroup'}
  <Dialog
  title={'Remove Role from Group'}
  continueText='Unassign'
  cancelText='Cancel'
  on:continue={onUnassignGroup}
  on:escape={modalContext.onModalEscape}>
  {`Are you sure you want to remove the ${$store.role.name} role from group ${$store.groupRemoving?.name}?`}
  </Dialog>
{:else if $modalContext.modal === 'addeditorrule'}
  <Dialog title="Add Editor Permissions" on:escape={modalContext.onModalEscape} continueText="Cancel" on:continue={modalContext.onModalEscape}>
    <div class="button-container">
      <button type="button" on:click={() => modalContext.setModal('addpagerule', 'PageRuleDialog')}>
        <Icon icon={fileCodeLight} width="60%"/><br>Add Page Rule
      </button>
      <button type="button" on:click={() => modalContext.setModal('addassetrule', 'AssetRuleDialog')}>
        <Icon icon={copySimpleLight} width="60%"/><br>Add Asset Rule
      </button>
      <button type="button" on:click={() => modalContext.setModal('adddatarule', 'DataRuleDialog')}>
        <Icon icon={databaseLight} width="60%"/><br>Add Data Rule
      </button>
    </div>
  </Dialog>
{:else if $modalContext.modal === 'addadminrule'}
<Dialog title="Add Administrator Permissions" on:escape={modalContext.onModalEscape} continueText="Cancel" on:continue={modalContext.onModalEscape}>
  <div class="button-container">
    <button type="button" on:click={() => modalContext.setModal('addsiterule', 'SiteRuleDialog')}>
      <Icon icon={appWindowLight} width="60%"/><br>Add Site Rule
    </button>
    <button type="button" on:click={() => modalContext.setModal('addglobalrule', 'GlobalRuleDialog')}>
      <Icon icon={globeLight} width="60%"/><br>Add Global Rule
    </button>
    <button type="button" on:click={() => modalContext.setModal('addtemplaterule', 'TemplateRuleDialog')}>
      <Icon icon={boundingBoxLight} width="60%"/><br>Add Template Rule
    </button>
  </div>
</Dialog>
{:else if $modalContext.modal === 'addassetrule'}
  <AssetRuleDialog roleId={$store.role.id} siteChoices={siteOptions} on:escape={modalContext.onModalEscape} on:saved={onSaved}/>
{:else if $modalContext.modal === 'editassetrule'}
  <AssetRuleDialog
    roleId={$store.role.id}
    ruleId={$store.editing?.id}
    siteChoices={siteOptions}
    on:saved={onSaved}
    on:escape={modalContext.onModalEscape}
    preload={$store.editing ? { ...$store.editing.data, siteId: $store.editing.data.site?.id } : {} }/>
{:else if $modalContext.modal === 'adddatarule'}
  <DataRuleDialog roleId={$store.role.id} siteChoices={siteOptions} templateChoices={dataTemplateOptions} on:escape={modalContext.onModalEscape} on:saved={onSaved}/>
{:else if $modalContext.modal === 'editdatarule'}
    <DataRuleDialog
      roleId={$store.role.id}
      ruleId={$store.editing?.id}
      siteChoices={siteOptions}
      templateChoices={dataTemplateOptions}
      on:escape={modalContext.onModalEscape}
      on:saved={onSaved}
      preload={$store.editing ? { ...$store.editing.data, siteId: $store.editing.data.site?.id, templateId: $store.editing.data.template?.key } : {} }/>
{:else if $modalContext.modal === 'addglobalrule'}
    <GlobalRuleDialog roleId={$store.role.id} on:escape={modalContext.onModalEscape} on:saved={onSaved}/>
{:else if $modalContext.modal === 'editglobalrule'}
    <GlobalRuleDialog
      roleId={$store.role.id}
      ruleId={$store.editing?.id}
      on:escape={modalContext.onModalEscape}
      on:saved={onSaved}
      preload={$store.editing ? $store.editing.data : {} }/>
{:else if $modalContext.modal === 'addpagerule'}
  <PageRuleDialog roleId={$store.role.id} siteChoices={siteOptions} on:escape={modalContext.onModalEscape} on:saved={onSaved}/>
{:else if $modalContext.modal === 'editpagerule'}
  <PageRuleDialog
    roleId={$store.role.id}
    ruleId={$store.editing?.id}
    siteChoices={siteOptions}
    on:escape={modalContext.onModalEscape}
    on:saved={onSaved}
    preload={$store.editing ? { ...$store.editing.data, siteId: $store.editing.data.site?.id } : {} }/>
{:else if $modalContext.modal === 'addsiterule'}
  <SiteRuleDialog roleId={$store.role.id} siteChoices={siteOptions} on:escape={modalContext.onModalEscape} on:saved={onSaved}/>
{:else if $modalContext.modal === 'editsiterule'}
  <SiteRuleDialog
    roleId={$store.role.id}
    ruleId={$store.editing?.id}
    siteChoices={siteOptions}
    on:escape={modalContext.onModalEscape}
    on:saved={onSaved}
    preload={$store.editing ? { ...$store.editing.data, siteId: $store.editing.data.site?.id } : undefined }/>
{:else if $modalContext.modal === 'addtemplaterule'}
  <TemplateRuleDialog roleId={$store.role.id} on:escape={modalContext.onModalEscape} on:saved={onSaved} templateChoices={templates.map(t => ({ label: t.name, value: t.key }))}/>
{:else if $modalContext.modal === 'deleterule'}
  <Dialog
  title={'Delete Rule'}
  continueText='Delete'
  cancelText='Cancel'
  on:continue={onDeleteRule}
  on:escape={modalContext.onModalEscape}>
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
  .button-container button {
    color: black;
    border-radius: 0.25em;
    border: 1px solid #808080;
    background-color: #ebebeb;
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
  :global(span.inactive) {
    text-decoration: line-through;
  }
</style>
