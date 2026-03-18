<script lang="ts">
  import { Form, FieldGraphQLEditor, FieldTypeScriptEditor, FieldTextArea, Icon } from '@dosgato/dialog'
  import arrowSquareOut from '@iconify-icons/ph/arrow-square-out'
  import arrowSquareIn from '@iconify-icons/ph/arrow-square-in'
  import trashIcon from '@iconify-icons/ph/trash'
  import type { FormStore } from '@txstate-mws/svelte-forms'
  import { getIntrospectionQuery, buildClientSchema, type GraphQLSchema } from 'graphql'
  import { Cache, csv, ensureString } from 'txstate-utils'
  import { onMount } from 'svelte'
  import { api, toast } from '$lib'
  import { graphqlQueryToTypeScript } from './graphqlToType.js'
  import { transpile, ScriptTarget, ModuleKind } from 'typescript'

  const STORAGE_PREFIX = 'graphql-report:'
  const ACTIVE_REPORT_KEY = 'graphql-report-active'

  const schemaCache = new Cache(async () => {
    const introspectionResult = await api.query(getIntrospectionQuery())
    return buildClientSchema(introspectionResult)
  })

  let schema: GraphQLSchema | undefined

  const defaultQuery = '{ pages { name path } }'

  const defaultTransform = `// 'data' contains the GraphQL query result.
// Return a string[][] to be converted to CSV.
// The first row should be column headers.
return [
  ['Page Name', 'Page Path'],
  ...data.pages.map(p => [p.name, p.path])
]`

  let running = false
  let error = ''

  function storageKey (name: string) {
    return STORAGE_PREFIX + name
  }

  function getSavedReportNames (): string[] {
    const names: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(STORAGE_PREFIX)) {
        names.push(key.slice(STORAGE_PREFIX.length))
      }
    }
    return names.sort()
  }

  function loadReport (name: string) {
    try {
      const raw = localStorage.getItem(storageKey(name))
      if (raw) return JSON.parse(raw) as { query: string, transform: string, description: string }
    } catch {}
    return undefined
  }

  function saveReport (name: string, description: string, query: string, transform: string) {
    localStorage.setItem(storageKey(name), JSON.stringify({ query, transform, description }))
  }

  let reportName = localStorage.getItem(ACTIVE_REPORT_KEY) ?? 'default-report'
  if (!loadReport(reportName)) {
    saveReport(reportName, '', defaultQuery, defaultTransform)
  }
  const preload = loadReport(reportName)!

  let savedReportNames: string[] = getSavedReportNames()
  let newReportName = ''
  let reportStore: FormStore | undefined

  $: newNameExists = savedReportNames.includes(newReportName.trim())

  function refreshSavedNames () {
    savedReportNames = getSavedReportNames()
  }

  function loadReportIntoForm (name: string) {
    if (!name || !reportStore) return
    reportName = name
    localStorage.setItem(ACTIVE_REPORT_KEY, name)
    const saved = loadReport(name)
    if (saved) {
      void reportStore.setData({ query: saved.query, transform: saved.transform, description: saved.description ?? '' })
    }
  }

  function createReport () {
    const name = newReportName.trim()
    if (!name || savedReportNames.includes(name)) return
    saveReport(name, '', defaultQuery, defaultTransform)
    refreshSavedNames()
    reportName = name
    localStorage.setItem(ACTIVE_REPORT_KEY, name)
    void reportStore?.setData({ query: defaultQuery, transform: defaultTransform, description: '' })
  }

  function deleteReport () {
    if (reportName === 'default-report') return
    localStorage.removeItem(storageKey(reportName))
    refreshSavedNames()
    loadReportIntoForm('default-report')
  }

  $: if (reportStore && $reportStore) {
    const d = $reportStore.data
    saveReport(reportName, d.description, d.query, d.transform)
  }

  let exporting = false
  let importing = false

  async function copyReport () {
    if (!reportStore || !$reportStore) return
    exporting = true
    try {
      const d = $reportStore.data
      const exported = JSON.stringify({ name: reportName, description: d.description, query: d.query, transform: d.transform })
      await navigator.clipboard.writeText(exported)
      toast('Report copied to clipboard.', 'success')
    } catch (e: any) {
      toast('Failed to copy report: ' + (e.message ?? String(e)))
    } finally {
      exporting = false
    }
  }

  async function importReport () {
    importing = true
    try {
      const text = await navigator.clipboard.readText()
      const imported = JSON.parse(text) as { name: string, description: string, query: string, transform: string }
      if (!imported.name || !imported.query || !imported.transform) throw new Error('Invalid report data in clipboard.')
      saveReport(imported.name, imported.description ?? '', imported.query, imported.transform)
      refreshSavedNames()
      loadReportIntoForm(imported.name)
      toast(`Report "${imported.name}" imported.`, 'success')
    } catch (e: any) {
      toast('Failed to import report: ' + (e.message ?? String(e)))
    } finally {
      importing = false
    }
  }

  onMount(async () => {
    schema = await schemaCache.get()
  })

  async function run (formData: any) {
    error = ''
    running = true
    try {
      const data = await api.query(formData.query)
      const js = transpile(formData.transform, { target: ScriptTarget.ES2022, module: ModuleKind.ESNext })
      // eslint-disable-next-line no-new-func, @typescript-eslint/no-implied-eval
      const fn = new Function('data', js)
      const rows: any[][] = fn(data)
      if (!Array.isArray(rows) || !rows.every(r => Array.isArray(r))) {
        throw new Error('Transform must return a string[][].')
      }
      for (let i = 0; i < rows.length; i++) {
        for (let j = 0; j < rows[i].length; j++) {
          if (typeof rows[i][j] === 'number') {
            rows[i][j] = String(rows[i][j])
          } else if (rows[i][j] instanceof Date) {
            rows[i][j] = rows[i][j].toISOString()
          } else if (typeof rows[i][j] === 'boolean') {
            rows[i][j] = rows[i][j] ? 'true' : 'false'
          } else rows[i][j] = ensureString(rows[i][j])
        }
      }
      const csvContent = csv(rows)
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'report.csv'
      a.click()
      URL.revokeObjectURL(url)
    } catch (e: any) {
      error = e.message ?? String(e)
      console.error(e)
    } finally {
      running = false
    }
  }
</script>

<div class="graphql-report">
  <h1>GraphQL Reports</h1>
  <div class="report-selector">
    <div class="load-report">
      <label for="load-report-select">Load Saved Report</label>
      <select id="load-report-select" value={reportName} on:change={e => loadReportIntoForm(e.currentTarget.value)}>
        {#each savedReportNames as name}
          <option value={name}>{name}</option>
        {/each}
      </select>
    </div>
    <div class="create-report">
      <label for="new-report-name">New Report Name</label>
      <div class="create-report-row">
        <input id="new-report-name" type="text" bind:value={newReportName} placeholder="Enter report name" />
        <button type="button" on:click={createReport} disabled={!newReportName.trim() || newNameExists}>
          Create
        </button>
      </div>
    </div>
  </div>
  <div class="report-header">
    <h2>{reportName}</h2>
    <button type="button" class="icon-btn" class:active={exporting} on:click={copyReport} disabled={exporting} title="Copy report to clipboard"><Icon icon={arrowSquareOut} inline /></button>
    <button type="button" class="icon-btn" class:active={importing} on:click={importReport} disabled={importing} title="Import report from clipboard"><Icon icon={arrowSquareIn} inline /></button>
    {#if reportName !== 'default-report'}
      <button type="button" class="icon-btn delete" on:click={deleteReport} title="Delete report"><Icon icon={trashIcon} inline /></button>
    {/if}
  </div>
  <Form {preload} bind:store={reportStore} let:data>
    <FieldTextArea path="description" label="Description" rows={2} />
    {@const preamble = schema && data.query ? graphqlQueryToTypeScript(schema, data.query) : ''}
    <div class="editors">
      <div class="editor-section">
        <FieldGraphQLEditor path="query" label="GraphQL Query" rows={15} {schema} />
      </div>
      <div class="editor-section">
        <FieldTypeScriptEditor path="transform" label="Transform to CSV" rows={15} sandbox {preamble} />
      </div>
    </div>
    <div class="actions">
      <button type="button" on:click={async () => await run(data)} disabled={running || !data.query?.trim()}>
        {running ? 'Running...' : 'Run & Download CSV'}
      </button>
    </div>
  </Form>
  {#if error}
    <pre class="error">{error}</pre>
  {/if}
</div>

<style>
  .graphql-report {
    max-width: 1400px;
    margin: 0 auto;
    background-color: var(--dg-dialog-content-bg, #f4f4f4);
    padding: 1em;
  }
  h1 {
    margin: 0 0 0.5em;
  }
  .report-header {
    display: flex;
    align-items: center;
    gap: 1em;
  }
  h2 {
    margin: 0.5em 0;
  }
  .icon-btn {
    padding: 0.3em;
    font-size: 1.2em;
    cursor: pointer;
    background: none;
    border: none;
    color: var(--dg-button-bg, #501214);
    line-height: 1;
  }
  .icon-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .icon-btn.active {
    color: var(--dg-button-text, white);
    background-color: var(--dg-button-bg, #501214);
    border-radius: 4px;
  }
  .icon-btn.delete {
    color: #c00;
  }
  .report-selector {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1em;
    margin-bottom: 1em;
  }
  @media (max-width: 64em) {
    .report-selector {
      grid-template-columns: 1fr;
    }
  }
  .create-report label {
    display: block;
    margin-bottom: 0.25em;
    font-weight: 500;
  }
  .create-report-row {
    display: flex;
    gap: 0.5em;
  }
  .create-report-row input {
    flex: 1;
    padding: 0.4em 0.5em;
    font-size: 1em;
    border: 1px solid #ccc;
    border-radius: 4px;
  }
  .create-report-row button {
    padding: 0.4em 1em;
    font-size: 1em;
    cursor: pointer;
    background-color: var(--dg-button-bg, #501214);
    color: var(--dg-button-text, white);
    border: none;
    border-radius: 4px;
  }
  .create-report-row button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .editors {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1em;
  }
  @media (max-width: 64em) {
    .editors {
      grid-template-columns: 1fr;
    }
  }
  .actions {
    margin-top: 1em;
  }
  .actions button {
    padding: 0.5em 1.5em;
    font-size: 1em;
    cursor: pointer;
    background-color: var(--dg-button-bg, #501214);
    color: var(--dg-button-text, white);
    border: none;
    border-radius: 4px;
  }
  .actions button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .error {
    margin-top: 1em;
    padding: 0.75em;
    background-color: #fee;
    border: 1px solid #c00;
    color: #c00;
    border-radius: 4px;
    white-space: pre-wrap;
    word-break: break-word;
  }
</style>
