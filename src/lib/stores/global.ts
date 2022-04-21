import { Store, subStore } from '@txstate-mws/svelte-store'
import type { IconifyIcon } from '@iconify/svelte'
import type { GlobalSelf } from '$lib/queries'

export interface IGlobalStore {
  subnav: SubNavLink[]
  me: GlobalSelf['users'][number]
  access: Partial<GlobalSelf['access']>
}

export interface SubNavLink {
  label: string
  href: string
  icon?: IconifyIcon
  onClose?: (idx: number) => void|Promise<void>
}

class GlobalStore extends Store<IGlobalStore> {
  constructor () {
    super({ subnav: [], access: {}, me: { name: '' } })
  }
}

export const globalStore = new GlobalStore()
export const subnav = subStore(globalStore, 'subnav')
