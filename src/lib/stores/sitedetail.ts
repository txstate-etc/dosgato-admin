import { Store } from '@txstate-mws/svelte-store'
import type { FullSite } from '$lib/queries'

interface ISiteDetailStore {
  site: FullSite
}

export class SiteDetailStore extends Store<ISiteDetailStore> {
  constructor (public fetchSite: (id: string) => Promise<FullSite>) {
    super({ site: { id: '', name: '' } })
  }

  async refresh (id: string) {
    const site = await this.fetchSite(id)
    this.set({ site })
    return site // TODO: Is there a better way to get the site name in the site detail page load function?
  }

  siteFetched () {
    return this.value.site.id.length > 0
  }
}
