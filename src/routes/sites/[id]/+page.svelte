<script lang="ts">
  import pencilIcon from '@iconify-icons/mdi/pencil'
  import plusIcon from '@iconify-icons/ph/plus-light'
  import deleteOutline from '@iconify-icons/ph/trash'
  import archiveOutline from '@iconify-icons/ph/archive'
  import checkIcon from '@iconify-icons/ph/check-bold'
  import minusIcon from '@iconify-icons/ph/minus-bold'
  import launchIcon from '@iconify-icons/ph/rocket-launch'
  import exportIcon from '@iconify-icons/mdi/export'
  import { Dialog, Icon, FieldText, FieldSelect, FieldMultiselect, FieldCheckbox, FieldAutocomplete, FormDialog, Tabs, Tab } from '@dosgato/dialog'
  import { type Feedback, MessageType } from '@txstate-mws/svelte-forms'
  import { csv, keyby, titleCase } from 'txstate-utils'
  import { api, DetailPanel, ensureRequiredNotNull, messageForDialog, type CreateWithPageState, type Organization, type UserListUser, type TemplateListTemplate, DetailPanelSection, DetailPageContent, DialogWarning, ModalContextStore } from '$lib'
  import { base } from '$app/paths'
  import { _store as store } from './+page'
  import CreateWithPageDialog from '$lib/components/dialogs/CreateWithPageDialog.svelte'
  import AuditPanel from './AuditPanel.svelte'
  import SortableTable from '$lib/components/table/SortableTable.svelte'
  import type { SortableTableRowAction } from '$lib/components/table/sortabletable'
  import TemplateAvailability from './TemplateAvailability.svelte'
  import UserAccessPanel from './UserAccessPanel.svelte'

  const panelHeaderColor = '#D1C7B7'

  export let data: { organizations: Organization[], users: UserListUser[], allPageTemplates: TemplateListTemplate[], allComponentTemplates: TemplateListTemplate[] }

  type Modals = 'editbasic' | 'editsitemanagement' | 'editlaunch' | 'addcomment' | 'addpagetree' | 'editpagetree' | 'deletepagetree' | 'authorizetemplate' |
    'promotepagetree' | 'archivepagetree' | 'edittemplates' | 'addpagetemplates' | 'addcomponenttemplates' | 'deletetemplateauth' | 'downloadcsv'
  const modalContext = new ModalContextStore<Modals>(undefined, () => $store.site.name)

  $: authorizedPageTemplateKeys = new Set($store.pageTemplates.map(t => t.key))
  $: authorizedComponentTemplateKeys = new Set($store.componentTemplates.map(t => t.key))
  $: universalComponentTemplates = data.allComponentTemplates.filter(t => t.universal && !authorizedComponentTemplateKeys.has(t.key))
  $: universalPageTemplates = data.allPageTemplates.filter(t => t.universal && !authorizedPageTemplateKeys.has(t.key))

  async function searchUsers (search) {
    const query = search.toLowerCase()
    return data.users.filter(u => {
      return u.name.toLowerCase().includes(query) || u.id.includes(query)
    }).map(u => ({ label: `${u.name}`, value: u.id }))
  }

  async function searchPagetrees (term) {
    return $store.site.pagetrees.filter(p => p.name.includes(term)).map(p => ({ label: p.name, value: p.id }))
  }

  async function lookupPagetreeByValue (val: string) {
    const pagetree = $store.site.pagetrees.find(p => p.id === val)
    if (pagetree) return { label: pagetree.name, value: pagetree.id }
  }

  async function onAddComment (state) {
    const resp = await api.addSiteComment($store.site.id, state.comment)
    modalContext.logModalResponse(resp, $store.site.id, { comment: state.comment })
    if (resp.success) {
      store.refresh($store.site.id)
      modalContext.reset()
    }
    return { success: resp.success, messages: messageForDialog(resp.messages, ''), data: state }
  }

  async function validateBasicInfo (state) {
    const localMessages = ensureRequiredNotNull(state, ['name'])
    if (!localMessages.length) {
      const resp = await api.renameSite($store.site.id, state.name, true)
      return messageForDialog(resp.messages, '')
    }
    return localMessages
  }

  async function onRenameSite (state) {
    const resp = await api.renameSite($store.site.id, state.name, false)
    modalContext.logModalResponse(resp, $store.site.id, { oldName: $store.site.name, newName: state.name })
    if (resp.success) {
      store.refresh($store.site.id)
      modalContext.reset()
    }
    return { success: resp.success, messages: messageForDialog(resp.messages, ''), data: state }
  }

  async function onEditSiteManagement (state) {
    const resp = await api.updateSiteManagement($store.site.id, state.organization, state.owner, state.managers)
    modalContext.logModalResponse(resp, $store.site.id, { organization: state.organization, owner: state.owner, managers: state.managers })
    if (resp.success) {
      store.refresh($store.site.id)
      modalContext.reset()
    }
    return { success: resp.success, messages: messageForDialog(resp.messages, 'args'), data: state }
  }

  async function onSetLaunchURL (state) {
    const resp = await api.setLaunchURL($store.site.id, state.host, state.path, state.enabled ?? false)
    modalContext.logModalResponse(resp, $store.site.id, { host: state.host, path: state.path, enabled: state.enabled })
    if (resp.success) {
      store.refresh($store.site.id)
      modalContext.reset()
    }
    return { success: resp.success, messages: messageForDialog(resp.messages, ''), data: state }
  }

  async function validateAddPagetree (state) {
    const resp = await api.addPagetree($store.site.id, state.templateKey, state.data, true)
    return resp.messages.map(m => ({ ...m, path: m.arg }))
  }

  async function onAddPagetree (state: CreateWithPageState) {
    const resp = await api.addPagetree($store.site.id, state.templateKey, state.data)
    modalContext.logModalResponse(resp, $store.site.id, { templateKey: state.templateKey })
    return {
      success: resp.success,
      messages: resp.messages.map(m => ({ ...m, path: m.arg })),
      data: state
    }
  }

  function onAddPagetreeComplete () {
    store.refresh($store.site.id)
    modalContext.reset()
  }

  async function onClickEditPagetree (id, name) {
    store.setPagetreeEditing(id, name)
    modalContext.setModal('editpagetree')
  }

  async function onRenamePagetree (state) {
    if (!$store.editingPagetree) {
      const error: Feedback = { message: 'Something went wrong. Please contact support for assistance', type: MessageType.ERROR }
      return { success: false, messages: [error], data: state }
    }
    const resp = await api.updatePagetree($store.editingPagetree.id, state.name)
    modalContext.logModalResponse(resp, $store.editingPagetree.id, { oldName: $store.editingPagetree.name, newName: state.name })
    if (resp.success) {
      store.refresh($store.site.id)
      store.cancelEditPagetree()
      modalContext.reset()
    }
    return { success: resp.success, messages: messageForDialog(resp.messages, ''), data: state }
  }

  async function onClickDeletePagetree (id, name) {
    store.setPagetreeEditing(id, name)
    modalContext.setModal('deletepagetree')
  }

  async function onDeletePagetree () {
    if (!$store.editingPagetree) {
      const error: Feedback = { message: 'Something went wrong. Please contact support for assistance', type: MessageType.ERROR }
      return { success: false, messages: [error], data: {} }
    }
    const resp = await api.deletePagetree($store.editingPagetree.id)
    modalContext.logModalResponse(resp, $store.editingPagetree.id)
    if (resp.success) {
      store.refresh($store.site.id)
      store.cancelEditPagetree()
      modalContext.reset()
    }
    return { success: resp.success, messages: messageForDialog(resp.messages, ''), data: {} }
  }

  async function onClickPromotePagetree (id, name) {
    store.setPagetreeEditing(id, name)
    modalContext.setModal('promotepagetree')
  }

  async function onPromotePagetree () {
    if (!$store.editingPagetree) {
      const error: Feedback = { message: 'Something went wrong. Please contact support for assistance', type: MessageType.ERROR }
      return { success: false, messages: [error], data: {} }
    }
    const resp = await api.promotePagetree($store.editingPagetree.id)
    modalContext.logModalResponse(resp, $store.editingPagetree.id)
    if (resp.success) {
      store.refresh($store.site.id)
      store.cancelEditPagetree()
      modalContext.reset()
    }
    return { success: resp.success, messages: messageForDialog(resp.messages, ''), data: {} }
  }

  async function onClickArchivePagetree (id, name) {
    store.setPagetreeEditing(id, name)
    modalContext.setModal('archivepagetree')
  }

  async function onArchivePagetree () {
    if (!$store.editingPagetree) {
      const error: Feedback = { message: 'Something went wrong. Please contact support for assistance', type: MessageType.ERROR }
      return { success: false, messages: [error], data: {} }
    }
    const resp = await api.archivePagetree($store.editingPagetree.id)
    modalContext.logModalResponse(resp, $store.editingPagetree.id)
    if (resp.success) {
      store.refresh($store.site.id)
      store.cancelEditPagetree()
      modalContext.reset()
    }
    return { success: resp.success, messages: messageForDialog(resp.messages, ''), data: {} }
  }

  function onClickAuthorizeTemplate (e) {
    const { key, name } = e.detail.template
    store.setTemplateAuthEditing(key, name, [])
    modalContext.setModal('authorizetemplate')
  }

  async function authorizeTemplate (state) {
    if (!$store.templateAuthEditing) {
      const error: Feedback = { message: 'Something went wrong. Please contact support for assistance', type: MessageType.ERROR }
      return { success: false, messages: [error], data: state }
    }
    if (state.pagetrees.length === 0) {
      // no pagetrees selected, authorize template at site level
      const resp = await api.authorizeTemplateForSite($store.templateAuthEditing.key, $store.site.id)
      modalContext.logModalResponse(resp, $store.site.id, { templateKey: $store.templateAuthEditing.key })
      if (resp.success) {
        store.refresh($store.site.id)
        modalContext.reset()
      }
      return { success: resp.success, messages: messageForDialog(resp.messages, ''), data: state }
    } else {
      const resp = await api.authorizeTemplateForPagetrees($store.templateAuthEditing.key, state.pagetrees)
      modalContext.logModalResponse(resp, state.pagetrees, { templateKey: $store.templateAuthEditing.key })
      if (resp.success) {
        store.refresh($store.site.id)
        store.cancelEditTemplateAuth()
        modalContext.reset()
      }
      return { success: resp.success, messages: messageForDialog(resp.messages, ''), data: state }
    }
  }

  async function onClickEditTemplateAuth (e) {
    const { key, name, pagetrees } = e.detail.template
    const pagetreesByName = keyby($store.site.pagetrees, 'name')
    store.setTemplateAuthEditing(key, name, pagetrees.map((p: string) => pagetreesByName[p].id))
    modalContext.setModal('edittemplates')
  }

  async function onEditTemplateAuthorizations (state) {
    if (!$store.templateAuthEditing) {
      const error: Feedback = { message: 'Something went wrong. Please contact support for assistance', type: MessageType.ERROR }
      return { success: false, messages: [error], data: state }
    }
    let resp
    if (state.pagetrees.length === 0) {
      resp = await api.authorizeTemplateForSite($store.templateAuthEditing.key, $store.site.id)
      modalContext.logModalResponse(resp, $store.site.id, { templateKey: $store.templateAuthEditing.key })
    } else {
      resp = await api.authorizeTemplateForPagetrees($store.templateAuthEditing.key, state.pagetrees)
      modalContext.logModalResponse(resp, state.pagetrees, { templateKey: $store.templateAuthEditing.key })
    }
    if (resp.success) {
      store.refresh($store.site.id)
      store.cancelEditTemplateAuth()
      modalContext.reset()
    }
    return { success: resp.success, messages: messageForDialog(resp.messages, ''), data: state }
  }

  async function onClickDeleteTemplateAuth (e) {
    const { key, name, pagetrees } = e.detail.template
    const pagetreesByName = keyby($store.site.pagetrees, 'name')
    store.setTemplateAuthEditing(key, name, pagetrees.map((p: string) => pagetreesByName[p].id))
    modalContext.setModal('deletetemplateauth')
  }

  async function onDeleteTemplateAuthorization () {
    if (!$store.templateAuthEditing) {
      const error: Feedback = { message: 'Something went wrong. Please contact support for assistance', type: MessageType.ERROR }
      return { success: false, messages: [error], data: {} }
    }
    const resp = await api.deauthorizeTemplate($store.templateAuthEditing.key, $store.site.id)
    modalContext.logModalResponse(resp, $store.site.id, { templateKey: $store.templateAuthEditing.key })
    if (resp.success) {
      store.refresh($store.site.id)
      store.cancelEditTemplateAuth()
      modalContext.reset()
    }
    return { success: resp.success, messages: messageForDialog(resp.messages, ''), data: {} }
  }

  function getPagetreeActions (pagetree) {
    const actions: SortableTableRowAction[] = []
    if (pagetree.type === 'SANDBOX' && pagetree.permissions.promote) {
      actions.push({ icon: launchIcon, label: 'Promote to Primary', hiddenLabel: (tree) => `Promote pagetree ${tree.name} to primary`, onClick: (tree) => onClickPromotePagetree(tree.id, tree.name) })
    }
    if (pagetree.type === 'SANDBOX' && pagetree.permissions.archive) {
      actions.push({ icon: archiveOutline, label: 'Archive', hiddenLabel: (tree) => `Archive pagetree ${tree.name}`, onClick: (tree) => onClickArchivePagetree(tree.id, tree.name) })
    }
    if (pagetree.type !== 'PRIMARY' && pagetree.permissions.delete) {
      actions.push({ icon: deleteOutline, label: 'Delete', hiddenLabel: (tree) => `Delete pagetree ${tree.name}`, onClick: (tree) => onClickDeletePagetree(tree.id, tree.name) })
    }
    return actions
  }

  async function downloadComments () {
    const rows: string[][] = [['Comment', 'Creator', 'Timestamp']]
    for (const comment of $store.site.comments) {
      rows.push([comment.comment, comment.createdBy.id, comment.createdAt])
    }
    const csvString = csv(rows)
    const j = document.createElement('a')
    j.download = 'siteaudit_' + Date.now() + '.csv'
    j.href = URL.createObjectURL(new Blob([csvString]))
    j.click()
  }

  async function onDownloadPageList (state) {
    if (!state.pagetree) {
      return { success: false, data: {}, messages: [] }
    }
    modalContext.reset()
    const pagetree = $store.site.pagetrees.find(p => p.id === state.pagetree)
    const pages = await api.getPagetreePages(state.pagetree)
    const rows: string[][] = [['Path', 'Title', 'Template', 'Status', 'Last Modified', 'Modified By']]
    for (const page of pages) {
      rows.push([page.path, page.title ?? '', page.template?.name ?? '', (page.published ? 'Published' : 'Not Published'), page.modifiedAt, page.modifiedBy.id])
    }
    const csvString = csv(rows)
    const j = document.createElement('a')
    j.download = `${$store.site.name}_${pagetree!.name}_pages_` + Date.now() + '.csv'
    j.href = URL.createObjectURL(new Blob([csvString]))
    j.click()
    return { success: true, data: {}, messages: [] }
  }
</script>

<DetailPageContent>
  <div class="button-container">
    <button type="button" on:click={() => { modalContext.setModal('downloadcsv') }}>
      <Icon icon={exportIcon} />
      <span>Download CSV</span>
    </button>
  </div>
  <div class="panel-grid">
    <div class="vertical-group">
      <DetailPanel header="Site Information" headerColor={panelHeaderColor}>
        <DetailPanelSection>
          <div class="detail-section">
            <dl>
              <div class="dl-row">
                <span><dt>Name:</dt><dd>{$store.site.name}</dd></span>
                {#if $store.site.permissions.rename}
                  <button type="button" on:click={() => { modalContext.setModal('editbasic') }}>
                    <Icon icon={pencilIcon} hiddenLabel="Edit basic information" width="1.3em" inline/>
                  </button>
                {/if}
              </div>
              <div class="dl-row">
                <span><dt>URL:</dt><dd>{$store.site.url ? $store.site.url.prefix : 'This site is not launched.'}</dd></span>
                {#if $store.site.permissions.launch}
                  <button type="button" on:click={() => { modalContext.setModal('editlaunch') }}>
                    <Icon icon={pencilIcon} hiddenLabel="Edit URL or launch site" inline width="1.3em"/>
                  </button>
                {/if}
              </div>
            </dl>
          </div>
          <div class="detail-area-head">
            <h3>Site Management</h3>
            {#if $store.site.permissions.manageGovernance}
              <button type="button" on:click={() => { modalContext.setModal('editsitemanagement') }}>
                <Icon icon={pencilIcon} hiddenLabel="Edit site management" inline width="1.3em"/>
              </button>
            {/if}
          </div>
          <dl>
            <div class="dl-row">
              <span><dt>Organization:</dt><dd>{$store.site.organization?.name ?? ''}</dd></span>
            </div>
            <div class="dl-row">
              <span><dt>Owner:</dt><dd>{#if $store.site.owner}{$store.site.owner.name} ({$store.site.owner.id}){/if}</dd></span>
            </div>
            <div class="dl-row">
              <span><dt>Manager(s):</dt><dd>{$store.site.managers.map(m => `${m.name} (${m.id})`).join(', ')}</dd></span>
            </div>
          </dl>
        </DetailPanelSection>
      </DetailPanel>
      <DetailPanel header='Site Stages' headerColor={panelHeaderColor} button={$store.site.permissions.manageState ? { icon: plusIcon, hiddenLabel: 'add page tree', onClick: () => modalContext.setModal('addpagetree') } : undefined}>
        <DetailPanelSection>
          <SortableTable  items={$store.site.pagetrees} headers={[
            { id: 'name', label: 'Name', get: 'name', widthPercent: 65 },
            { id: 'stage', label: 'Stage', render: (tree) => titleCase(tree.type), widthPercent: 15 },
            { id: 'actions', label: 'pagetree actions', hideHeader: true, actions: (tree) => getPagetreeActions(tree), combinedActionsLabel: 'Manage', widthPercent: 20 }
          ]}/>
        </DetailPanelSection>
      </DetailPanel>
      <div class="audit-panel">
        <AuditPanel headerColor={panelHeaderColor} comments={$store.site.comments} on:addauditcomment={() => { modalContext.setModal('addcomment') } } on:downloadaudit={() => downloadComments() }/>
      </div>
    </div>
    <div class="vertical-group">
      <UserAccessPanel {panelHeaderColor} hasGroups={!!$store.groups.length}>
        <SortableTable slot="roles" items={$store.siteRoles} headers={[
          { id: 'name', label: 'Role', render: (role) => `<a href="${base}/auth/roles/${role.id}">${role.name}</a>`, widthPercent: 50 },
          { id: 'summary', label: 'Role Summary', get: 'access', widthPercent: 25 },
          { id: 'universal', label: 'Universal', icon: (role) => { return role.universal ? { icon: checkIcon, hiddenLabel: `${role.name} has access to all sites` } : { icon: minusIcon, hiddenLabel: `${role.name} has specific access to this site` } }, widthPercent: 25 }
        ]}/>
        <SortableTable slot="groups" items={$store.groups} headers={[
          { id: 'name', label: 'Group', render: (group) => `<a href="${base}/auth/groups/${group.id}">${group.name}</a>`, widthPercent: 50 },
          { id: 'summary', label: 'Role Summary', get: 'access', widthPercent: 25 },
          { id: 'source', label: 'Source Role(s)', get: 'roles', widthPercent: 25 }
        ]}/>
        <SortableTable slot="users" items={$store.users} headers={[
          { id: 'name', label: 'Name', sortable: true, sortFunction: (user) => user.lastname, render: (user) => `<a href="${base}/auth/users/${user.id}">${user.firstname} ${user.lastname}</a>`, widthPercent: 50 },
          { id: 'summary', label: 'Role Summary', get: 'access', widthPercent: 25 },
          { id: 'source', label: 'Source Role(s)', get: 'roles', widthPercent: 25 }
        ]} />
      </UserAccessPanel>
      <DetailPanel header="Authorized Templates" headerColor={panelHeaderColor}>
        <DetailPanelSection>
          <div class="templates-mobile">
            <Tabs tabs={[{ name: 'Page templates' }, { name: 'Component templates' }]} accordionOnMobile={false}>
              <Tab name="Page templates">
                <TemplateAvailability type="page" authorizedTemplates={$store.pageTemplates} universalTemplates={universalPageTemplates.map(t => t.name)} unAuthorizedTemplates={data.allPageTemplates.filter(t => !t.universal && !authorizedPageTemplateKeys.has(t.key))} on:editauth={(e) => onClickEditTemplateAuth(e)} on:removeauth={(e) => onClickDeleteTemplateAuth(e)} on:addtemplate={(e) => onClickAuthorizeTemplate(e)}/>
              </Tab>
              <Tab name="Component templates">
                <TemplateAvailability type="component" authorizedTemplates={$store.componentTemplates} universalTemplates={universalComponentTemplates.map(t => t.name)} unAuthorizedTemplates={data.allComponentTemplates.filter(t => !t.universal && !authorizedComponentTemplateKeys.has(t.key))} on:editauth={(e) => onClickEditTemplateAuth(e)} on:removeauth={(e) => onClickDeleteTemplateAuth(e)} on:addtemplate={(e) => onClickAuthorizeTemplate(e)}/>
              </Tab>
            </Tabs>
          </div>
          <div class="templates-desktop">
            <h3 class="template-header">Page templates</h3>
            <TemplateAvailability type="page" authorizedTemplates={$store.pageTemplates} universalTemplates={universalPageTemplates.map(t => t.name)} unAuthorizedTemplates={data.allPageTemplates.filter(t => !t.universal && !authorizedPageTemplateKeys.has(t.key))} on:editauth={(e) => onClickEditTemplateAuth(e)} on:removeauth={(e) => onClickDeleteTemplateAuth(e)} on:addtemplate={(e) => onClickAuthorizeTemplate(e)}/>
            <h3 class="template-header">Specially authorized component templates</h3>
            <TemplateAvailability type="component" authorizedTemplates={$store.componentTemplates} universalTemplates={universalComponentTemplates.map(t => t.name)} unAuthorizedTemplates={data.allComponentTemplates.filter(t => !t.universal && !authorizedComponentTemplateKeys.has(t.key))} on:editauth={(e) => onClickEditTemplateAuth(e)} on:removeauth={(e) => onClickDeleteTemplateAuth(e)} on:addtemplate={(e) => onClickAuthorizeTemplate(e)}/>
          </div>
        </DetailPanelSection>
      </DetailPanel>
      <div class="audit-panel mobile">
        <AuditPanel headerColor={panelHeaderColor} comments={$store.site.comments} on:addauditcomment={() => { modalContext.setModal('addcomment') } }/>
      </div>
    </div>
  </div>
</DetailPageContent>
{#if $modalContext.modal === 'addcomment'}
  <FormDialog
    submit={onAddComment}
    name='addcomment'
    title='Add Comment'
    on:escape={modalContext.onModalEscape}>
    <FieldText path='comment' label='Comment'/>
  </FormDialog>
{:else if $modalContext.modal === 'editbasic'}
  <FormDialog
    submit={onRenameSite}
    validate={validateBasicInfo}
    name='editbasic'
    title='Rename Site'
    preload={{ name: $store.site.name }}
    on:escape={modalContext.onModalEscape}>
    <FieldText path='name' label='Name' required/>
  </FormDialog>
{:else if $modalContext.modal === 'editsitemanagement'}
  <FormDialog
    submit={onEditSiteManagement}
    name='editsitemanagement'
    title="Edit Site Management"
    preload={{ organization: $store.site.organization?.id, owner: $store.site.owner?.id, managers: $store.site.managers?.map(m => m.id) }}
    on:escape={modalContext.onModalEscape}>
    <FieldSelect path='organization' label='Organization' choices={data.organizations.map(o => ({ label: o.name, value: o.id }))}/>
    <FieldAutocomplete path='owner' label='Site Owner' placeholder='Please Select' choices={data.users.map(u => ({ label: `${u.name} (${u.id})`, value: u.id }))}/>
    <FieldMultiselect path='managers' label='Site Managers' getOptions={searchUsers}/>
  </FormDialog>
{:else if $modalContext.modal === 'editlaunch'}
  <FormDialog
    submit={onSetLaunchURL}
    name='editlaunch'
    title='Set Public URL'
    preload={{ host: $store.site.url?.host ?? '', path: $store.site.url?.path ?? '', enabled: $store.site.url?.enabled }}
    on:escape={modalContext.onModalEscape}>
    <FieldText path='host' label='Host'/>
    <FieldText path='path' label='Path'/>
    <FieldCheckbox path='enabled' label='Site Launched' boxLabel='This site is live.'/>
  </FormDialog>
{:else if $modalContext.modal === 'addpagetree'}
  <CreateWithPageDialog
    submit={onAddPagetree}
    validate={validateAddPagetree}
    title="Add Pagetree"
    propertyDialogTitle= 'Root Page Properties'
    addName={false}
    templateChoices={data.allPageTemplates.map(t => ({ label: t.name, value: t.key }))}
    on:escape={modalContext.onModalEscape}
    on:saved={onAddPagetreeComplete}/>
{:else if $modalContext.modal === 'editpagetree'}
  <FormDialog
    name="editpagetree"
    title="Rename Pagetree"
    submit={onRenamePagetree}
    preload={{ name: $store.editingPagetree?.name }}
    on:escape={() => { store.cancelEditPagetree(); modalContext.onModalEscape() }}>
    <FieldText path="name" label="Name" required/>
  </FormDialog>
{:else if $modalContext.modal === 'deletepagetree'}
  <Dialog
    on:escape={() => { store.cancelEditPagetree(); modalContext.onModalEscape() }}
    continueText="Delete"
    cancelText="Cancel"
    title="Delete Pagetree"
    on:continue={onDeletePagetree}>
  Delete this pagetree?
  </Dialog>
{:else if $modalContext.modal === 'promotepagetree'}
  <Dialog
    on:escape={() => { store.cancelEditPagetree(); modalContext.onModalEscape() }}
    continueText="Promote"
    cancelText="Cancel"
    title="Promote Pagetree"
    on:continue={onPromotePagetree}>
    <div>Promote this pagetree to primary? The current primary pagetree will be archived.</div>
    {#if !$store.site.url?.enabled}
      <br/>
      <DialogWarning text="This site is not currently launched. You can promote this page tree, but the site will not
      be launched until it has a URL and is set to be live." />
    {/if}
  </Dialog>
{:else if $modalContext.modal === 'archivepagetree'}
  <Dialog
    on:escape={() => { store.cancelEditPagetree(); modalContext.onModalEscape() }}
    continueText="Archive"
    cancelText="Cancel"
    title="Archive Pagetree"
    on:continue={onArchivePagetree}>
    Archive this pagetree?
  </Dialog>
{:else if $modalContext.modal === 'authorizetemplate'}
  <FormDialog
    name="authorizetemplate"
    title="Authorize Template"
    on:escape={() => { store.cancelEditTemplateAuth(); modalContext.onModalEscape() }}
    submit={authorizeTemplate}>
    <div>Authorize for use in specific pagetrees, or leave blank to authorize for all pagetrees in the site.</div>
    <FieldMultiselect path='pagetrees' label='Authorized for' getOptions={searchPagetrees}/>
  </FormDialog>
{:else if $modalContext.modal === 'edittemplates'}
  <FormDialog
    name='edittemplates'
    title='Edit Authorized Pagetrees'
    on:escape={() => { store.cancelEditTemplateAuth(); modalContext.onModalEscape() }}
    validate={async () => { return [] }}
    preload={{ pagetrees: $store.templateAuthEditing?.pagetrees ?? [] }}
    submit={onEditTemplateAuthorizations}>
    <FieldMultiselect path='pagetrees' label='Authorized for' getOptions={searchPagetrees} lookupByValue={lookupPagetreeByValue}/>
  </FormDialog>
{:else if $modalContext.modal === 'deletetemplateauth'}
  <Dialog
    on:escape={() => { store.cancelEditTemplateAuth(); modalContext.onModalEscape() }}
    continueText="Remove"
    cancelText="Cancel"
    title="Remove Template Authorization"
    on:continue={onDeleteTemplateAuthorization}>
    Are you sure you want to remove this template from the authorized templates? Existing content will remain
    but editors will no longer be able to use this template on this site or any pagetrees in this site.
  </Dialog>
{:else if $modalContext.modal === 'downloadcsv'}
  <FormDialog
    name='downloadcsv'
    title='Download Page List'
    on:escape={modalContext.onModalEscape}
    submit={onDownloadPageList}>
    <FieldSelect path='pagetree' label='Pagetree' choices={$store.site.pagetrees.map(p => ({ label: p.name, value: p.id }))} required/>
  </FormDialog>
{/if}
<style>
  .detail-section:not(:last-child) {
    margin-bottom: 1em;
  }
  .detail-area-head {
    display: flex;
    border-bottom: 1px solid #707070;
    margin-bottom: 1em;
  }
  h3 {
    margin: 0;
    font-weight: bold;
    font-size: 1em;
  }
  dl {
    margin: 0;
  }
  dl .dl-row {
    display: flex;
    justify-content: space-between;
    padding: 0.5em 0;
    border-bottom: 1px dashed #707070;
  }
  dl .dl-row span {
    display: flex;
    gap: 5px;
  }
  dt {
    font-weight: bold
  }
  dd {
    margin-left: 0;
  }
  dd, dt {
    display: inline;
  }
  button {
    background-color: transparent;
    border: 0px;
    cursor: pointer;
    margin-left: 0.5em;
  }
  .templates-mobile { display: none; }
  :global([data-eq~="450px"]) .templates-mobile {
    display: block
  }

  :global([data-eq~="450px"]) .templates-desktop {
    display: none;
  }

  h3.template-header {
    font-size: 1.2em;
    margin: 1.2em 0;
  }

  .button-container {
    display: flex;
    justify-content: flex-end;
  }
  .button-container button {
    background-color: #501214;
    color: #ffffff;
    padding: 10px 15px;
    text-decoration: none;
    border-radius: 4px;
    display: inline-flex;
    align-items: center;
    margin-bottom: 1em;
  }
  .button-container button span {
    margin-left: 0.5em;
  }
  .panel-grid {
    display: grid;
    gap: 1em;
    grid-template-columns: 1.5fr 2fr;
  }
  .vertical-group {
    display: flex;
    flex-direction: column;
    gap: 1em;
  }
  :global([data-eq~="800px"]) .panel-grid {
    grid-template-columns: 1fr;
  }
  .audit-panel.mobile {
    display: none;
  }
  :global([data-eq~="800px"]) .audit-panel {
    display: none;
  }
  :global([data-eq~="800px"]) .audit-panel.mobile {
    display: block;
  }
</style>
