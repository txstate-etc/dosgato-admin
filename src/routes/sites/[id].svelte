<script lang="ts" context="module">
  import type { Load } from '@sveltejs/kit'

  export const load: Load = async ({ params }) => {
    const site = await store.refresh(params.id)
    if (!store.siteFetched()) return { status: 404 }
    siteListStore.open({ id: params.id, name: site.name })
    return {}
  }

  async function getSite (id: string) {
    return await api.getSiteById(id)
  }

  const store = new SiteDetailStore(getSite)
</script>

<script lang="ts">
  import { api, SiteDetailStore, siteListStore } from '$lib'
</script>

<div>Site Details for {$store.site.name}</div>