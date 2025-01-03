<script lang="ts" context="module">
  import { DateTime } from 'luxon'
  function formatDate (dt: DateTime | undefined) {
    if (!dt) return ''
    return dt.toLocaleString()
  }

  function formatTinyDate (dt: DateTime | undefined) {
    return formatDate(dt).replace(/\/\d{2}(\d{2})$/, '/$1')
  }

  function formatTime (dt: DateTime | undefined) {
    if (!dt) return ''
    return dt.toLocaleString(DateTime.TIME_SIMPLE).toLocaleLowerCase()
  }

  function formatTinyTime (dt: DateTime | undefined) {
    return formatTime(dt).replace(/ ?(a|p)m$/, '$1')
  }
</script>
<script lang="ts">
  import { Checkbox, Icon } from '@dosgato/dialog'
  import bookmarkSimple from '@iconify-icons/ph/bookmark-simple'
  import bookmarkSimpleFill from '@iconify-icons/ph/bookmark-simple-fill'
  import caretDown from '@iconify-icons/ph/caret-down'
  import caretRight from '@iconify-icons/ph/caret-right'
  import { ResizeStore, ScreenReaderOnly, glue, resize } from '@txstate-mws/svelte-components'
  import { derivedStore } from '@txstate-mws/svelte-store'
  import { createEventDispatcher, tick } from 'svelte'
  import { isNotBlank, randomid, titleCase } from 'txstate-utils'
  import type { HistoryVersion } from './VersionHistory.svelte'
  import { api } from '$lib/api'

  const dispatch = createEventDispatcher()

  export let dataId: string
  export let maxVersion: number
  export let title: string
  export let versions: HistoryVersion[]
  export let selected: Set<number>
  export let selectedInTitle: Map<number, string>
  export let compressDays = false

  const showing: Record<string, boolean> = {}
  const expandables: Record<string, HTMLElement> = {}

  $: isMarkedTable = title === 'Marked Versions'
  let keepers: Record<string, HistoryVersion> = {}
  let dayCount: Record<string, number> = {}
  function reactToVersions (..._: any[]) {
    keepers = {}
    dayCount = {}
    if (!compressDays) return
    for (const v of versions) {
      const day = v.date.toLocal().toFormat('yyyyLLdd')
      dayCount[day] ??= 0
      dayCount[day]++
      if (!keepers[day] || v.tags.includes('published') || (!keepers[day].tags.includes('published') && v.marked && !keepers[day].marked)) keepers[day] = v
    }
  }
  $: reactToVersions(versions, compressDays)

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

  async function toggleExpanded (day: string) {
    showing[day] = !showing[day]
    await tick()
    expandables[day].focus()
  }

  const checkboxid = randomid()
  const store = new ResizeStore()
  const small = derivedStore(store, sz => (sz?.clientWidth ?? 1000) < 500)
</script>

{#if versions.length}
<section use:resize={{ store }} class:small={$small}>
  <header>{title}</header>
  <table class:compressDays>
    <tr>
      <th class="checkbox">&nbsp;</th>
      <th class="date">Date</th>
      <th class="time">Time</th>
      {#if isMarkedTable}
        <th class="tags">Date Marked</th>
      {:else}
        <th class="tags">{#if $small}Pub{:else}Tags{/if}</th>
      {/if}
      <th class="modified">{$small ? 'By' : 'Modified By'}</th>
      <th class="mark">Mark</th>
    </tr>
    {#each versions as version, i (version.version)}
    {@const restored = /restored/i.test(version.comment)}
    {@const day = version.date.toLocal().toFormat('yyyyLLdd')}
    {@const lastday = i === 0 ? undefined : versions[i - 1].date.toLocal().toFormat('yyyyLLdd')}
    {@const showsDate = (keepers[day]?.version === version.version && !showing[day]) || (showing[day] && lastday !== day)}
    {@const hidden = compressDays && !showsDate && !showing[day]}
    {@const expandable = dayCount[day] > 1 && showsDate}
    <tr on:mouseenter={function () { hoverRow = this }} on:mouseleave={() => { hoverRow = undefined }} data-idx={i} class:hidden>
      <td class="checkbox"><Checkbox name="version-compare-{version.version}" value={selected.has(version.version)} disabled={selected.has(version.version) && selectedInTitle.get(version.version) !== title} onChange={onSelect(version.version)} id={checkboxid} /><label for={checkboxid}><ScreenReaderOnly>Select for Preview/Compare</ScreenReaderOnly></label></td>
      <td class="date" class:expandable on:click={async () => { if (expandable) await toggleExpanded(day) }}>
        {#if showsDate || (dayCount[day] ?? 0) <= 1}
          {$small ? formatTinyDate(version.date) : formatDate(version.date)}
        {:else}
          <ScreenReaderOnly>{formatDate(version.date)}</ScreenReaderOnly>
        {/if}
        {#if expandable}
          <button type="button" bind:this={expandables[day]} class="reset" on:click|stopPropagation={async () => await toggleExpanded(day) }>
            <Icon icon={showing[day] ? caretDown : caretRight} inline hiddenLabel="{showing[day] ? 'Hide other' : 'See more'} versions from this day"/>
          </button>
        {/if}
      </td>
      <td class="time">{$small ? formatTinyTime(version.date) : formatTime(version.date)}</td>
      <td class="tags">
        {#if $small}
          {#if isMarkedTable}
            {formatDate(version.markedAt)}
          {:else}
            {#if version.tags.some(t => t === 'published')}
              Y
            {:else}
              &mdash;<ScreenReaderOnly>No</ScreenReaderOnly>
            {/if}
          {/if}
        {:else}
          {#if isMarkedTable}
            {formatDate(version.markedAt)}
          {:else}
            {[version.version === maxVersion ? 'Latest' : undefined, ...version.tags.map(titleCase), restored ? 'Restored' : undefined].filter(isNotBlank).join(', ')}
          {/if}
        {/if}
      </td>
      <td class="modified">{$small ? version.user.id : version.user.name}</td>
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
  tr.hidden {
    display: none;
  }
  .checkbox {
    width: 1.8em;
  }
  .date {
    width: 7.5em;
    white-space: nowrap;
  }
  section.small .date {
    width: 6em;
  }
  .time {
    width: 6em;
  }
  section.small .time {
    width: 4em;
  }
  .modified {
    width: 11em;
  }
  section.small .modified {
    width: auto;
  }
  .mark {
    width: 3.5em;
  }
  .tags {
    width: auto;
  }
  section.small .tags {
    width: 3.5em;
  }
  th {
    border-bottom: var(--dg-table-border, 2px solid #666666);
    text-align: left;
  }
  th, td {
    padding: 0.5em;
  }
  section.small th, section.small td {
    padding: 0.5em 0.2em;
  }
  td {
    line-height: 1.5;
  }
  td.expandable {
    cursor: pointer;
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
