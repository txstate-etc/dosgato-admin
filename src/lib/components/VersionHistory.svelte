<script lang="ts" context="module">
  import type { DateTime } from 'luxon'
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
  import { Dialog } from '@dosgato/dialog'
  import { createEventDispatcher, onMount } from 'svelte'
  import { keyby } from 'txstate-utils'
  import VersionHistoryTable from './VersionHistoryTable.svelte'
  import type { PageEditorVersionPreview } from '$lib'

  const dispatch = createEventDispatcher()

  export let dataId: string
  export let preview: ((version: PageEditorVersionPreview) => void)
  export let compare: ((version1: PageEditorVersionPreview, version2: PageEditorVersionPreview) => void)
  export let history: Promise<HistoryVersion[]>

  let selected = new Set<number>()

  function toPageEditorVersionPreview (v: number) {
    return { version: v, date: versionByIndex[v].date, modifiedBy: versionByIndex[v].user.name }
  }

  function visit () {
    if (selected.size === 1) {
      dispatch('escape')
      const [v] = selected
      preview(toPageEditorVersionPreview(v))
    } else if (selected.size === 2) {
      const [v1, v2] = selected
      dispatch('escape')
      const v1m = Math.min(v1, v2)
      const v2m = Math.max(v1, v2)
      compare(toPageEditorVersionPreview(v1m), toPageEditorVersionPreview(v2m))
    }
  }

  let oldversions: HistoryVersion[] | undefined
  function onMarked (e: { detail: HistoryVersion}) {
    oldversions = oldversions?.map(v => v.version === e.detail.version ? e.detail : v)
  }
  onMount(async () => {
    oldversions = await history
  })
  $: versionByIndex = keyby(oldversions, 'version')
  $: latest = oldversions?.[0]
  $: maxVersion = latest?.version ?? 0
  $: published = oldversions?.find(v => v.tags.includes('published'))
</script>

<Dialog continueText={selected.size > 1 ? 'Compare' : 'Preview'} cancelText="Cancel" disabled={selected.size < 1 || selected.size > 2} on:escape on:continue={visit}>
  <VersionHistoryTable bind:selected {maxVersion} versions={latest ? [latest] : []} title="Latest Version" {dataId} on:marked={onMarked} />
  <VersionHistoryTable bind:selected {maxVersion} versions={published ? [published] : []} title="Published Version" {dataId} on:marked={onMarked} />
  <VersionHistoryTable bind:selected {maxVersion} versions={(oldversions ?? []).filter(v => v.marked)} title="Marked Versions" {dataId} on:marked={onMarked} />
  <VersionHistoryTable bind:selected {maxVersion} versions={oldversions ?? []} title="All Versions" {dataId} on:marked={onMarked} />
</Dialog>
