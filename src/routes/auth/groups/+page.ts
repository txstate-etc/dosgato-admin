import { Store } from '@txstate-mws/svelte-store'
import { updateAuthSubnav } from '../authsubnav'

export const load = async () => {
  updateAuthSubnav('groups')
}

export const _groupFilterStore = new Store({ search: '' })
