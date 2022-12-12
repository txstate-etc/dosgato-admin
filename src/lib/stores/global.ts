import type { Feedback } from '@txstate-mws/svelte-forms'
import { Store, subStore } from '@txstate-mws/svelte-store'
import { randomid, sortby } from 'txstate-utils'
import type { GlobalSelf } from '$lib/queries'

export interface IGlobalStore {
  me: GlobalSelf['users'][number]
  access: Partial<GlobalSelf['access']>
  toasts: { id: string, message: string, type: Feedback['type'], stamp: Date, hidden: boolean }[]
}

export interface EnvironmentConfig {
  apiBase: string
  assetLiveBase: string
  assetRegex: RegExp
  authRedirect: string
  renderBase: string
}

class GlobalStore extends Store<IGlobalStore> {
  constructor () {
    super({ access: {}, me: { firstname: '', lastname: '' }, toasts: [] })
  }
}

export const globalStore = new GlobalStore()
export const environmentConfig: EnvironmentConfig = { apiBase: '', authRedirect: '', renderBase: '', assetLiveBase: '', assetRegex: /unused/ }
export const toasts = subStore(globalStore, 'toasts')
export const toast = (message: string, type: Feedback['type'] = 'error') => {
  globalStore.update(v => ({ ...v, toasts: sortby([...v.toasts.filter(t => t.message !== message), { id: randomid(), type, message, stamp: new Date(), hidden: false }], 'stamp', true) }))
  setTimeout(() => {
    const now = new Date()
    globalStore.update(v => ({ ...v, toasts: v.toasts.filter(t => t.stamp.getTime() > now.getTime() - 15000) }))
  }, 15500)
}
