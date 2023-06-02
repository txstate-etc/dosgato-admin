<script lang="ts" context="module">
  import { DateTime } from 'luxon'
  function formatDate (dt: DateTime | undefined) {
    if (!dt) return ''
    return dt.toLocaleString()
  }

  function formatTime (dt: DateTime | undefined) {
    if (!dt) return ''
    return dt.toLocaleString(DateTime.TIME_SIMPLE).toLocaleLowerCase()
  }
</script>
<script lang="ts">
  import { Checkbox, Icon } from '@dosgato/dialog'
  import bookmarkSimple from '@iconify-icons/ph/bookmark-simple'
  import bookmarkSimpleFill from '@iconify-icons/ph/bookmark-simple-fill'
  import { ScreenReaderOnly, glue } from '@txstate-mws/svelte-components'
  import { isNotBlank, randomid, titleCase } from 'txstate-utils'
  import type { HistoryVersion } from './VersionHistory.svelte'
  import { api } from '$lib/api'
  import { createEventDispatcher } from 'svelte'

  const dispatch = createEventDispatcher()

  export let dataId: string
  export let maxVersion: number
  export let title: string
  export let versions: HistoryVersion[]
  export let selected: Set<number>
  export let selectedInTitle: Map<number, string>

  $: isMarkedTable = title === 'Marked Versions'

  function onSelect (version: number) {
    return (e: CustomEvent) => {
      if ((e.currentTarget as HTMLInputElement).checked) {
        if (selected.size === 2) {
          const maxSelected = Math.max(...selected)
          if (version > maxSelected) selected.delete(maxSelected)
          else {
            const minSelected = Math.min(...selected)
            if (version < minSelected) selected.delete(minSelected)
            else {
              if (Math.abs(minSelected - version) > Math.abs(maxSelected - version)) selected.delete(maxSelected)
              else selected.delete(minSelected)
            }
          }
        }
        selected.add(version)
        selectedInTitle.set(version, title)
      } else selected.delete(version)
      selected = selected
    }
  }

  let hoverRow: HTMLElement | undefined

  function onMark (version: number) {
    return async (e: MouseEvent) => {
      const updated = await api.markVersion(dataId, version)
      dispatch('marked', updated)
    }
  }

  const checkboxid = randomid()
</script>

{#if versions.length}
<section>
  <header>{title}</header>
  <table>
    <tr>
      <th class="checkbox">&nbsp;</th>
      <th class="date">Date</th>
      <th class="time">Time</th>
      {#if isMarkedTable}
        <th class="tags">Date Marked</th>
      {:else}
        <th class="tags">Tags</th>
      {/if}
      <th class="modified">Modified By</th>
      <th class="mark">Mark</th>
    </tr>
    {#each versions as version, i (version.version)}
    {@const restored = /restored/i.test(version.comment)}
    <tr on:mouseenter={function () { hoverRow = this }} on:mouseleave={() => { hoverRow = undefined }} data-idx={i}>
      <td class="checkbox"><Checkbox name="version-compare-{version.version}" value={selected.has(version.version)} disabled={selected.has(version.version) && selectedInTitle.get(version.version) !== title} onChange={onSelect(version.version)} id={checkboxid} /><label for={checkboxid}><ScreenReaderOnly>Select for Preview/Compare</ScreenReaderOnly></label></td>
      <td class="date">{formatDate(version.date)}</td>
      <td class="time">{formatTime(version.date)}</td>
      {#if isMarkedTable}
        <td class="tags">{formatDate(version.markedAt)}</td>
      {:else}
        <td class="tags">{[version.version === maxVersion ? 'Latest' : undefined, ...version.tags.map(titleCase), restored ? 'Restored' : undefined].filter(isNotBlank).join(', ')}</td>
      {/if}
      <td class="modified">{version.user.name}</td>
      <td class="mark">
        <button type="button" class="reset" on:click={onMark(version.version)}>
          <Icon width="1.5em" inline icon={version.marked ? bookmarkSimpleFill : bookmarkSimple} hiddenLabel={version.marked ? 'Mark this version' : 'Unmark this version'} />
        </button>
      </td>
    </tr>
    {/each}
  </table>
</section>
  {#if hoverRow}
    {@const comment = versions[Number(hoverRow.getAttribute('data-idx'))]?.comment}
    {#if comment}
      <div class="tooltip" use:glue={{ target: hoverRow ?? document.body, align: 'bottomleft' }}>{comment}</div>
    {/if}
  {/if}
{/if}

<style>
  section {
    margin-bottom: 1em;
  }
  header {
    font-size: 1.3em;
  }
  table {
    width: 100%;
    border-spacing: 0;
    border-collapse: collapse;
  }
  th {
    border-bottom: var(--dg-table-border, 2px solid #666666);
    text-align: left;
  }
  th, td {
    padding: 0.5em;
  }
  td {
    line-height: 1.5;
  }
  .tags, .mark {
    text-align: center;
  }
  .mark {
    width: 4em;
  }
  button {
    cursor: pointer;
  }
  .tooltip {
    position: absolute;
    padding: 0.5em;
    background-color: white;
    border: 1px solid #666666;
    margin-top: 1px;
    color: #222222;
    font-size: 0.9em;
  }
</style>
