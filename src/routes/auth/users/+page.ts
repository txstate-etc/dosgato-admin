import { api } from '$lib'
import { Store } from '@txstate-mws/svelte-store'
import { updateAuthSubnav } from '../authsubnav'

export const load = async () => {
  updateAuthSubnav('users')
  const allTrainings = await api.getTrainings()
  return { allTrainings }
}

export const _userFilterStore = new Store({ search: '' })
