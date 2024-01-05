<script lang="ts">
  import { Dialog, FileIcon, Icon } from '@dosgato/dialog'
  import trashLight from '@iconify-icons/ph/trash-light'
  import { isNotNull, roundTo, unique } from 'txstate-utils'
  import { api, uploadWithProgress } from '$lib'
  import { createEventDispatcher } from 'svelte'

  export let title: string
  export let helptext: string | undefined = undefined
  export let uploadPath: string
  export let maxFiles: number = 200
  export let escapable = true
  export let mimeWhitelist: string[] = []
  export let mimeBlacklist: string[] = []
  $: whitelist = new Set(mimeWhitelist)
  $: blacklist = new Set(mimeBlacklist)

  const dispatch = createEventDispatcher()

  let dragover = 0
  let uploadList: File[] = []
  let uploadLocked = false
  let uploadProgress = 0
  let uploadError: string | undefined

  let tooManyFiles = false

  function onUploadEnter (e: DragEvent) {
    if (e.dataTransfer?.items.length) dragover++
  }

  function onUploadLeave (e: DragEvent) {
    if (e.dataTransfer?.items.length) dragover--
  }

  function onUploadDrop (e: DragEvent) {
    e.preventDefault()
    dragover = 0
    if (!uploadLocked && e.dataTransfer?.items?.length) {
      tooManyFiles = e.dataTransfer?.items?.length > maxFiles
      uploadList = unique(uploadList.concat(Array.from(e.dataTransfer.files)), 'name').slice(-1 * maxFiles)
    }
  }

  function onUploadChange (e: InputEvent & { currentTarget: HTMLInputElement }) {
    const files = e.currentTarget.files
    if (files?.length) {
      tooManyFiles = files.length > maxFiles
      uploadList = unique(uploadList.concat(Array.from(files)), 'name').slice(-1 * maxFiles)
    }
    e.currentTarget.value = ''
  }

  async function onUploadSubmit () {
    if (uploadLocked) return
    uploadLocked = true
    try {
      const data = new FormData()
      for (let i = 0; i < uploadList.length; i++) {
        data.append('file' + i, uploadList[i])
      }

      await uploadWithProgress(
        uploadPath,
        { Authorization: `Bearer ${api.token}` },
        data,
        ratio => { uploadProgress = ratio }
      )
      uploadList = []
      uploadError = undefined
      dispatch('saved')
    } catch (e: any) {
      uploadError = e.message
    } finally {
      uploadLocked = false
    }
  }

  function onUploadEscape () {
    if (!uploadLocked && escapable) {
      uploadList = []
      uploadError = undefined
      dispatch('escape')
    }
  }

  function onDeleteFile (file: File) {
    return () => {
      uploadList = uploadList.filter(f => f !== file)
    }
  }

  let typeNotAllowedErrors: HTMLDivElement[] = []
</script>

<Dialog {title} disabled={!uploadList.length || !!typeNotAllowedErrors.filter(isNotNull).length} cancelText="Cancel" continueText="Upload" on:escape={onUploadEscape} on:continue={onUploadSubmit}>
  {#if uploadLocked}
    <progress value={uploadProgress} aria-label="Assets Uploading">{roundTo(100 * uploadProgress)}%</progress>
  {:else}
    {#if uploadError}<div class="error">{uploadError}</div>{/if}
    <form method="POST" enctype="multipart/form-data"
      action={uploadPath}
      on:submit|preventDefault|stopPropagation={onUploadSubmit}
      class="uploader" class:dragover={dragover > 0}
      on:dragenter={onUploadEnter} on:dragleave={onUploadLeave}
      on:dragover|preventDefault={() => {}} on:drop={onUploadDrop}
    >
      <input type="file" id="uploader_input" multiple on:change={onUploadChange}>
      <label for="uploader_input">Choose or drag {$$props.maxFiles ? `${maxFiles > 1 ? `up to ${maxFiles}` : 'a'}` : ''} file{maxFiles === 1 ? '' : 's'}</label>
      <ul>
        {#each uploadList as file, i}
          <li>
            <FileIcon width="1.5em" mime={file.type} inline />{file.name}{#if maxFiles > 1}<button type="button" on:click={onDeleteFile(file)}><Icon icon={trashLight} width="1.5em" hiddenLabel="Remove File" inline /></button>{/if}
            {#if (whitelist.size && !whitelist.has(file.type)) || (blacklist.size && blacklist.has(file.type))}
              <div bind:this={typeNotAllowedErrors[i]} class="error">File type not allowed</div>
            {/if}
          </li>
        {/each}
      </ul>
      {#if tooManyFiles}
        <div class="error left">Only {maxFiles} file{#if maxFiles !== 1}s{/if} allowed.</div>
      {/if}
    </form>
    {helptext ?? ''}
  {/if}
</Dialog>

<style>
  .uploader {
    border: 2px dashed #666666;
    border-radius: 0.5em;
    text-align: center;
    padding: 1em;
    min-height: 10em;
    margin-bottom: 0.5em;
  }
  .uploader.dragover {
    border-color: #333333;
  }
  .uploader ul {
    padding: 0;
    margin: 0;
    list-style: none;
    text-align: left;
  }
  progress {
    width: 80%;
    margin-left: 10%;
  }
  input[type="file"] {
    opacity: 0;
    display: block;
  }
  label {
    display: inline-block;
    width: 50%;
    padding: 1em;
    background: #ccc;
    cursor: pointer;
    border-radius: 5px;
    border: 1px solid #ccc;
    margin-bottom: 1em;
  }
  input:focus + label {
    outline: 2px solid blue;
  }
  .error {
    color: red;
  }
  .error.left {
    text-align: left;
  }
  button {
    border: 0;
    background: none;
    padding: 0.5em;
    cursor: pointer;
  }
  li {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
  }
  li div {
    width: 100%;
  }
</style>
