<script lang="ts" context="module">
  import { DateTime } from 'luxon'
  function formatDateTime (dt: DateTime) {
    return dt.toLocaleString(DateTime.DATETIME_SHORT)
  }
</script>
<script lang="ts">
  import { Button } from '@dosgato/dialog'
  import type { ValidationFeedback } from '@dosgato/templating'
  import { OffsetStore, ResizeStore, offset, resize } from '@txstate-mws/svelte-components'
  import { createEventDispatcher } from 'svelte'
  import { api, environmentConfig, type PageEditorPage, type PageEditorVersionPreview } from '$lib'

  export let version: PageEditorVersionPreview | undefined
  export let latestVersion: number
  export let publishedVersion: number | undefined
  export let page: PageEditorPage
  export let sidebyside = false

  const dispatch = createEventDispatcher()

  $: previewDesc = version
    ? (version?.version === latestVersion
        ? 'Latest '
        : version.version === publishedVersion
          ? 'Published '
          : ''
      ) + 'Version: ' + formatDateTime(version.date)
    : ''
  const offsetStore = new OffsetStore()
  const footerSize = new ResizeStore()
  const headerSize = new ResizeStore()
  let restoreFeedback: ValidationFeedback[] = []
  let lastValidatedRestoreVersion: number | undefined
  async function reactToPreviewing (..._: any[]) {
    if (version == null) return
    const saveVersion = version.version
    if (saveVersion != null && lastValidatedRestoreVersion !== saveVersion) {
      const response = await api.restorePage(page.id, saveVersion, true)
      if (version.version === saveVersion) {
        restoreFeedback = response.messages
        lastValidatedRestoreVersion = saveVersion
      }
    }
  }
  $: reactToPreviewing(version)
</script>

{#if version}
  <section class="preview" class:sidebyside use:offset={{ store: offsetStore }}>
    <header use:resize={{ store: headerSize }}>
      <div>{previewDesc}</div>
      <div>Modified By: {version.modifiedBy}</div>
    </header>
    <iframe style:height="calc(100dvh - {$offsetStore.top}px - {$footerSize.clientHeight}px - {$headerSize.clientHeight}px - 2em)" src="{environmentConfig.renderBase}/.preview/{version.version}{page.path}?token={api.token}" title="page preview for restoring"></iframe>
    <footer use:resize={{ store: footerSize }}>
      <div class="restore-feedback">{#if restoreFeedback.length && version.version !== latestVersion}{#each restoreFeedback as msg}<div>{msg.message}</div>{/each}{:else}&nbsp;{/if}</div>
      <Button type="button" cancel on:click={() => { dispatch('cancel') }}>Cancel</Button>
      <Button type="button" on:click={() => { dispatch('restore', version?.version) }} disabled={restoreFeedback.filter(f => f.type === 'error').length > 0}>Restore this version</Button>
    </footer>
  </section>
{/if}

<style>
  .preview {
    max-width: 75em;
  }
  .preview.sidebyside {
    width: calc(50% - 1em);
  }
  .preview:not(.sidebyside) {
    width: 100%;
    margin: auto;
  }
  .preview header {
    display: flex;
    justify-content: space-between;
    font-size: 1.1em;
    font-weight: 500;
    padding: 1em 1em 0.5em 1em;
  }
  .preview iframe {
    width: 100%;
    border: 1px solid #CCCCCC;
  }
  .preview footer {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
  }
  .preview footer :global(button) {
    margin: 0 0.5em;
  }
  .restore-feedback {
    text-align: center;
    color: var(--dosgato-red, #9a3332);
    width: 100%;
    line-height: 1.2;
    padding: 0.6em 0;
  }
</style>
