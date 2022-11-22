<script lang="ts">
  import pencilIcon from '@iconify-icons/ph/pencil-light'
  import plusIcon from '@iconify-icons/ph/plus-light'
  import deleteOutline from '@iconify-icons/ph/trash-light'
  import archiveOutline from '@iconify-icons/ph/archive-light'
  import checkIcon from '@iconify-icons/ph/check-light'
  import minusIcon from '@iconify-icons/ph/minus-light'
  import launchIcon from '@iconify-icons/ph/rocket-launch-light'
  import deauthorizeIcon from '@iconify-icons/ph/minus-circle-light'
  import authorizeIcon from '@iconify-icons/ph/plus-circle-light'
  import { Dialog, Icon, FieldText, FieldSelect, FieldMultiselect, FieldCheckbox, FieldAutocomplete, FormDialog } from '@dosgato/dialog'
  import { eq, ScreenReaderOnly } from '@txstate-mws/svelte-components'
  import { type Feedback, MessageType } from '@txstate-mws/svelte-forms'
  import { DateTime } from 'luxon'
  import { keyby, titleCase } from 'txstate-utils'
  import { api, DetailPanel, ensureRequiredNotNull, messageForDialog, type CreateWithPageState, type Organization, type UserListUser, type TemplateListTemplate, templateListStore, siteDetails, Accordion } from '$lib'
  import { base } from '$app/paths'
  import { store } from './+page'
  import CreateWithPageDialog from '$lib/components/dialogs/CreateWithPageDialog.svelte'

  export let data: { organizations: Organization[], users: UserListUser[], allPageTemplates: TemplateListTemplate[], allComponentTemplates: TemplateListTemplate[] }
  let modal: 'editbasic'|'editsitemanagement'|'editlaunch'|'addcomment'|'addpagetree'|'editpagetree'|'deletepagetree'| 'authorizetemplate' |
    'promotepagetree'|'archivepagetree'|'edittemplates'|'addpagetemplates'|'addcomponenttemplates'|'deletetemplateauth'|undefined = undefined

  const pagetreesByName = keyby($store.site.pagetrees, 'name')
  $: authorizedPageTemplateKeys = new Set($store.pageTemplates.map(t => t.key))
  $: authorizedComponentTemplateKeys = new Set($store.componentTemplates.map(t => t.key))
  $: universalComponentTemplates = data.allComponentTemplates.filter(t => t.universal && !authorizedComponentTemplateKeys.has(t.key))
  $: universalPageTemplates = data.allPageTemplates.filter(t => t.universal && !authorizedPageTemplateKeys.has(t.key))

  async function searchUsers (search) {
    const query = search.toLowerCase()
    return data.users.filter(u => {
      return u.name.toLowerCase().includes(query) || u.id.includes(query)
    }).map(u => ({ label: u.name, value: u.id }))
  }

  async function searchPagetrees (term) {
    return $store.site.pagetrees.filter(p => p.name.includes(term)).map(p => ({ label: p.name, value: p.id }))
  }

  async function addComment (state) {
    const resp = await api.addSiteComment($store.site.id, state.comment)
    if (resp.success) {
      store.refresh($store.site.id)
      modal = undefined
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

  async function renameSite (state) {
    const resp = await api.renameSite($store.site.id, state.name, false)
    if (resp.success) {
      store.refresh($store.site.id)
      modal = undefined
    }
    return { success: resp.success, messages: messageForDialog(resp.messages, ''), data: state }
  }

  async function editSiteManagement (state) {
    const resp = await api.updateSiteManagement($store.site.id, state.organization, state.owner, state.managers)
    if (resp.success) {
      store.refresh($store.site.id)
      modal = undefined
    }
    return { success: resp.success, messages: messageForDialog(resp.messages, 'args'), data: state }
  }

  async function setLaunchURL (state) {
    const resp = await api.setLaunchURL($store.site.id, state.host, state.path, state.enabled ?? false)
    if (resp.success) {
      store.refresh($store.site.id)
      modal = undefined
    }
    return { success: resp.success, messages: messageForDialog(resp.messages, ''), data: state }
  }

  async function validateAddPagetree (state) {
    const resp = await api.addPagetree($store.site.id, state.name, state.templateKey, state.data, true)
    return resp.messages.map(m => ({ ...m, path: m.arg }))
  }

  async function onAddPagetree (state: CreateWithPageState) {
    const resp = await api.addPagetree($store.site.id, state.name, state.templateKey, state.data)
    return {
      success: resp.success,
      messages: resp.messages.map(m => ({ ...m, path: m.arg })),
      data: state
    }
  }

  function onAddPagetreeComplete () {
    store.refresh($store.site.id)
    modal = undefined
  }

  async function onClickEditPagetree (id, name) {
    store.setPagetreeEditing(id, name)
    modal = 'editpagetree'
  }

  async function onRenamePagetree (state) {
    if (!$store.editingPagetree) {
      const error: Feedback = { message: 'Something went wrong. Please contact support for assistance', type: MessageType.ERROR }
      return { success: false, messages: [error], data: state }
    }
    const resp = await api.updatePagetree($store.editingPagetree.id, state.name)
    if (resp.success) {
      store.refresh($store.site.id)
      store.cancelEditPagetree()
      modal = undefined
    }
    return { success: resp.success, messages: messageForDialog(resp.messages, ''), data: state }
  }

  async function onClickDeletePagetree (id, name) {
    store.setPagetreeEditing(id, name)
    modal = 'deletepagetree'
  }

  async function onDeletePagetree () {
    if (!$store.editingPagetree) {
      const error: Feedback = { message: 'Something went wrong. Please contact support for assistance', type: MessageType.ERROR }
      return { success: false, messages: [error], data: {} }
    }
    const resp = await api.deletePagetree($store.editingPagetree.id)
    if (resp.success) {
      store.refresh($store.site.id)
      store.cancelEditPagetree()
      modal = undefined
    }
    return { success: resp.success, messages: messageForDialog(resp.messages, ''), data: {} }
  }

  async function onClickPromotePagetree (id, name) {
    store.setPagetreeEditing(id, name)
    modal = 'promotepagetree'
  }

  async function onPromotePagetree () {
    if (!$store.editingPagetree) {
      const error: Feedback = { message: 'Something went wrong. Please contact support for assistance', type: MessageType.ERROR }
      return { success: false, messages: [error], data: {} }
    }
    const resp = await api.promotePagetree($store.editingPagetree.id)
    if (resp.success) {
      store.refresh($store.site.id)
      store.cancelEditPagetree()
      modal = undefined
    }
    return { success: resp.success, messages: messageForDialog(resp.messages, ''), data: {} }
  }

  async function onClickArchivePagetree (id, name) {
    store.setPagetreeEditing(id, name)
    modal = 'archivepagetree'
  }

  async function onArchivePagetree () {
    if (!$store.editingPagetree) {
      const error: Feedback = { message: 'Something went wrong. Please contact support for assistance', type: MessageType.ERROR }
      return { success: false, messages: [error], data: {} }
    }
    const resp = await api.archivePagetree($store.editingPagetree.id)
    if (resp.success) {
      store.refresh($store.site.id)
      store.cancelEditPagetree()
      modal = undefined
    }
    return { success: resp.success, messages: messageForDialog(resp.messages, ''), data: {} }
  }

  function onClickAuthorizeTemplate (key: string, name: string, pagetrees: string[]) {
    store.setTemplateAuthEditing(key, name, pagetrees)
    modal = 'authorizetemplate'
  }

  async function authorizeTemplate (state) {
    if (!$store.templateAuthEditing) {
      const error: Feedback = { message: 'Something went wrong. Please contact support for assistance', type: MessageType.ERROR }
      return { success: false, messages: [error], data: state }
    }
    if (state.pagetrees.length === 0) {
      // no pagetrees selected, authorize template at site level
      const resp = await api.authorizeTemplateForSite($store.templateAuthEditing.key, $store.site.id)
      if (resp.success) {
        store.refresh($store.site.id)
        modal = undefined
      }
      return { success: resp.success, messages: messageForDialog(resp.messages, ''), data: state }
    } else {
      const resp = await api.authorizeTemplateForPagetrees($store.templateAuthEditing.key, state.pagetrees)
      if (resp.success) {
        store.refresh($store.site.id)
        store.cancelEditTemplateAuth()
        modal = undefined
      }
      return { success: resp.success, messages: messageForDialog(resp.messages, ''), data: state }
    }
  }

  async function onClickEditTemplateAuth (key: string, name: string, pagetrees: string[]) {
    store.setTemplateAuthEditing(key, name, pagetrees.map((p: string) => pagetreesByName[p].id))
    modal = 'edittemplates'
  }

  async function editTemplateAuthorizations (state) {
    if (!$store.templateAuthEditing) {
      const error: Feedback = { message: 'Something went wrong. Please contact support for assistance', type: MessageType.ERROR }
      return { success: false, messages: [error], data: state }
    }
    let resp
    if (state.pagetrees.length === 0) {
      resp = await api.authorizeTemplateForSite($store.templateAuthEditing.key, $store.site.id)
    } else {
      resp = await api.authorizeTemplateForPagetrees($store.templateAuthEditing.key, state.pagetrees)
    }
    if (resp.success) {
      store.refresh($store.site.id)
      store.cancelEditTemplateAuth()
      modal = undefined
    }
    return { success: resp.success, messages: messageForDialog(resp.messages, ''), data: state }
  }

  async function onClickDeleteTemplateAuth (key: string, name: string, pagetrees: string[]) {
    store.setTemplateAuthEditing(key, name, pagetrees.map((p: string) => pagetreesByName[p].id))
    modal = 'deletetemplateauth'
  }

  async function onDeleteTemplateAuthorization () {
    if (!$store.templateAuthEditing) {
      const error: Feedback = { message: 'Something went wrong. Please contact support for assistance', type: MessageType.ERROR }
      return { success: false, messages: [error], data: {} }
    }
    const resp = await api.deauthorizeTemplate($store.templateAuthEditing.key, $store.site.id)
    if (resp.success) {
      store.refresh($store.site.id)
      store.cancelEditTemplateAuth()
      modal = undefined
    }
    return { success: resp.success, messages: messageForDialog(resp.messages, ''), data: {} }
  }

  function hasBackground (total, index) {
    const inFirstColumn = index < total / 2
    if (inFirstColumn) return index % 2 === 0
    else {
      const secondColStartIndex = Math.ceil(total / 2)
      return (index - secondColStartIndex) % 2 === 0
    }
  }
</script>

<DetailPanel header="Site Information">
  <div class="detail-section">
    <dl>
      <dt>Name:</dt>
      <dd>
        <span>{$store.site.name}</span>
        {#if $store.site.permissions.rename}
          <button on:click={() => { modal = 'editbasic' }}>
            <Icon icon={pencilIcon} hiddenLabel="Edit basic information" width="1.3em" inline/>
          </button>
        {/if}
      </dd>
      <dt>URL:</dt>
      <dd>
        {#if $store.site.url}
          {$store.site.url.prefix}
        {:else}
          This site is not launched.
        {/if}
        {#if $store.site.permissions.launch}
          <button on:click={() => { modal = 'editlaunch' }}>
            <Icon icon={pencilIcon} hiddenLabel="Edit URL or launch site" inline width="1.3em"/>
          </button>
        {/if}
      </dd>
    </dl>
  </div>
  <div class="detail-area-head">
    <h3>Site Management</h3>
    {#if $store.site.permissions.manageGovernance}
      <button on:click={() => { modal = 'editsitemanagement' }}>
        <Icon icon={pencilIcon} hiddenLabel="Edit site management" inline width="1.3em"/>
      </button>
    {/if}
  </div>
  <dl>
    <dt>Organization:</dt>
    <dd>{$store.site.organization?.name ?? ''}</dd>
    <dt>Owner:</dt>
    <dd>
      {#if $store.site.owner}{$store.site.owner.name} ({$store.site.owner.id}){/if}
    </dd>
    <dt>Manager(s):</dt>
    <dd>
      <ul class='manager-list'>
        {#each $store.site.managers as manager (manager.id)}
        <li>{manager.name} ({manager.id})</li>
        {/each}
      </ul>
    </dd>
  </dl>
</DetailPanel>

<DetailPanel header='Site Stages' button={$store.site.permissions.manageState ? { icon: plusIcon, hiddenLabel: 'add page tree', onClick: () => { modal = 'addpagetree' } } : undefined}>
  <table>
    <tr class='headers'>
      <th>Name</th>
      <th>Stage</th>
      <td><ScreenReaderOnly>No data</ScreenReaderOnly></td>
    </tr>
    {#each $store.site.pagetrees as pagetree (pagetree.id)}
      <tr>
        <td>{pagetree.name}</td>
        <td>{titleCase(pagetree.type)}</td>
        <td class="pagetree-buttons">
          {#if pagetree.type === 'SANDBOX' && pagetree.permissions.promote}
            <button title="Promote to Primary" on:click={() => { onClickPromotePagetree(pagetree.id, pagetree.name) }}><Icon icon={launchIcon} width="1.3em"/><ScreenReaderOnly>promote page tree</ScreenReaderOnly></button>
          {/if}
          {#if pagetree.type === 'SANDBOX' && pagetree.permissions.archive}
            <button title="Archive" on:click={() => { onClickArchivePagetree(pagetree.id, pagetree.name) }}><Icon icon={archiveOutline} width="1.3em"/><ScreenReaderOnly>archive page tree</ScreenReaderOnly></button>
          {/if}
          {#if pagetree.type !== 'PRIMARY' && pagetree.permissions.delete}
            <button title="Delete" on:click={() => { onClickDeletePagetree(pagetree.id, pagetree.name) }}><Icon icon={deleteOutline} width="1.3em"/><ScreenReaderOnly>delete page tree</ScreenReaderOnly></button>
          {/if}
        </td>
      </tr>
    {/each}
  </table>
</DetailPanel>

<DetailPanel header="User Access">
  <div class="detail-section">
    <table class="access">
      <caption><h3>Roles</h3></caption>
      <thead>
        <tr>
          <th>Role</th>
          <th class="read-only">Read-Only</th>
          <th class="universal">Universal</th>
        </tr>
      </thead>
      <tbody>
        {#each $store.siteRoles as role (role.id)}
          <tr>
            <td><div class="carded-label">Role:</div><a href={`${base}/auth/roles/${role.id}`}>{role.name}</a></td>
            <td><div class="carded-label">Read-Only:</div><Icon icon={role.readonly ? checkIcon : minusIcon} hiddenLabel={`${role.name} role has ${role.readonly ? 'read-only' : 'write'} access to this site`}/></td>
            <td class="col3"><div class="carded-label">Universal:</div><Icon icon={minusIcon} hiddenLabel={`${role.name} is a site-specific role`}/></td>
          </tr>
        {/each}
        {#each $store.globalRoles as role (role.id)}
          <tr>
            <td><div class="carded-label">Role:</div><a href={`${base}/auth/roles/${role.id}`}>{role.name}</a></td>
            <td><div class="carded-label">Read-Only:</div><Icon icon={role.readonly ? checkIcon : minusIcon} hiddenLabel={`${role.name} role has ${role.readonly ? 'read-only' : 'write'} access to this site`}/></td>
            <td class="col3"><div class="carded-label">Universal:</div><Icon icon={checkIcon} hiddenLabel={`${role.name} applies to all sites`}/></td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
  {#if $store.groups.length}
  <div class="detail-section">
    <table class="access">
      <caption><h3>Groups</h3></caption>
      <thead>
        <tr>
          <th>Group</th>
          <th class="read-only">Read-Only</th>
          <th class="source-roles">Source Role(s)</th>
        </tr>
      </thead>
      <tbody>
        {#each $store.groups as group (group.id)}
          <tr>
            <td><div class="carded-label">Group:</div><a href={`${base}/auth/groups/${group.id}`}>{group.name}</a></td>
            <td><div class="carded-label">Read-Only:</div><Icon icon={group.readonly ? checkIcon : minusIcon} hiddenLabel={`${group.name} has ${group.readonly ? 'read-only' : 'write'} access to this site`}/></td>
            <td><div class="carded-label">Source Role(s):</div>{group.roles}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
  {/if}
  <div class="detail-section">
    <table class="access">
      <caption><h3>Users</h3></caption>
      <thead>
        <tr>
          <th>Name</th>
          <th class="read-only">Read-Only</th>
          <th class="source-roles">Source Role(s)</th>
        </tr>
      </thead>
      <tbody>
        {#each $store.users as user (user.id)}
          <tr>
            <td><div class="carded-label">Name:</div><a href={`${base}/auth/users/${user.id}`}>{user.name}</a></td>
            <td><div class="carded-label">Read-Only:</div><Icon icon={user.readonly ? checkIcon : minusIcon} hiddenLabel={`${user.name} has ${user.readonly ? 'read-only' : 'write'} access to this site`}/></td>
            <td><div class="carded-label">Source Role(s):</div>{user.roles}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</DetailPanel>

<DetailPanel header="Authorized Templates">
  <div class="template-section">
    <div class="detail-area-head">
      <h3>Page Templates</h3>
    </div>
    {#if $store.pageTemplates.length}
      <table class="authorized-templates">
        <tr>
          <th>Template Name</th>
          <th>Authorized Pagetree(s)</th>
          <td><ScreenReaderOnly>No Data</ScreenReaderOnly></td>
        </tr>
        {#each $store.pageTemplates as template (template.key)}
          <tr>
            <td>{template.name}</td>
            <td>{template.pagetrees.length ? template.pagetrees.join(', ') : 'All Pagetrees'}</td>
            <td>
              {#if template.permissions.assign}
                <button on:click={() => { onClickEditTemplateAuth(template.key, template.name, template.pagetrees) }}><Icon icon={pencilIcon} width="1.5em"/></button>
                <button on:click={() => { onClickDeleteTemplateAuth(template.key, template.name, template.pagetrees) }}><Icon icon={deauthorizeIcon} width="1.5em"/></button>
              {/if}
            </td>
          </tr>
        {/each}
      </table>
    {/if}
    <div class="template-accordion-wrapper">
      <Accordion title="Universal Page Templates">
        <div class="wrapper">
          <ul class="universal-templates" style={`grid-template-rows: repeat(${Math.ceil(universalPageTemplates.length / 2)}, 1fr)`}>
            {#each universalPageTemplates as template, index}
              <li class={hasBackground(universalPageTemplates.length, index) ? 'bg' : ''}>
                {template.name}
              </li>
            {/each}
          </ul>
        </div>
      </Accordion>
    </div>
    <div class="template-accordion-wrapper">
      <Accordion title="Non-authorized Page Templates">
        <ul class="forbidden-templates">
          {#each data.allPageTemplates.filter(t => !t.universal && !authorizedPageTemplateKeys.has(t.key)) as template}
            <li>
              {template.name}
              {#if template.permissions.assign}
                <button on:click={() => { onClickAuthorizeTemplate(template.key, template.name, []) }}><Icon icon={authorizeIcon} width="1.5em"/>
                  <ScreenReaderOnly>{`deauthorize ${template.name}`}</ScreenReaderOnly>
                </button>
              {/if}
            </li>
          {/each}
        </ul>
      </Accordion>
    </div>
  </div>
  <div class="template-section">
    <div class="detail-area-head">
      <h3>Component Templates</h3>
    </div>
    {#if $store.componentTemplates.length}
      <table class="authorized-templates">
        <tr>
          <th>Template Name</th>
          <th>Authorized Pagetree(s)</th>
          <td><ScreenReaderOnly>No Data</ScreenReaderOnly></td>
        </tr>
        {#each $store.componentTemplates as template (template.key)}
          <tr>
            <td>{template.name}</td>
            <td>{template.pagetrees.length ? template.pagetrees.join(', ') : 'All Pagetrees'}</td>
            <td>
              {#if template.universal}
                <div>Universal</div>
              {:else}
                <button on:click={() => { onClickEditTemplateAuth(template.key, template.name, template.pagetrees) }}><Icon icon={pencilIcon} width="1.5em"/></button>
                <button on:click={() => { onClickDeleteTemplateAuth(template.key, template.name, template.pagetrees) }}><Icon icon={deauthorizeIcon} width="1.5em"/></button>
              {/if}
            </td>
          </tr>
        {/each}
      </table>
    {/if}
    <div class="template-accordion-wrapper">
      <Accordion title="Universal Components">
        <div class="wrapper">
          <ul class="universal-templates" style={`grid-template-rows: repeat(${Math.ceil(universalComponentTemplates.length / 2)}, 1fr)`}>
            {#each universalComponentTemplates as template, index}
              <li class={hasBackground(universalComponentTemplates.length, index) ? 'bg' : ''}>
                {template.name}
              </li>
            {/each}
          </ul>
        </div>
      </Accordion>
    </div>
    <div class="template-accordion-wrapper">
      <Accordion title="Non-authorized Components">
        <ul class="forbidden-templates">
          {#each data.allComponentTemplates.filter(t => !t.universal && !authorizedComponentTemplateKeys.has(t.key)) as template}
          <li>
            {template.name}
            {#if template.permissions.assign}
                <button on:click={() => { onClickAuthorizeTemplate(template.key, template.name, []) }}><Icon icon={authorizeIcon} width="1.5em"/>
                  <ScreenReaderOnly>{`deauthorize ${template.name}`}</ScreenReaderOnly>
                </button>
            {/if}
          </li>
          {/each}
        </ul>
      </Accordion>
    </div>
  </div>
</DetailPanel>

<DetailPanel header="Audit" button={{ icon: plusIcon, hiddenLabel: 'add comment', onClick: () => { modal = 'addcomment' } }}>
  {#if $store.site.comments.length}
    <ul use:eq>
      {#each $store.site.comments.reverse() as comment (comment.id)}
        <li class='comment-card'>
          <span class="comment-text">{comment.comment}</span>
          <div>
            <span class="comment-date">{DateTime.fromISO(comment.createdAt).toFormat('LLL d, yyyy h:mma').replace(/(AM|PM)$/, v => v.toLocaleLowerCase())}</span>
            <span class="comment-creator">{comment.createdBy.id}</span>
          </div>
        </li>
      {/each}
    </ul>
  {:else}
    No comments found.
  {/if}
</DetailPanel>
{#if modal === 'addcomment'}
  <FormDialog
    submit={addComment}
    name='addcomment'
    title='Add Comment'
    on:escape={() => { modal = undefined }}>
    <FieldText path='comment' label='Comment'/>
  </FormDialog>
{:else if modal === 'editbasic'}
  <FormDialog
    submit={renameSite}
    validate={validateBasicInfo}
    name='editbasic'
    title='Rename Site'
    preload={{ name: $store.site.name }}
    on:escape={() => { modal = undefined }}>
    <FieldText path='name' label='Name' required/>
  </FormDialog>
{:else if modal === 'editsitemanagement'}
  <FormDialog
    submit={editSiteManagement}
    name='editsitemanagement'
    title="Edit Site Management"
    preload={{ organization: $store.site.organization?.id, owner: $store.site.owner?.id, managers: $store.site.managers?.map(m => m.id) }}
    on:escape={() => { modal = undefined }}>
    <FieldSelect path='organization' label='Organization' choices={data.organizations.map(o => ({ label: o.name, value: o.id }))}/>
    <FieldAutocomplete path='owner' label='Site Owner' placeholder='Please Select' choices={data.users.map(u => ({ label: `${u.name} (${u.id})`, value: u.id }))}/>
    <FieldMultiselect path='managers' label='Site Managers' getOptions={searchUsers}/>
  </FormDialog>
{:else if modal === 'editlaunch'}
  <FormDialog
    submit={setLaunchURL}
    name='editlaunch'
    title='Set Public URL'
    preload={{ host: $store.site.url?.host ?? '', path: $store.site.url?.path ?? '', enabled: $store.site.url?.enabled }}
    on:escape={() => { modal = undefined }}>
    <FieldText path='host' label='Host'/>
    <FieldText path='path' label='Path'/>
    <FieldCheckbox path='enabled' label='Site Launched' boxLabel='This site is live.'/>
  </FormDialog>
{:else if modal === 'addpagetree'}
  <CreateWithPageDialog
    submit={onAddPagetree}
    validate={validateAddPagetree}
    title="Add Pagetree"
    templateChoices={$store.site.pageTemplates.map(t => ({ label: t.name, value: t.key }))}
    on:escape={() => { modal = undefined }}
    on:saved={onAddPagetreeComplete}/>
{:else if modal === 'editpagetree'}
  <FormDialog
    name="editpagetree"
    title="Rename Pagetree"
    submit={onRenamePagetree}
    preload={{ name: $store.editingPagetree?.name }}
    on:escape={() => { store.cancelEditPagetree(); modal = undefined }}>
    <FieldText path="name" label="Name" required/>
  </FormDialog>
{:else if modal === 'deletepagetree'}
  <Dialog
    on:escape={() => { store.cancelEditPagetree(); modal = undefined }}
    continueText="Delete"
    cancelText="Cancel"
    title="Delete Pagetree"
    on:continue={onDeletePagetree}>
  Delete this pagetree?
  </Dialog>
{:else if modal === 'promotepagetree'}
  <Dialog
    on:escape={() => { store.cancelEditPagetree(); modal = undefined }}
    continueText="Promote"
    cancelText="Cancel"
    title="Promote Pagetree"
    on:continue={onPromotePagetree}>
    Promote this pagetree to primary? The current primary pagetree will be archived.
  </Dialog>
{:else if modal === 'archivepagetree'}
  <Dialog
    on:escape={() => { store.cancelEditPagetree(); modal = undefined }}
    continueText="Archive"
    cancelText="Cancel"
    title="Archive Pagetree"
    on:continue={onArchivePagetree}>
    Archive this pagetree?
  </Dialog>
{:else if modal === 'authorizetemplate'}
  <FormDialog
    name="authorizetemplate"
    title="Authorize Template"
    on:escape={() => { store.cancelEditTemplateAuth(); modal = undefined }}
    submit={authorizeTemplate}>
    <div>Authorize for use in specific pagetrees, or leave blank to authorize for all pagetrees in the site.</div>
    <FieldMultiselect path='pagetrees' label='Authorized for' getOptions={searchPagetrees}/>
  </FormDialog>
{:else if modal === 'edittemplates'}
  <FormDialog
    name='edittemplates'
    title='Edit Authorized Pagetrees'
    on:escape={() => { store.cancelEditTemplateAuth(); modal = undefined }}
    validate={async () => { return [] }}
    preload={{ pagetrees: $store.templateAuthEditing?.pagetrees ?? [] }}
    submit={editTemplateAuthorizations}>
    <FieldMultiselect path='pagetrees' label='Authorized for' getOptions={searchPagetrees}/>
  </FormDialog>
{:else if modal === 'deletetemplateauth'}
  <Dialog
    on:escape={() => { store.cancelEditTemplateAuth(); modal = undefined }}
    continueText="Remove"
    cancelText="Cancel"
    title="Remove Template Authorization"
    on:continue={onDeleteTemplateAuthorization}>
    Are you sure you want to remove this template from the authorized templates? Existing content will remain
    but editors will no longer be able to use this template on this site or any pagetrees in this site.
  </Dialog>
{/if}
<style>
  .detail-section:not(:last-child) {
    margin-bottom: 4em;
  }
  .detail-area-head {
    display: flex;
    margin-bottom: 1.5em;
  }
  h3 {
    margin: 0;
    font-weight: normal;
    font-size: 1.3em;
  }
  dl {
    display: grid;
    grid-template-columns: min-content auto;
    grid-gap: 10px;
    align-items: baseline;
    margin-block-start: 0;
  }
  dl dt {
    font-weight: bold;
  }
  dd {
    display: flex;
    align-items: center;
  }
  button {
    background-color: transparent;
    border: 0px;
    cursor: pointer;
    margin-left: 0.5em;
  }
  .manager-list {
    padding-left: 0;
    margin: 0;
    list-style: none;
  }
  ul {
    list-style: none;
    padding-left: 0;
  }
  li {
    border-bottom: 1px dashed #aaa;
    padding: 0.6em 0em;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 1em;
  }
  table tr td, table tr th {
    text-align: left;
    padding: 0.2em 0;
  }
  table tr.headers {
    border-bottom: 1px solid #ebebeb;
  }
  table tr { border-bottom: 1px dashed #ebebeb }
  table tr:nth-child(even) { background-color: #f6f7f9 }

  .pagetree-buttons {
    text-align: right;
  }

  /* User Access */
  table.access caption {
    display: none;
  }

  table.access th {
    width: calc(100%/3);
  }

  table.access th.read-only{
    text-align: center;
  }

  table.access td .carded-label {
    display: none;
    font-weight: bold;
  }

  table.access td:nth-child(2) {
    text-align: center;
  }

  table.access td.col3 {
    padding-left: 1.5em;
  }

  [data-eq~="600px"] table.access caption {
    display: table-caption;
    text-align: left;
  }

  [data-eq~="600px"] .detail-section table.access {
    border-collapse: separate;
    border-spacing: 0 1em;
  }
  [data-eq~="600px"] table.access tr {
    background-color: #f6f7f9;
  }
  [data-eq~="600px"] table.access thead {
    display: none;
  }
  [data-eq~="600px"] table.access tr td {
    display: flex;
    justify-content: space-between;
    padding: 0.5em;
  }
  [data-eq~="600px"] table.access tr td:not(:last-child) {
    border-bottom: 1px dashed #ebebeb;
  }
  [data-eq~="600px"] table.access td .carded-label {
    display: block;
  }

  .template-section:not(:last-child) {
    margin-bottom: 4em;
  }

  table.authorized-templates, .template-accordion-wrapper {
    margin-bottom: 1em;
  }

  .universal-templates {
    display: grid;
    grid-auto-flow: column;
    grid-template-columns: 1fr 1fr;
    column-gap: 20%;
  }

  .universal-templates li.bg {
    background-color: #f6f7f9;
  }


  [data-eq~="600px"] .wrapper .universal-templates {
    display: flex;
    flex-direction: column;
  }
  [data-eq~="600px"] .universal-templates li.bg {
    background-color: unset;
  }
  [data-eq~="600px"] .universal-templates li:nth-child(odd) {
    background-color: #f6f7f9;
  }


  .forbidden-templates {
    width: 50%;
  }

  .forbidden-templates li {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .forbidden-templates li:nth-child(odd) {
    background-color: #f6f7f9;
  }

  td button {
    border: 0;
    padding: 0;
    background-color: transparent;
  }
  td button:not(:last-child) {
    margin-right: 0.5em;
  }
  /* Audit */
  li.comment-card {
    display: flex;
    flex-direction: column;
    padding: 0.5em;
  }
  li.comment-card:nth-child(even) {
    background-color: #f6f7f9;
  }
  li.comment-card .comment-text {
    margin-bottom: 0.5em;
  }
  li.comment-card div {
    display: flex;
    justify-content: space-between;
  }
  li.comment-card div span {
    width: 50%;
  }
  li.comment-card .comment-creator {
    text-align: right;
  }
  [data-eq~="400px"] li.comment-card div {
    flex-direction: column;
    align-items: flex-end;
  }
  [data-eq~="400px"] li.comment-card div span {
    width: auto;
  }
</style>
