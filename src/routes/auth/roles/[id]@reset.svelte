<script lang="ts" context="module">
  import type { Load } from '@sveltejs/kit'
  import pencilIcon from '@iconify-icons/mdi/pencil'
  import plusIcon from '@iconify-icons/mdi/plus'
  import checkIcon from '@iconify-icons/mdi/check'
  import minusIcon from '@iconify-icons/mdi/minus'
  import deleteOutline from '@iconify-icons/mdi/delete-outline'
  import { Icon, FieldSelect, FieldChooserLink, FieldChoices, FieldMultiselect } from '@dosgato/dialog'
  import FormDialog from '$lib/components/FormDialog.svelte'
  import Dialog from '$lib/components/Dialog.svelte'

  let siteOptions: PopupMenuItem[] = []

  export const load: Load = async ({ params }) => {
    await store.refresh(params.id)
    if (!store.roleFetched()) return { status: 404 }
    const sites = await api.getSiteList()
    siteOptions = sites.map((s: SiteListSite) => ({ value: s.id, label: s.name }))
    return {}
  }

  async function getRole (id: string) {
    const role = await api.getRoleById(id)
    return role
  }

  const store = new RoleDetailStore(getRole)
</script>

<script lang="ts">
  import { base } from '$app/paths'
  import { api, RoleDetailStore, DetailPanel, messageForDialog, type SiteListSite, type CreateAssetRuleInput } from '$lib'
  import { isNull, unique } from 'txstate-utils'
  import { ScreenReaderOnly, type PopupMenuItem } from '@txstate-mws/svelte-components'

  let modal: 'editbasic'|'addassetrule'|'deleteassetrule'|undefined
  let ruleToRemove: { id: string, type: 'GLOBAL'|'SITE'|'PAGE'|'TEMPLATE'|'ASSET'|'DATA'}|undefined = undefined

  $: groupIds = unique([...$store.role.directGroups.map(g => g.id), ...$store.role.indirectGroups.map(g => g.id)])

  function getUserGroups (userGroups) {
    const relevantGroups = userGroups.filter(g => groupIds.includes(g.id))
    return relevantGroups.map(g => g.id).join(', ')
  }

  function stateToCreateAssetRuleInput (state) {
    const input: CreateAssetRuleInput = {
      roleId: $store.role.id,
      siteId: state.site[0], // TODO: Change this if/when site becomes a single-select field that returns one value instead of an array
      path: state.path,
      mode: state.mode,
      grants: { // TODO: Probably a better way to do this. Maybe FieldChoices isn't the right field to use here.
        create: state.grants.includes('Create'),
        update: state.grants.includes('Update'),
        move: state.grants.includes('Move'),
        delete: state.grants.includes('Delete'),
        undelete: state.grants.includes('Undelete')
      }
    }
    return input
  }

  async function validateAssetRule (state) {
    const input = stateToCreateAssetRuleInput(state)
    const resp = await api.addAssetRule(input, true)
    return messageForDialog(resp.messages, '')
  }

  async function onAddAssetRule (state) {
    const input = stateToCreateAssetRuleInput(state)
    const resp = await api.addAssetRule(input)
    if (resp.success) {
      modal = undefined
      store.refresh($store.role.id)
    }
    const wholeDialogMessages = resp.messages.filter(m => isNull(m.arg))
    return { success: resp.success, messages: [...messageForDialog(resp.messages, ''), ...wholeDialogMessages], data: state }
  }

  async function getSiteOptions (term: string) {
    return siteOptions.filter((s: PopupMenuItem) => s.label!.indexOf(term) > -1)
  }

  async function onDeleteRule () {
    if (!ruleToRemove) return
    const resp = await api.removeRule(ruleToRemove.id, ruleToRemove.type)
    if (resp.success) {
      store.refresh($store.role.id)
    }
    ruleToRemove = undefined
    modal = undefined
  }

</script>

<div class="back-link">
  <a href={`${base}/auth/roles/`}>
    Back to Role List
  </a>
</div>

<DetailPanel header='Basic Information' button={{ icon: pencilIcon, onClick: () => {}, hiddenLabel: 'Edit Basic Information' }}>
  <div class="row">
    <div class="label">Name:</div>
    <div class="value">{$store.role.name}</div>
  </div>
</DetailPanel>

{#if $store.role.directGroups.length || $store.role.indirectGroups.length}
  <DetailPanel header='Groups'>
    <ul>
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
    </ul>
  </DetailPanel>
{/if}

<DetailPanel header='Users'>
  <ul>
    {#each $store.role.directUsers as user (user.id)}
      <li class="flex-row">
        <a href={`${base}/auth/user/${user.id}`}>{user.name} ({user.id})</a>
        <button on:click={() => { }}><Icon icon={deleteOutline} width="1.5em"/></button>
      </li>
    {/each}
    {#each $store.role.usersThroughGroups as user (user.id)}
      <li class="flex-row">
        <a href={`${base}/auth/user/${user.id}`}>{user.name} ({user.id})</a>
        {`Via group ${getUserGroups(user.groups)}`}
      </li>
    {/each}
  </ul>
</DetailPanel>

<DetailPanel header='Asset Rules' button={{ icon: plusIcon, onClick: () => { modal = 'addassetrule' }, hiddenLabel: 'Add Asset Rule' }}>
  {#if $store.role.assetRules.length}
    <table>
      <tr class='headers'>
        <th>Site</th>
        <th>Path</th>
        <th>Mode</th>
        <th>Create</th>
        <th>Update</th>
        <th>Move</th>
        <th>Delete</th>
        <th>Undelete</th>
        <td><ScreenReaderOnly>No data</ScreenReaderOnly></td>
      </tr>
      {#each $store.role.assetRules as rule (rule.id)}
        <tr>
          <td>{rule.site ? rule.site.name : 'All Sites'}</td>
          <td>{rule.path}</td>
          <td>{rule.mode}</td>
          <td><Icon icon={rule.grants.create ? checkIcon : minusIcon} hiddenLabel={`Create ${rule.grants.create ? '' : 'not'} permitted`}/></td>
          <td><Icon icon={rule.grants.update ? checkIcon : minusIcon}/></td>
          <td><Icon icon={rule.grants.move ? checkIcon : minusIcon}/></td>
          <td><Icon icon={rule.grants.delete ? checkIcon : minusIcon}/></td>
          <td><Icon icon={rule.grants.undelete ? checkIcon : minusIcon}/></td>
          <td>
            <button class="edit"><Icon icon={pencilIcon} hiddenLabel='Edit Asset Rule'/></button>
            <button class="delete"  on:click={() => { ruleToRemove = { id: rule.id, type: 'ASSET' }; modal = 'deleteassetrule' }}><Icon icon={deleteOutline} hiddenLabel='Delete Asset Rule'/></button>
          </td>
        </tr>
      {/each}
    </table>
  {:else}
    <div>This role has no asset rules.</div>
  {/if}
</DetailPanel>

<DetailPanel header='Data Rules' button={{ icon: plusIcon, onClick: () => {}, hiddenLabel: 'Add Data Rule' }}>
  {#if $store.role.dataRules.length}
    <table>
      <tr class='headers'>
        <th>Site</th>
        <th>Path</th>
        <th>Template</th>
        <th>Create</th>
        <th>Update</th>
        <th>Move</th>
        <th>Publish</th>
        <th>Unpublish</th>
        <th>Delete</th>
        <th>Undelete</th>
        <td><ScreenReaderOnly>No data</ScreenReaderOnly></td>
      </tr>
      {#each $store.role.dataRules as rule (rule.id)}
        <tr>
          <td>{rule.site ? rule.site.name : 'All Sites'}</td>
          <td>{rule.path}</td>
          <td>{rule.template ? rule.template.name : 'All Templates'}</td>
          <td><Icon icon={rule.grants.create ? checkIcon : minusIcon} hiddenLabel={`Create ${rule.grants.create ? '' : 'not'} permitted`}/></td>
          <td><Icon icon={rule.grants.update ? checkIcon : minusIcon}/></td>
          <td><Icon icon={rule.grants.move ? checkIcon : minusIcon}/></td>
          <td><Icon icon={rule.grants.publish ? checkIcon : minusIcon}/></td>
          <td><Icon icon={rule.grants.unpublish ? checkIcon : minusIcon}/></td>
          <td><Icon icon={rule.grants.delete ? checkIcon : minusIcon}/></td>
          <td><Icon icon={rule.grants.undelete ? checkIcon : minusIcon}/></td>
          <td>
            <button class="edit"><Icon icon={pencilIcon} hiddenLabel='Edit Data Rule'/></button>
            <button class="delete"><Icon icon={deleteOutline} hiddenLabel='Delete Data Rule'/></button>
          </td>
        </tr>
      {/each}
    </table>
  {:else}
    <div>This role has no data rules.</div>
  {/if}
</DetailPanel>

<DetailPanel header='Global Rules' button={{ icon: plusIcon, onClick: () => {}, hiddenLabel: 'Add Global Rule' }}>
  {#if $store.role.globalRules.length}
    <table>
      <tr class='headers'>
        <th>Manage Users</th>
        <th>Create Sites</th>
        <th>Manage Global Data</th>
        <td><ScreenReaderOnly>No data</ScreenReaderOnly></td>
      </tr>
      {#each $store.role.globalRules as rule (rule.id)}
        <tr>
          <td><Icon icon={rule.grants.manageUsers ? checkIcon : minusIcon}/></td>
          <td><Icon icon={rule.grants.createSites ? checkIcon : minusIcon}/></td>
          <td><Icon icon={rule.grants.manageGlobalData ? checkIcon : minusIcon}/></td>
          <td>
            <button class="edit"><Icon icon={pencilIcon}/></button>
            <button class="delete"><Icon icon={deleteOutline}/></button>
          </td>
        </tr>
      {/each}
    </table>
  {:else}
    <div>This role has no global rules.</div>
  {/if}
</DetailPanel>

<DetailPanel header='Page Rules' button={{ icon: plusIcon, onClick: () => {}, hiddenLabel: 'Add Page Rule' }}>
  {#if $store.role.pageRules.length}
    <table>
      <tr class='headers'>
        <th>Site</th>
        <th>Pagetree Type</th>
        <th>Path</th>
        <th>Mode</th>
        <th>Create</th>
        <th>Update</th>
        <th>Move</th>
        <th>Publish</th>
        <th>Unpublish</th>
        <th>Delete</th>
        <th>Undelete</th>
        <td><ScreenReaderOnly>No data</ScreenReaderOnly></td>
      </tr>
      {#each $store.role.pageRules as rule (rule.id)}
        <tr>
          <td>{rule.site ? rule.site.name : 'All Sites'}</td>
          <td>{rule.pagetreeType ? rule.pagetreeType : 'All types'}</td>
          <td>{rule.path}</td>
          <td>{rule.mode}</td>
          <td><Icon icon={rule.grants.create ? checkIcon : minusIcon} hiddenLabel={`Create ${rule.grants.create ? '' : 'not'} permitted`}/></td>
          <td><Icon icon={rule.grants.update ? checkIcon : minusIcon}/></td>
          <td><Icon icon={rule.grants.move ? checkIcon : minusIcon}/></td>
          <td><Icon icon={rule.grants.publish ? checkIcon : minusIcon}/></td>
          <td><Icon icon={rule.grants.unpublish ? checkIcon : minusIcon}/></td>
          <td><Icon icon={rule.grants.delete ? checkIcon : minusIcon}/></td>
          <td><Icon icon={rule.grants.undelete ? checkIcon : minusIcon}/></td>
          <td>
            <button class="edit"><Icon icon={pencilIcon}/></button>
            <button class="delete"><Icon icon={deleteOutline}/></button>
          </td>
        </tr>
      {/each}
    </table>
  {:else}
    <div>This role has no page rules</div>
  {/if}
</DetailPanel>

<DetailPanel header='Site Rules' button={{ icon: plusIcon, onClick: () => {}, hiddenLabel: 'Add Site Rule' }}>
  {#if $store.role.siteRules.length}
    <table>
      <tr class="headers">
        <th>Site</th>
        <th>Launch</th>
        <th>Rename</th>
        <th>Manage Pagetrees</th>
        <th>Promote Pagetree</th>
        <th>Delete</th>
        <th>Undelete</th>
        <td><ScreenReaderOnly>No data</ScreenReaderOnly></td>
      </tr>
      {#each $store.role.siteRules as rule (rule.id)}
        <tr>
          <td>{rule.site ? rule.site.name : 'All Sites'}</td>
          <td><Icon icon={rule.grants.launch ? checkIcon : minusIcon}/></td>
          <td><Icon icon={rule.grants.rename ? checkIcon : minusIcon}/></td>
          <td><Icon icon={rule.grants.managePagetrees ? checkIcon : minusIcon}/></td>
          <td><Icon icon={rule.grants.promotePagetree ? checkIcon : minusIcon}/></td>
          <td><Icon icon={rule.grants.delete ? checkIcon : minusIcon}/></td>
          <td><Icon icon={rule.grants.undelete ? checkIcon : minusIcon}/></td>
          <td>
            <button class="edit"><Icon icon={pencilIcon}/></button>
            <button class="delete"><Icon icon={deleteOutline}/></button>
          </td>
        </tr>
      {/each}
    </table>
  {:else}
    <div>This role has no site rules.</div>
  {/if}
</DetailPanel>

<DetailPanel header='Template Rules' button={{ icon: plusIcon, onClick: () => {}, hiddenLabel: 'Add Template Rule' }}>
  {#if $store.role.templateRules.length}
    <table>
      <tr class="headers">
        <th>Template</th>
        <th>Use</th>
        <td><ScreenReaderOnly>No data</ScreenReaderOnly></td>
      </tr>
      {#each $store.role.templateRules as rule (rule.id)}
        <tr>
          <td>{rule.template ? rule.template.name : 'All Templates'}</td>
          <td><Icon icon={rule.grants.use ? checkIcon : minusIcon}/></td>
          <td>
            <button class="edit"><Icon icon={pencilIcon}/></button>
            <button class="delete"><Icon icon={deleteOutline}/></button>
          </td>
        </tr>
      {/each}
    </table>
  {:else}
    <div>This role has no template rules.</div>
  {/if}
</DetailPanel>

{#if modal === 'addassetrule'}
  <FormDialog
    submit={onAddAssetRule}
    validate={validateAssetRule}
    name='addassetrule'
    title='Add Asset Rule'
    on:dismiss={() => { modal = undefined }}>
    <FieldMultiselect path='site' label='Site' getOptions={getSiteOptions}/>
    <FieldChooserLink path='path' label='Path'/>
    <FieldSelect path='mode' label='Mode' choices={[{ value: 'SELF', label: 'This path only' }, { value: 'SELFANDSUB', label: 'This path and its subfolders' }, { value: 'SUB', label: 'Only subfolders of this path' }]}/>
    <FieldChoices path='grants' label='Grants' choices={[{ value: 'Create' }, { value: 'Update' }, { value: 'Move' }, { value: 'Delete' }, { value: 'Undelete' }]}/>
  </FormDialog>
{:else if modal === 'deleteassetrule'}
  <Dialog
  title={'Delete Asset Rule'}
  continueText='Delete'
  cancelText='Cancel'
  on:continue={onDeleteRule}
  on:dismiss={() => { modal = undefined }}>
  Are you sure you want to delete this asset rule?
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
  li.flex-row {
    display: flex;
    justify-content: space-between;
  }
  li.flex-row button {
    border: 0;
    padding: 0;
    background-color: transparent;
  }
  table {
    width: 100%;
    border-collapse: collapse;
  }

  table tr td { text-align: center }
  table tr.headers {
    border-bottom: 1px solid #ebebeb;
  }
  table tr { border-bottom: 1px dashed #ebebeb }
  table tr:nth-child(even) { background-color: #f6f7f9 }
  td button {
    border: 0;
    padding: 0;
    background-color: transparent;
  }
  td button.edit {
    margin-right: 0.5em;
  }
</style>