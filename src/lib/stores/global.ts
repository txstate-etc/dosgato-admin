import { Store, subStore } from '@txstate-mws/svelte-store'
import type { IconifyIcon } from '@iconify/svelte'
import type { GlobalSelf } from '$lib/queries'

export interface IGlobalStore {
  me: GlobalSelf['users'][number]
  access: Partial<GlobalSelf['access']>
}

export interface EnvironmentConfig {
  apiBase: string
  authRedirect: string
  renderBase: string
}

class GlobalStore extends Store<IGlobalStore> {
  constructor () {
    super({ access: {}, me: { name: '' } })
  }
}

export const globalStore = new GlobalStore()
export const environmentConfig: EnvironmentConfig = { apiBase: '', authRedirect: '', renderBase: '' }
