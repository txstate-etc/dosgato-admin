<script lang="ts">
  import { UploadUI, type MimeAccept } from '@dosgato/dialog'
  import { api, uploadWithProgress } from '$lib'

  export let title: string
  export let helptext: string | undefined = undefined
  export let uploadPath: string
  export let escapable = true
  export let mimeWhitelist: string[] = []
  export let mimeBlacklist: string[] = []
  export let acceptMime: MimeAccept | undefined = undefined

  async function uploader (files: File[], progress: (ratio: number) => void, signal: AbortSignal) {
    const data = new FormData()
    for (let i = 0; i < files.length; i++) {
      data.append('file' + i, files[i])
    }
    const { promise } = uploadWithProgress(
      uploadPath,
      { Authorization: `Bearer ${api.token!}` },
      data,
      progress,
      signal
    )
    await promise
  }
</script>

<!-- maxFiles is passed via $$props so the dialog's label logic can tell whether a limit was specified -->
<UploadUI {title} {helptext} maxFiles={$$props.maxFiles} {escapable} {mimeWhitelist} {mimeBlacklist} {acceptMime} {uploader} on:escape on:saved />
