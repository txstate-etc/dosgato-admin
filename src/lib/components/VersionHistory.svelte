<script lang="ts" context="module">
  export interface HistoryVersion {
    version: number
    date: DateTime
    comment: string
    marked: boolean
    markedAt?: DateTime
    tags: string[]
    user: {
      id: string
      name: string
    }
  }
</script>
<script lang="ts">
  import { Checkbox, Dialog, Icon } from '@dosgato/dialog'
  import bookmarkSimple from '@iconify-icons/ph/bookmark-simple'
  import bookmarkSimpleFill from '@iconify-icons/ph/bookmark-simple-fill'
  import { ScreenReaderOnly } from '@txstate-mws/svelte-components'
  import { DateTime } from 'luxon'
  import { onMount } from 'svelte'
  import { randomid, titleCase } from 'txstate-utils'

  export let latest: HistoryVersion
  export let history: Promise<HistoryVersion[]>

  let selected = new Set<number>()

  function onSelect (version: number) {
    return (e: CustomEvent) => {
      if ((e.currentTarget as HTMLInputElement).checked) selected.add(version)
      else selected.delete(version)
      selected = selected
    }
  }

  function formatDate (dt: DateTime) {
    return dt.toLocaleString()
  }

  function formatTime (dt: DateTime) {
    return dt.toLocaleString(DateTime.TIME_SIMPLE).toLocaleLowerCase()
  }

  function formatDateTime (dt: DateTime) {
    return dt.toLocaleString(DateTime.DATETIME_SHORT).toLocaleLowerCase()
  }

  let oldversions: HistoryVersion[] | undefined
  onMount(async () => {
    oldversions = await history
  })

  const latestlabel = randomid()
  $: console.log(selected.size)
</script>

<Dialog continueText={selected.size > 1 ? 'Compare' : 'Preview'} cancelText="Cancel" disabled={selected.size < 1 || selected.size > 2} on:escape>
  <section>
    <head>Latest Version</head>
    <table>
      <tr>
        <th class="checkbox" id={latestlabel}><ScreenReaderOnly>Select for Preview/Compare</ScreenReaderOnly>&nbsp;</th>
        <th class="date">Date</th>
        <th class="time">Time</th>
        <th class="tags">Tags</th>
        <th class="modified">Modified By</th>
        <th class="mark">Mark</th>
      </tr>
      <tr>
        <td class="checkbox"><Checkbox name="version-compare-{latest.version}" value={selected.has(latest.version)} onChange={onSelect(latest.version)} descid={latestlabel} /></td>
        <td class="date">{formatDate(latest.date)}</td>
        <td class="time">{formatTime(latest.date)}</td>
        <td class="tags">{['Latest', ...latest.tags.map(titleCase)].join(', ')}</td>
        <td class="modified">{latest.user.name}</td>
        <td class="mark"><Icon width="1.5em" icon={latest.marked ? bookmarkSimpleFill : bookmarkSimple} hiddenLabel={latest.marked ? 'Mark this version' : 'Unmark this version'} /></td>
      </tr>
    </table>
  </section>
</Dialog>

<style>
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
</style>
