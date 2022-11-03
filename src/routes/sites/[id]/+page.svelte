<script lang="ts">
  import pencilIcon from '@iconify-icons/mdi/pencil'
  import plusIcon from '@iconify-icons/mdi/plus'
  import deleteOutline from '@iconify-icons/mdi/delete-outline'
  import archiveOutline from '@iconify-icons/mdi/archive-outline'
  import applicationExport from '@iconify-icons/mdi/application-export'
  import checkIcon from '@iconify-icons/mdi/check'
  import minusIcon from '@iconify-icons/mdi/minus'
  import prohibitIcon from '@iconify-icons/ph/prohibit'
  import { Icon, FieldText, FieldSelect, FieldMultiselect, FieldCheckbox, FieldAutocomplete } from '@dosgato/dialog'
  import FormDialog from '$lib/components/FormDialog.svelte'
  import Dialog from '$lib/components/Dialog.svelte'
  import { eq, ScreenReaderOnly } from '@txstate-mws/svelte-components'
  import { type Feedback, MessageType } from '@txstate-mws/svelte-forms'
  import { DateTime } from 'luxon'
  import { keyby } from 'txstate-utils'
  import { api, DetailPanel, ensureRequiredNotNull, messageForDialog, type CreateWithPageState, type Organization, type UserListUser, type TemplateListTemplate, templateListStore } from '$lib'
  import { base } from '$app/paths'
  import { store } from './+page'
  import CreateWithPageDialog from '$lib/components/dialogs/CreateWithPageDialog.svelte'

  export let data: { organizations: Organization[], users: UserListUser[], allPageTemplates: TemplateListTemplate[], allComponentTemplates: TemplateListTemplate[] }

  let modal: 'editbasic'|'editsitemanagement'|'editlaunch'|'addcomment'|'addpagetree'|'editpagetree'|'deletepagetree'| 'authorizetemplate' |
    'promotepagetree'|'archivepagetree'|'edittemplates'|'addpagetemplates'|'addcomponenttemplates'|'deletetemplateauth'|undefined = undefined

  const pagetreesByName = keyby($store.site.pagetrees, 'name')
  $: authorizedPageTemplatesByKey = keyby($store.pageTemplates, 'key')
  $: authorizedComponentTemplatesByKey = keyby($store.componentTemplates, 'key')
  let showAllTemplates = false

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
</script>

<DetailPanel header='Basic Information' button={$store.site.permissions.rename ? { icon: pencilIcon, hiddenLabel: 'edit basic information', onClick: () => { modal = 'editbasic' } } : undefined}>
  <div class="row">
    <div class="label">Name:</div>
    <div class="value">{$store.site.name}</div>
  </div>
</DetailPanel>

<DetailPanel header='Launch Information' button={$store.site.permissions.launch ? { icon: pencilIcon, hiddenLabel: 'edit launch URL', onClick: () => { modal = 'editlaunch' } } : undefined}>
  {#if $store.site.url}
  <div class="row">
    <div class="label">URL:</div>
    <div class="value">{$store.site.url.prefix}</div>
  </div>
  {:else}
    <span>This site is not launched.</span>
  {/if}
</DetailPanel>

<DetailPanel header='Page Trees' button={$store.site.permissions.manageState ? { icon: plusIcon, hiddenLabel: 'add page tree', onClick: () => { modal = 'addpagetree' } } : undefined}>
  <table>
    <tr class='headers'>
      <th>Name</th>
      <th>Stage</th>
      <td><ScreenReaderOnly>No data</ScreenReaderOnly></td>
    </tr>
    {#each $store.site.pagetrees as pagetree (pagetree.id)}
      <tr>
        <td>{pagetree.name}</td>
        <td>{pagetree.type}</td>
        <td class="pagetree-buttons">
          <button title="Edit" on:click={() => { onClickEditPagetree(pagetree.id, pagetree.name) }}><Icon icon={pencilIcon}/><ScreenReaderOnly>rename page tree</ScreenReaderOnly></button>
          {#if pagetree.type === 'SANDBOX'}
            <button title="Promote to Primary" on:click={() => { onClickPromotePagetree(pagetree.id, pagetree.name) }}><Icon icon={applicationExport}/><ScreenReaderOnly>promote page tree</ScreenReaderOnly></button>
          {/if}
          {#if pagetree.type === 'SANDBOX'}
            <button title="Archive" on:click={() => { onClickArchivePagetree(pagetree.id, pagetree.name) }}><Icon icon={archiveOutline}/><ScreenReaderOnly>archive page tree</ScreenReaderOnly></button>
          {/if}
          {#if pagetree.type !== 'PRIMARY'}
            <button title="Delete" on:click={() => { onClickDeletePagetree(pagetree.id, pagetree.name) }}><Icon icon={deleteOutline}/><ScreenReaderOnly>delete page tree</ScreenReaderOnly></button>
          {/if}
        </td>
      </tr>
    {/each}
  </table>
</DetailPanel>

<DetailPanel header='Site Management' button={$store.site.permissions.manageGovernance ? { icon: pencilIcon, hiddenLabel: 'edit site management', onClick: () => { modal = 'editsitemanagement' } } : undefined}>
  <div class="row">
    <div class="label">Organization:</div>
    {#if $store.site.organization}
      <div class="value">{$store.site.organization.name}</div>
    {/if}
  </div>
  <div class="row">
    <div class="label">Owner:</div>
    {#if $store.site.owner}
      <div class="value">{$store.site.owner.name} ({$store.site.owner.id})</div>
    {/if}
  </div>
  <div class="row">
    <div class="label">Manager(s):</div>
    <div class="value">
      <ul class='manager-list'>
        {#each $store.site.managers as manager (manager.id)}
        <li>{manager.name} ({manager.id})</li>
        {/each}
      </ul>
    </div>
  </div>
</DetailPanel>

<DetailPanel header="Roles">
  <table>
    <tr>
      <th>Name</th>
      <th>Read-Only</th>
      <th>Universal</th>
    </tr>
    {#each $store.siteRoles as role (role.id)}
      <tr>
        <td><a href={`${base}/auth/roles/${role.id}`}>{role.name}</a></td>
        <td><Icon icon={role.readonly ? checkIcon : minusIcon} hiddenLabel={`${role.name} role has ${role.readonly ? 'read-only' : 'write'} access to this site`}/></td>
        <td><Icon icon={minusIcon} hiddenLabel={`${role.name} is a site-specific role`}/></td>
      </tr>
    {/each}
    {#each $store.globalRoles as role (role.id)}
      <tr>
        <td><a href={`${base}/auth/roles/${role.id}`}>{role.name}</a></td>
        <td><Icon icon={role.readonly ? checkIcon : minusIcon} hiddenLabel={`${role.name} role has ${role.readonly ? 'read-only' : 'write'} access to this site`}/></td>
        <td><Icon icon={checkIcon} hiddenLabel={`${role.name} applies to all sites`}/></td>
      </tr>
    {/each}
  </table>
</DetailPanel>

<DetailPanel header="Users">
  <table>
    <tr>
      <th>Name</th>
      <th>Read-Only</th>
      <th>Source Role(s)</th>
    </tr>
    {#each $store.users as user (user.id)}
      <tr>
        <td><a href={`${base}/auth/users/${user.id}`}>{user.name}</a></td>
        <td><Icon icon={user.readonly ? checkIcon : minusIcon} hiddenLabel={`${user.name} has ${user.readonly ? 'read-only' : 'write'} access to this site`}/></td>
        <td>{user.roles}</td>
      </tr>
    {/each}
  </table>
</DetailPanel>

<DetailPanel header="Groups">
  <table>
    <tr>
      <th>Name</th>
      <th>Read-Only</th>
      <th>Source Role(s)</th>
    </tr>
    {#each $store.groups as group (group.id)}
      <tr>
        <td><a href={`${base}/auth/groups/${group.id}`}>{group.name}</a></td>
        <td><Icon icon={group.readonly ? checkIcon : minusIcon} hiddenLabel={`${group.name} has ${group.readonly ? 'read-only' : 'write'} access to this site`}/></td>
        <td>{group.roles}</td>
      </tr>
    {/each}
  </table>
</DetailPanel>

<DetailPanel header="Manage Authorized Templates">
  <div class="showall">
    <input type="checkbox" bind:checked={showAllTemplates} id="showalltemplates"/>
    <label for="showalltemplates">Show All</label>
  </div>
  <table class="templates">
    <caption>Page Templates</caption>
    <thead>
      <tr>
        <th>Name</th>
        <th>Pagetrees</th>
        <td><ScreenReaderOnly>No Data</ScreenReaderOnly></td>
      </tr>
    </thead>
    <tbody>
      {#each data.allPageTemplates as template}
        {@const authorized = Object.keys(authorizedPageTemplatesByKey).includes(template.key)}
        {#if (authorized && !authorizedPageTemplatesByKey[template.key].universal) || showAllTemplates}
          <tr>
            <td>{template.name}</td>
            <td>
              {#if authorized}
                {authorizedPageTemplatesByKey[template.key].pagetrees.length ? authorizedPageTemplatesByKey[template.key].pagetrees.join(', ') : 'All Pagetrees'}
              {:else}
                <div>None</div>
              {/if}
            <td>
              {#if !authorized}
                <button on:click={() => { onClickAuthorizeTemplate(template.key, template.name, []) }}><Icon icon={plusIcon} width="1.5em"/><ScreenReaderOnly>Authorize {template.name} for site</ScreenReaderOnly></button>
              {:else}
                {#if authorizedPageTemplatesByKey[template.key].universal}
                  <div>Universal</div>
                {:else}
                  <button on:click={() => { onClickEditTemplateAuth(template.key, template.name, authorizedPageTemplatesByKey[template.key].pagetrees) }}><Icon icon={pencilIcon} width="1.5em"/></button>
                  <button on:click={() => { onClickDeleteTemplateAuth(template.key, template.name, authorizedPageTemplatesByKey[template.key].pagetrees) }}><Icon icon={deleteOutline} width="1.5em"/></button>
                {/if}
              {/if}
            </td>
          </tr>
        {/if}
      {/each}
    </tbody>
  </table>
  <table class="templates">
    <caption>Component Types</caption>
    <thead>
      <tr>
        <th>Name</th>
        <th>Pagetrees</th>
        <td><ScreenReaderOnly>No Data</ScreenReaderOnly></td>
      </tr>
    </thead>
    <tbody>
      {#each data.allComponentTemplates as template}
        {@const authorized = Object.keys(authorizedComponentTemplatesByKey).includes(template.key)}
        {#if (authorized && !authorizedComponentTemplatesByKey[template.key].universal) || showAllTemplates}
          <tr>
            <td>{template.name}</td>
            <td>
              {#if authorized}
                {authorizedComponentTemplatesByKey[template.key].pagetrees.length ? authorizedComponentTemplatesByKey[template.key].pagetrees.join(', ') : 'All Pagetrees'}
              {:else}
              <div>None</div>
              {/if}
            </td>
            <td>
              {#if !authorized}
                <button on:click={() => { onClickAuthorizeTemplate(template.key, template.name, []) }}><Icon icon={plusIcon} width="1.5em"/><ScreenReaderOnly>Authorize {template.name} for site</ScreenReaderOnly></button>
              {:else}
                {#if authorizedComponentTemplatesByKey[template.key].universal}
                  <div>Universal</div>
                {:else}
                  <div class="actions">
                    <button on:click={() => { onClickEditTemplateAuth(template.key, template.name, authorizedComponentTemplatesByKey[template.key].pagetrees) }}><Icon icon={pencilIcon} width="1.5em"/></button>
                    <button on:click={() => { onClickDeleteTemplateAuth(template.key, template.name, authorizedComponentTemplatesByKey[template.key].pagetrees) }}><Icon icon={deleteOutline} width="1.5em"/></button>
                  </div>
                {/if}
              {/if}
            </td>
          </tr>
        {/if}
      {/each}
    </tbody>
  </table>
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
    on:escape={() => { modal = undefined }}
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
  .row {
    display: flex;
    padding: 0.5rem 0;
  }
  .label {
    font-weight: bold;
    width: 25%;
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
    padding: 0.6em 0.3em;
  }
  li:first-child {
    padding-top: 0;
  }
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
  .showall {
    text-align: right;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 1em;
  }

  table caption {
    color: #AD0057;
    font-weight: bold;
    font-size: 16px;
    text-align: left;
    margin-bottom: 1em;
  }

  table tr td, table tr th {
    text-align: left;
    padding: 0.4em 0;
  }
  table tr.headers {
    border-bottom: 1px solid #ebebeb;
  }
  table tr { border-bottom: 1px dashed #ebebeb }
  table tr:nth-child(even) { background-color: #f6f7f9 }
  .pagetree-buttons {
    text-align: right;
  }
  table.templates td:nth-child(1), table.templates td:nth-child(2) {
    width: 40%;
  }
  table.templates td:nth-child(3) {
    width: 20%;
    text-align: right;
  }
  td button {
    border: 0;
    padding: 0;
    background-color: transparent;
  }
  td button:not(:last-child) {
    margin-right: 0.5em;
  }
</style>
