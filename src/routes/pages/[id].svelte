<script lang="ts" context="module">
  import type { Load } from '@sveltejs/kit'
  import { api, pageEditorStore } from '$lib'

  export const load: Load = async ({ params }) => {
    const page = await api.getEditorPage(params.id)
    if (!page) return { status: 404 }
    pageEditorStore.open(page)
    return {}
  }
</script>

editing interface for a page
