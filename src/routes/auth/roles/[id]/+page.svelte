<script lang="ts">
  import { Icon } from '@dosgato/dialog'
  import pencilIcon from '@iconify-icons/mdi/pencil'
  import plusIcon from '@iconify-icons/mdi/plus'
  import checkIcon from '@iconify-icons/mdi/check'
  import minusIcon from '@iconify-icons/mdi/minus'
  import deleteOutline from '@iconify-icons/mdi/delete-outline'
  import { ScreenReaderOnly } from '@txstate-mws/svelte-components'
  import { isNull, unique } from 'txstate-utils'
  import { base } from '$app/paths'
  import { api, DetailPanel, messageForDialog, ResponsiveTable, AssetRuleDialog } from '$lib'
  import FormDialog from '$lib/components/FormDialog.svelte'
  import Dialog from '$lib/components/Dialog.svelte'
  import { store } from './+page'

  export let data: { siteOptions: { value: string, label: string }[] }
  $: ({ siteOptions } = data)

  let modal: 'editbasic' | 'addassetrule' | 'editassetrule' | 'deleterule'|undefined

  $: groupIds = unique([...$store.role.directGroups.map(g => g.id), ...$store.role.indirectGroups.map(g => g.id)])

  function getUserGroups (userGroups) {
    const relevantGroups = userGroups.filter(g => groupIds.includes(g.id))
    return relevantGroups.map(g => g.id).join(', ')
  }

  async function onAddAssetRule (state) {
    const resp = await api.addAssetRule({ ...state, roleId: $store.role.id })
    if (resp.success) {
      modal = undefined
      store.refresh($store.role.id)
    }
    const wholeDialogMessages = resp.messages.filter(m => isNull(m.arg))
    return { success: resp.success, messages: [...messageForDialog(resp.messages, ''), ...wholeDialogMessages], data: state }
  }

  async function onEditAssetRule (state) {
    if (!$store.editing) return
    const args = {
      ruleId: $store.editing.id,
      siteId: state.siteId,
      path: state.path,
      mode: state.mode,
      grants: {
        create: state.grants.create,
        update: state.grants.update,
        move: state.grants.move,
        delete: state.grants.delete,
        undelete: state.grants.undelete
      }
    }
    const resp = await api.editAssetRule(args)
    if (resp.success) {
      modal = undefined
      store.refresh($store.role.id)
    }
    return { success: resp.success, messags: messageForDialog(resp.messages, 'args'), data: state }
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
    }
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
        <a href={`${base}/auth/users/${user.id}`}>{user.name} ({user.id})</a>
        <button on:click={() => { }}><Icon icon={deleteOutline} width="1.5em"/></button>
      </li>
    {/each}
    {#each $store.role.usersThroughGroups as user (user.id)}
      <li class="flex-row">
        <a href={`${base}/auth/users/${user.id}`}>{user.name} ({user.id})</a>
        {`Via group ${getUserGroups(user.groups)}`}
      </li>
    {/each}
  </ul>
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
            <button class="delete" on:click={onClickDelete(rule.id, 'data')}><Icon icon={deleteOutline} hiddenLabel='Delete Data Rule'/></button>
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
        <th>Manage Access</th>
        <th>Manage Parent Roles</th>
        <th>Create Sites</th>
        <th>Manage Global Data</th>
        <th>View Site List</th>
        <th>Manage Templates</th>
        <td><ScreenReaderOnly>No data</ScreenReaderOnly></td>
      </tr>
      {#each $store.role.globalRules as rule (rule.id)}
        <tr>
          <td><Icon icon={rule.grants.manageAccess ? checkIcon : minusIcon}/></td>
          <td><Icon icon={rule.grants.manageParentRoles ? checkIcon : minusIcon}/></td>
          <td><Icon icon={rule.grants.createSites ? checkIcon : minusIcon}/></td>
          <td><Icon icon={rule.grants.manageGlobalData ? checkIcon : minusIcon}/></td>
          <td><Icon icon={rule.grants.viewSiteList ? checkIcon : minusIcon}/></td>
          <td><Icon icon={rule.grants.manageTemplates ? checkIcon : minusIcon}/></td>
          <td>
            <button class="edit"><Icon icon={pencilIcon}/></button>
            <button class="delete" on:click={onClickDelete(rule.id, 'global')}><Icon icon={deleteOutline}/></button>
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
            <button class="delete" on:click={onClickDelete(rule.id, 'page')}><Icon icon={deleteOutline}/></button>
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
        <th>Governance</th>
        <th>Manage State</th>
        <th>Delete/Undelete</th>
        <td><ScreenReaderOnly>No data</ScreenReaderOnly></td>
      </tr>
      {#each $store.role.siteRules as rule (rule.id)}
        <tr>
          <td>{rule.site ? rule.site.name : 'All Sites'}</td>
          <td><Icon icon={rule.grants.launch ? checkIcon : minusIcon}/></td>
          <td><Icon icon={rule.grants.rename ? checkIcon : minusIcon}/></td>
          <td><Icon icon={rule.grants.governance ? checkIcon : minusIcon}/></td>
          <td><Icon icon={rule.grants.manageState ? checkIcon : minusIcon}/></td>
          <td><Icon icon={rule.grants.delete ? checkIcon : minusIcon}/></td>
          <td>
            <button class="edit"><Icon icon={pencilIcon}/></button>
            <button class="delete" on:click={onClickDelete(rule.id, 'site')}><Icon icon={deleteOutline}/></button>
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
            <button class="delete" on:click={onClickDelete(rule.id, 'template')}><Icon icon={deleteOutline}/></button>
          </td>
        </tr>
      {/each}
    </table>
  {:else}
    <div>This role has no template rules.</div>
  {/if}
</DetailPanel>
{modal}
{#if modal === 'addassetrule'}
  <AssetRuleDialog submit={onAddAssetRule} name='addassetrule' title='Add Asset Rule' siteChoices={siteOptions} on:dismiss={() => { modal = undefined }}/>
{:else if modal === 'editassetrule'}
  <AssetRuleDialog
    submit={onEditAssetRule}
    name='editassetrule'
    title='Edit Asset Rule'
    siteChoices={siteOptions}
    on:dismiss={() => { modal = undefined }}
    preload={$store.editing ? { ...$store.editing.data, siteId: $store.editing.data.site.id } : {} }/>
{:else if modal === 'deleterule'}
  <Dialog
  title={'Delete Rule'}
  continueText='Delete'
  cancelText='Cancel'
  on:continue={onDeleteRule}
  on:dismiss={() => { modal = undefined }}>
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
  table tr { border-bottom: 1px dashed #ebebeb }
  table tr:nth-child(even) { background-color: #f6f7f9 }
  table tr.headers {
    border-bottom: 1px solid #ebebeb;
  }
  table tr td { text-align: center }
  td button {
    border: 0;
    padding: 0;
    background-color: transparent;
  }
  td button.edit {
    margin-right: 0.5em;
  }
</style>
