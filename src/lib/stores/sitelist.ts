import { derivedStore, Store } from '@txstate-mws/svelte-store'
import { splice } from 'txstate-utils'

export interface SiteState {
  id: string
  name: string
}

export interface ISiteListStore {
  sites: SiteState[]
  active: number
}

class SiteListStore extends Store<ISiteListStore> {
  constructor () {
    super({ sites: [], active: -1 })
  }

  close (idx: number) {
    this.update(v => ({ ...v, sites: splice(v.sites, idx, 1), active: v.active > idx || idx === v.sites.length - 1 ? v.active - 1 : v.active }))
  }

  open (site: SiteState) {
    this.update(v => {
      let active = v.sites.findIndex(s => s.id === site.id)
      const sites = [...v.sites]
      if (active === -1) {
        sites.push(site)
        active = sites.length - 1
      }
      return { ...v, sites, active }
    })
  }
}

export const siteListStore = new SiteListStore()
export const siteStore = derivedStore(siteListStore, v => v.sites[v.active])
