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
  import { onMount } from 'svelte'
  import VersionHistoryTable from './VersionHistoryTable.svelte'
  import { goto } from '$app/navigation'

  export let dataId: string
  export let previewUrl: ((version: number) => string)
  export let compareUrl: ((version1: number, version2: number) => string)
  export let history: Promise<HistoryVersion[]>

  let selected = new Set<number>()

  function visit () {
    if (selected.size === 1) goto(previewUrl(selected.values()[0]))
    else if (selected.size === 2) {
      const [v1, v2] = selected
      goto(compareUrl(Math.min(v1, v2), Math.max(v1, v2)))
    }
  }

  let oldversions: HistoryVersion[] | undefined
  function onMarked (e: { detail: HistoryVersion}) {
    oldversions = oldversions?.map(v => v.version === e.detail.version ? e.detail : v)
  }
  onMount(async () => {
    oldversions = await history
  })
  $: latest = oldversions?.[0]
  $: published = oldversions?.find(v => v.tags.includes('published'))
</script>

<Dialog continueText={selected.size > 1 ? 'Compare' : 'Preview'} cancelText="Cancel" disabled={selected.size < 1 || selected.size > 2} on:escape on:continue={visit}>
  <VersionHistoryTable bind:selected versions={latest ? [latest] : []} title="Latest Version" {dataId} on:marked={onMarked} />
  <VersionHistoryTable bind:selected versions={published ? [published] : []} title="Published Version" {dataId} on:marked={onMarked} />
  <VersionHistoryTable bind:selected versions={oldversions ?? []} title="All Versions" {dataId} on:marked={onMarked} />
</Dialog>
