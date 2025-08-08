import { Store } from '@txstate-mws/svelte-store'
import { updateAuthSubnav } from '../authsubnav'

export const load = async () => {
  updateAuthSubnav('system')
}

export const _userFilterStore = new Store({ search: '' })
