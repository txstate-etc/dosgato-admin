import { Store, subStore } from '@txstate-mws/svelte-store'
import type { IconifyIcon } from '@iconify/svelte'

export interface IGlobalStore {
  subnav: { label: string, href: string, icon?: IconifyIcon }[]
}

class GlobalStore extends Store<IGlobalStore> {
  constructor () {
    super({ subnav: [] })
  }
}

export const globalStore = new GlobalStore()
export const subnav = subStore(globalStore, 'subnav')
