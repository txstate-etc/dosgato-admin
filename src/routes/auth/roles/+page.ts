import { Store } from '@txstate-mws/svelte-store'
import { updateAuthSubnav } from '../authsubnav'

export const load = async () => {
  updateAuthSubnav('roles')
}

export const _roleFilterStore = new Store({ search: '' })
