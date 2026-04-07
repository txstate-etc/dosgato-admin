<script lang="ts">
  import { slide } from 'svelte/transition'
  import { randomid } from 'txstate-utils'
  import { dateStamp } from '$lib'
  import { Icon, Button } from '@dosgato/dialog'
  import { eq } from '@txstate-mws/svelte-components'
  import list from '@iconify-icons/ph/list-bullets-bold'
  import treeStructure from '@iconify-icons/ph/tree-structure-bold'
  import downIcon from '@iconify-icons/ph/caret-down-bold'
  import upIcon from '@iconify-icons/ph/caret-up-bold'
  import lockIcon from '@iconify-icons/ph/lock-simple-fill'
  import StatusBadge from './StatusBadge.svelte'

  interface PagetreeItem {
    id: string
    name: string
    type: string
    pageCount: number
    rootPage: { id: string, template: { templateTheme?: string } }
    permissions: { viewPages: boolean }
    locked?: boolean
  }

  export let pagetrees: PagetreeItem[]
  export let launchState: string
  export let pagetreeLastModifiedById: Record<string, Date>
  export let revealInPageTree: (pageId?: string) => void

  $: showActionColumn = pagetrees.some(p => p.permissions.viewPages)

  let openPanels: Record<string, boolean> = {}
  function togglePanel (id: string) {
    openPanels[id] = !openPanels[id]
    openPanels = openPanels
  }
</script>

<div use:eq>
  <table>
    <thead>
      <tr>
        <th>Status</th>
        <th>Name</th>
        <th>Pages</th>
        <th>Theme</th>
        <th>Last Edited</th>
        {#if showActionColumn}
          <th>Go to Page Tree</th>
        {/if}
      </tr>
    </thead>
    <tbody>
      {#each pagetrees as pt (pt.id)}
        <tr>
          <td><StatusBadge item={{ type: pt.type, launchState }} /></td>
          <td>
            <span class="name-cell">
              {pt.name}
              {#if pt.locked}
                <span class="lock-icon"><Icon icon={lockIcon} width="1em" /> Admin Lock</span>
              {/if}
            </span>
          </td>
          <td>{pt.pageCount}</td>
          <td>{pt.rootPage?.template?.templateTheme ?? ''}</td>
          <td>{pagetreeLastModifiedById[pt.id] ? dateStamp(pagetreeLastModifiedById[pt.id].toISOString()) : ''}</td>
          {#if showActionColumn}
            <td>
              {#if pt.permissions.viewPages}
                <Button on:click={() => revealInPageTree(pt.rootPage.id)} class="open-pagetree"><Icon icon={treeStructure} hiddenLabel="Open in Pages"/></Button>
              {/if}
            </td>
          {/if}
        </tr>
      {/each}
    </tbody>
  </table>

  <div class="mobile-list">
    {#each pagetrees as pt, idx (pt.id)}
      {@const bodyId = randomid()}
      <div class="accordion-row" class:background={idx % 2 === 0}>
        <div class="header" class:open={openPanels[pt.id]}>
          <button type="button" on:click={() => togglePanel(pt.id)} aria-expanded={!!openPanels[pt.id]} aria-controls={bodyId}>
            <div class="header-content">
              <StatusBadge item={{ type: pt.type, launchState }} />
              <span class="title">{pt.name}</span>
            </div>
            <div class="header-controls">
              {#if pt.locked}
                <span class="lock-badge"><Icon icon={lockIcon} width="1.2em" /></span>
              {/if}
              <div class="caret">
                <Icon icon={openPanels[pt.id] ? upIcon : downIcon} width="1.5em" />
              </div>
            </div>
          </button>
        </div>
        {#if openPanels[pt.id]}
          <div id={bodyId} class="body" transition:slide>
            {#if pt.locked}
              <div class="admin-lock-banner">
                <Icon icon={lockIcon} width="1.2em" />
                <span>Admin Lock</span>
              </div>
            {/if}
            <dl>
              <span>
                <dt>Pages:</dt>
                <dd>{pt.pageCount}</dd>
              </span>
              <span>
                <dt>Theme:</dt>
                <dd>{pt.rootPage?.template?.templateTheme ?? ''}</dd>
              </span>
              <span>
                <dt>Last Edited:</dt>
                <dd>{pagetreeLastModifiedById[pt.id] ? dateStamp(pagetreeLastModifiedById[pt.id].toISOString()) : ''}</dd>
              </span>
            </dl>
            {#if pt.permissions.viewPages}
              <div class="actions">
                <button type="button" on:click={() => revealInPageTree(pt.rootPage.id)}>
                  <div class="button-content">
                    <Icon icon={treeStructure} width="1.5em" class="open-pagetree" />
                    <span class="button-label">Go to Pagetree</span>
                  </div>
                </button>
              </div>
            {/if}
          </div>
        {/if}
      </div>
    {/each}
  </div>
</div>

<style>
  /* Desktop Table */
  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 1em;
  }
  thead {
    background-color: #ddd;
    border-top: 1px solid #000;
    border-bottom: 1px solid #000;
  }
  thead th {
    text-align: left;
    padding: 0.5em 0;
  }
  tbody tr {
    border-bottom: 1px dashed #707070;
  }
  tbody tr td {
    padding: 0.5em 0;
  }
  table tr > th:first-child,
  table tr > td:first-child {
    padding-left: 0.5em;
  }
  table tr > th:last-child,
  table tr > td:last-child {
    padding-right: 0.5em;
  }

  .name-cell {
    display: inline-flex;
    align-items: center;
    gap: 0.4em;
  }
  .lock-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    background-color: #E3284A;
    border-radius: 12px;
    color: #fff;
    padding: 2px 12px;
    font-size: 12px;
  }

  :global(button.open-pagetree .button-icon svg path) {
    fill: #006699;
  }
  table :global(button.open-pagetree) {
    background: transparent; 
    color: #006699;
  }

  /* Mobile Accordion */
  .mobile-list {
    display: none;
  }
  :global([data-eq~="500px"]) table {
    display: none;
  }
  :global([data-eq~="500px"]) .mobile-list {
    display: block;
  }

  .background {
    background-color: #f5f5f5;
  }

  .header {
    background-color: #DDDDDD;
    border-top: 1px solid #000;
    border-bottom: 1px solid #000;
  }
  .header.open {
    border-bottom: 1px dashed #000;
  }
  .header button {
    border: 0;
    background-color: transparent;
    padding: 0.5em;
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    cursor: pointer;
    color: #000;
  }
  .header-content {
    text-align: left;
    display: flex;
    flex-direction: column;
    gap: 0.25em;
  }
  .title {
    font-size: 1em;
  }
  .header-controls {
    display: flex;
    align-items: center;
    gap: 0.5em;
    flex-shrink: 0;
  }
  .lock-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background-color: #E3284A;
    border-radius: 12px;
    color: #fff;
    padding: 2px 8px;

  }
  .caret {
    background-color: #fff;
    border-radius: 4px;
    color: #006699;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.25em;
    flex-shrink: 0;
  }

  .body {
    padding: 1em 0.5em;
  }

  .admin-lock-banner {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5em;
    background-color: #E3284A;
    color: #fff;
    padding: 0.5em 0.75em;
    border-radius: 12px;
    font-weight: 600;
    font-size: 0.9em;
    margin-bottom: 1em;
  }

  .body dl {
    margin-bottom: 1em;
  }
  .body dl span {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.75em;
  }
  .body dt {
    font-weight: 700;
  }
  .body dd {
    margin-left: 0;
  }

  .actions {
    display: flex;
  }
  .actions button {
    background-color: transparent;
    color: #006699;
    font-weight: 500;
    border: 0;
    border-radius: 4px;
    padding: 0;
    cursor: pointer;
    width: auto;
  }
  .actions button .button-content {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .actions :global(svg path) {
    fill: #006699;
  }
</style>
